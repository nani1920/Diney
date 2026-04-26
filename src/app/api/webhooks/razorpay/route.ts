
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // 1. Verify Signature
    // For Multi-Tenant, we ideally use a Platform Webhook Secret
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    
    if (!secret) {
        console.error('[Webhook] Missing RAZORPAY_WEBHOOK_SECRET');
        return NextResponse.json({ error: 'Config error' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('[Webhook] Signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    
    console.log(`[Webhook] Received Razorpay Event: ${event}`);

    // We care about order.paid or payment.captured
    if (event === 'order.paid' || event === 'payment.captured') {
        const payment = payload.payload.payment.entity;
        const razorpayPaymentId = payment.id;
        const razorpayOrderId = payment.order_id;
        const notes = payment.notes || {};

        if (notes.source !== 'diney_v1') {
            return NextResponse.json({ message: 'Irrelevant source' });
        }

        const tenantId = notes.tenantId;
        const customerName = notes.customerName;
        const customerMobile = notes.customerMobile;
        const itemsJson = notes.items;

        if (!tenantId || !itemsJson) {
            console.error('[Webhook] Missing metadata in notes', notes);
            return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        // 2. Check if order already exists in our DB
        const { data: existingOrder } = await supabaseAdmin
            .from('orders')
            .select('id, payment_status')
            .eq('payment_id', razorpayPaymentId)
            .maybeSingle();

        if (existingOrder) {
            if (existingOrder.payment_status !== 'paid') {
                await supabaseAdmin
                    .from('orders')
                    .update({ payment_status: 'paid' })
                    .eq('id', existingOrder.id);
            }
            return NextResponse.json({ received: true, status: 'updated' });
        }

        // 3. RECREATE ORDER (The Resilience Fix)
        // If we reach here, the customer paid but the browser never called our createOrder action
        
        // IMPORTANT: Only recreate if it's payment.captured to avoid multiple webhook events contesting
        if (event !== 'payment.captured') {
            return NextResponse.json({ received: true, status: 'ignored_recreate_on_paid' });
        }

        console.log(`[Webhook] RECREATING ORDER for ${customerMobile} (${tenantId})`);

        const items = JSON.parse(itemsJson);
        const menuItemIds = items.map((i: any) => i.id).filter(Boolean);

        // Fetch live prices to prevent price manipulation
        const { data: liveItems } = await supabaseAdmin
            .from('menu_items')
            .select('id, price')
            .in('id', menuItemIds);

        const priceMap: Record<string, number> = {};
        liveItems?.forEach((item: any) => {
            priceMap[item.id] = Number(item.price);
        });

        let totalAmount = 0;
        items.forEach((i: any) => { 
            const livePrice = i.id ? (priceMap[i.id] || 0) : Number(i.p);
            const itemBaseTotal = livePrice * i.q;
            const customizationTotal = (i.c || []).reduce((sum: number, c: any) => sum + (Number(c.p) || 0) * i.q, 0);
            totalAmount += itemBaseTotal + customizationTotal;
        });

        // Insert Order (with Sanitization)
        const { data: newOrder, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                tenant_id: tenantId,
                customer_name: customerName.slice(0, 100),
                customer_mobile: customerMobile.slice(0, 15),
                total_amount: totalAmount,
                status: 'received',
                payment_status: 'paid',
                payment_id: razorpayPaymentId,
                short_id: Math.random().toString().slice(2, 8) // Fallback short ID
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Insert Order Items
        const orderItems = items.map((i: any) => ({
            order_id: newOrder.id,
            name: i.n,
            price: i.id ? (priceMap[i.id] || 0) : Number(i.p),
            quantity: i.q,
            customizations: i.c || []
        }));

        const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
        if (itemsError) console.error('[Webhook] order_items insert error:', itemsError);
        
        console.log(`[Webhook] Order successfully recovered: ${newOrder.id}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Webhook] Error processing Razorpay webhook:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
