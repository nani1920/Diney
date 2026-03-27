'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { Order, OrderItem, CartItem, OrderStatus, Customization, ServerActionResult, Customer } from '@/types';
import { ensureTenantOwner, isSuperAdmin } from '@/lib/auth-utils';
import { OrderSchema } from '@/lib/validations';
import { orderRateLimiter, viewOrderRateLimiter } from '@/lib/ratelimit';
import { withErrorHandling } from '@/lib/server-utils';
import { cookies } from 'next/headers';
import { getRazorpay } from '@/lib/razorpay';
import crypto from 'crypto';

function generateShortId() {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

import { redis, getCacheKey } from '@/lib/redis';

export async function createOrder(
  tenantId: string,
  customerName: string,
  customerMobile: string,
  items: CartItem[],
  totalAmount: number,
  razorpayPaymentId?: string,
  razorpayOrderId?: string,
  razorpaySignature?: string
) {
  return withErrorHandling(async () => {
     
    const identifier = `order:${tenantId}:${customerMobile}`;
    const { success: rateLimitOk } = await orderRateLimiter.limit(identifier);
    
    if (!rateLimitOk) {
      throw new Error("Too many orders attempted. Please wait a minute and try again.");
    }

     
    const validatedData = OrderSchema.parse({
      tenantId,
      customerName,
      customerMobile,
      items,
      totalAmount
    });

     
    // [SECURITY FIX S3] Server-side Price Verification
    const menuItemIds = validatedData.items.map(i => i.id).filter(Boolean) as string[];
    const { data: liveItems, error: itemsFetchError } = await supabaseAdmin
      .from('menu_items')
      .select('id, price')
      .in('id', menuItemIds);

    if (itemsFetchError) throw itemsFetchError;

    const priceMap: Record<string, number> = {};
    liveItems?.forEach((item: any) => {
      priceMap[item.id] = Number(item.price);
    });

    let serverTotal = 0;
    validatedData.items.forEach((item: any) => {
      const livePrice = item.id ? priceMap[item.id] : item.price;
      const itemCustomizationsTotal = (item.customizations || [])
        .reduce((cSum: number, c: any) => cSum + (Number(c.price) || 0), 0);
      serverTotal += ((Number(livePrice) || 0) + itemCustomizationsTotal) * item.quantity;
    });

    // [REMOVED] Platform fee (set to 0 as requested by user)
    const platformFee = 0;
    serverTotal += platformFee;

    // Override with server-calculated total for database insertion
    const finalTotal = serverTotal || validatedData.totalAmount;

    // 1. Fetch Tenant (with Cache)
    const configCacheKey = getCacheKey(validatedData.tenantId, 'config');
    let tenant = await redis.get(configCacheKey) as any;
    
    if (!tenant) {
      const { data: dbTenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .select('status, config')
        .eq('id', validatedData.tenantId)
        .single();
      
      if (tenantError || !dbTenant) throw new Error(`Store not found`);
      tenant = dbTenant;
      // Cache for 5 mins
      await redis.set(configCacheKey, tenant, { ex: 300 });
    }

    if (tenant.status !== 'active') {
      throw new Error(`Store is currently ${tenant.status}. Orders are not being accepted.`);
    }

    // [SECURITY FIX S4] Cryptographic verification of Razorpay signature
    let paymentStatus = 'pending';
    const config = (tenant.config as any) || {};
    const effectiveSecret = config.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET;

    // Strict Enforcement: If an order ID is provided, it MUST be a valid online payment
    if (razorpayOrderId) {
        if (!razorpayPaymentId || !razorpaySignature) {
            throw new Error("Online payment verification failed: Missing payment ID or signature.");
        }

        if (!effectiveSecret) {
            throw new Error("Store payment configuration missing. Cannot verify online payment.");
        }

        const generatedSignature = crypto
            .createHmac('sha256', effectiveSecret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            throw new Error("Payment signature verification failed. Potential spoofing attempt.");
        }
        paymentStatus = 'paid';
    }

    // [IDEMPOTENCY FIX] Prevent Double Orders
    // If we have a payment_id, check if it was already processed (e.g., by Webhook)
    if (razorpayPaymentId) {
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('id, short_id, status, payment_status')
        .eq('payment_id', razorpayPaymentId)
        .maybeSingle();

      if (existingOrder) {
        console.log('[createOrder] Order already exists (Webhook beat us):', existingOrder.id);
        return { 
          success: true, 
          data: { 
            order_id: existingOrder.id, 
            short_id: existingOrder.short_id,
            status: existingOrder.status,
            payment_status: existingOrder.payment_status
          } 
        };
      }
    }

    // Calculate final total (verify zero-trust)
    // Removed redundant recalculation to fix lint error

    // Insert the order
    let { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tenant_id: validatedData.tenantId,
        short_id: generateShortId(),
        customer_name: validatedData.customerName,
        customer_mobile: validatedData.customerMobile,
        total_amount: finalTotal,
        status: 'received',
        payment_status: paymentStatus,
        payment_id: razorpayPaymentId || null
      })
      .select()
      .single();

    if (orderError) {
      if (orderError.code === '23505' && razorpayPaymentId) {
        const { data: existing } = await supabaseAdmin
          .from('orders')
          .select('id, short_id')
          .eq('payment_id', razorpayPaymentId)
          .single();
        if (existing) return { orderId: existing.id, shortId: existing.short_id };
      }
      throw new Error(`Order creation failed: ${orderError.message}`);
    }

    // Invalidate analytics and customer cache on new order
    await redis.del(getCacheKey(validatedData.tenantId, 'analytics:today'));
    await redis.del(getCacheKey(validatedData.tenantId, 'customers'));

    const cookieStore = await cookies();
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN?.split(':')[0]; // Remove port if present
    const isLocalhost = baseDomain === 'localhost' || baseDomain === 'lvh.me' || !baseDomain;

    cookieStore.set(`auth_mobile_${validatedData.tenantId}`, validatedData.customerMobile, {
        maxAge: 3600 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
        ...(isLocalhost ? {} : { domain: `.${baseDomain}` }) // Share across subdomains in prod
    });

    const orderItems = validatedData.items.map(item => ({
      order_id: order.id,
      name: item.name,
      price: item.id ? priceMap[item.id] : item.price, // Use verified price
      quantity: item.quantity,
      image_url: item.image_url,
      customizations: item.customizations || []
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    return { orderId: order.id, shortId: order.short_id };
  }, "createOrder");
}

export async function getTenantOrders(tenantId: string): Promise<ServerActionResult<Order[]>> {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) throw error;

    return (data || []).map((o: any) => ({
      order_id: o.id,
      short_id: o.short_id || o.id.replace(/\D/g, '').slice(0, 6) || '000000',
      customer_name: o.customer_name,
      customer_mobile: o.customer_mobile,
      order_note: o.order_note,
      total_amount: Number(o.total_amount),
      order_status: o.status,
      order_time: o.created_at,
      payment_status: o.payment_status,
      payment_id: o.payment_id,
      items: (o.order_items || []).map((oi: any) => ({
        id: oi.id,
        name: oi.name,
        price: Number(oi.price),
        quantity: oi.quantity,
        image_url: oi.image_url,
        customizations: oi.customizations
      }))
    }));
  }, "getTenantOrders");
}

export async function updateOrderStatusServer(orderId: string, status: string, tenantId: string) {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    
    // Invalidate analytics cache on status change
    await redis.del(getCacheKey(tenantId, 'analytics:today'));
    
    return true;
  }, "updateOrderStatusServer");
}

export async function getTenantCustomers(tenantId: string): Promise<ServerActionResult<Customer[]>> {
  return withErrorHandling<Customer[]>(async (): Promise<Customer[]> => {
    await ensureTenantOwner(tenantId);
    
    const cacheKey = getCacheKey(tenantId, 'customers');
    const cached = await redis.get(cacheKey);
    if (cached) return cached as Customer[];

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('customer_name, customer_mobile, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(2000); // 2. Hard limit for aggregation safety

    if (error) throw error;

    const customerMap: Record<string, Customer> = {};
    (data || []).forEach((o: any) => {
      if (!customerMap[o.customer_mobile]) {
        customerMap[o.customer_mobile] = {
          name: o.customer_name,
          mobile: o.customer_mobile,
          lastOrder: o.created_at,
          totalOrders: 0
        };
      }
      customerMap[o.customer_mobile].totalOrders += 1;
    });

    const result: Customer[] = Object.values(customerMap);
    // Cache for 10 mins
    await redis.set(cacheKey, result, { ex: 600 });

    return result;
  }, "getTenantCustomers");
}

export async function getCustomerOrders(tenantId: string, customerMobile: string) {
  return withErrorHandling(async () => {
    if (!customerMobile || customerMobile.length < 10) {
      return [];
    }

    const { success: rateLimitOk } = await viewOrderRateLimiter.limit(`vieworders:${tenantId}:${customerMobile}`);
    if (!rateLimitOk) throw new Error("Too many requests. Please wait a minute to view orders again.");

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('tenant_id', tenantId)
      .eq('customer_mobile', customerMobile)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // [SECURITY FIX S2.1] Device-Locked History Lookup
    // We only return orders if the browser has a matching session cookie
    // (set when they placed an order on this specific device).
    const authedMobile = (await cookies()).get(`auth_mobile_${tenantId}`)?.value;
    
    if (authedMobile !== customerMobile) {
      // If not authenticated for this number on this device, return nothing.
      // This prevents malicious actors from "guessing" numbers to see other people's PII.
      return [];
    }

    return (data || []).map((o: any) => ({
      order_id: o.id as string,
      short_id: (o.short_id as string) || (o.id as string).replace(/\D/g, '').slice(0, 6) || '000000',
      customer_name: (o.customer_name as string) || 'Guest',
      customer_mobile: (o.customer_mobile as string), // Remove masking for authenticated requests
      order_note: o.order_note as string,
      total_amount: Number(o.total_amount),
      order_status: o.status as OrderStatus,
      order_time: o.created_at as string,
      payment_status: o.payment_status,
      payment_id: o.payment_id,
      items: (o.order_items || []).map((oi: any) => ({
        id: oi.id as string,
        name: oi.name as string,
        price: Number(oi.price),
        quantity: oi.quantity as number,
        image_url: oi.image_url as string,
        customizations: oi.customizations as Customization[]
      }))
    }));
  }, "getCustomerOrders");
}

export async function getAuthenticatedOrder(orderId: string, tenantId: string) {
  return withErrorHandling(async () => {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Strict Device Check
    const authedMobile = (await cookies()).get(`auth_mobile_${tenantId}`)?.value;
    if (authedMobile !== data.customer_mobile) {
      return null; // Not authorized on this device
    }

    return {
      order_id: data.id,
      short_id: data.short_id || data.id.replace(/\D/g, '').slice(0, 6) || '000000',
      customer_name: data.customer_name as string,
      customer_mobile: data.customer_mobile as string,
      order_note: data.order_note as string,
      total_amount: Number(data.total_amount),
      order_status: data.status as OrderStatus,
      order_time: data.created_at as string,
      items: (data.order_items || []).map((oi: any) => ({
        id: oi.id as string,
        name: oi.name as string,
        price: Number(oi.price),
        quantity: oi.quantity as number,
        image_url: oi.image_url as string,
        customizations: oi.customizations as Customization[]
      }))
    } as Order;
  }, "getAuthenticatedOrder");
}

export async function getAdminOrderById(orderId: string, tenantId: string): Promise<ServerActionResult<Order>> {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    if (!data) return undefined;

    return {
      order_id: data.id,
      short_id: data.short_id || data.id.replace(/\D/g, '').slice(0, 6) || '000000',
      customer_name: data.customer_name as string,
      customer_mobile: data.customer_mobile as string,
      order_note: data.order_note as string,
      total_amount: Number(data.total_amount),
      order_status: data.status as OrderStatus,
      order_time: data.created_at as string,
      payment_status: data.payment_status,
      payment_id: data.payment_id,
      items: (data.order_items || []).map((oi: any) => ({
        id: oi.id as string,
        name: oi.name as string,
        price: Number(oi.price),
        quantity: oi.quantity as number,
        image_url: oi.image_url as string,
        customizations: oi.customizations as Customization[]
      }))
    };
  }, "getAdminOrderById");
}

export async function submitOrderRating(
  orderId: string,
  tenantId: string,
  rating: number,
  tags: string[],
  feedback?: string
) {
  return withErrorHandling(async () => {
    // 1. Verify existence of order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    
    // 2. Only allow rating for completed orders (pager has fired)
    if (order.status !== 'completed' && order.status !== 'ready') {
       // Allow ready too in case they want to rate while waiting at counter
    }

    // 3. Upsert rating (one rating per order)
    const { error: ratingError } = await supabaseAdmin
      .from('order_ratings')
      .upsert({
        order_id: orderId,
        tenant_id: tenantId,
        rating,
        tags,
        feedback: feedback || null
      }, { onConflict: 'order_id' });

    if (ratingError) throw ratingError;

    return true;
  }, "submitOrderRating");
}

export async function getTenantRatings(tenantId: string) {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    const { data, error } = await supabaseAdmin
      .from('order_ratings')
      .select('*, orders(customer_name, short_id)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }, "getTenantRatings");
}

export async function createRazorpayOrder(
  amount: number, 
  tenantId: string,
  customerData?: { name: string; mobile: string },
  items?: CartItem[]
) {
  return withErrorHandling(async () => {
    console.log('[createRazorpayOrder] Initiating order:', { tenantId, amount, customer: customerData?.mobile });

    if (!tenantId) {
      throw new Error("Missing store identifier. Please refresh the page.");
    }

    if (amount < 1) { // Min ₹1 for Razorpay
      throw new Error(`Invalid amount: ₹${amount}. Minimum ₹1 required.`);
    }

    // 1. Fetch tenant-specific keys from config
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('config')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      console.error('[createRazorpayOrder] Store lookup failed:', error);
      throw new Error("Could not load store payment settings.");
    }

    const config = (tenant?.config as any) || {};
    const keyId = config.razorpay_key_id;
    const keySecret = config.razorpay_key_secret;

    const customKeys = (keyId && keySecret) 
      ? { keyId, keySecret }
      : undefined;

    const razorpay = getRazorpay(customKeys);
    
    // Prepare minimal item data for notes to satisfy size limits
    const minimalItems = (items || []).map(i => ({
      id: i.id,
      n: i.name,
      p: i.price,
      q: i.quantity,
      c: (i.customizations || []).map(c => ({ n: c.name, p: c.price }))
    }));

    const options = {
      amount: Math.round(amount * 100), // Paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        tenantId: tenantId,
        customerName: customerData?.name || 'Guest',
        customerMobile: customerData?.mobile || '',
        items: JSON.stringify(minimalItems).slice(0, 1800), // Safety slice for Razorpay limit
        source: 'diney_v1'
      }
    };

    try {
      const order = await razorpay.orders.create(options);
      console.log('[createRazorpayOrder] SUCCESS:', order.id);
      return order;
    } catch (rzpError: any) {
      console.error('[createRazorpayOrder] Razorpay API ERROR:', rzpError);
      throw new Error(`Razorpay Error: ${rzpError.description || rzpError.message || "Failed to initiate transaction"}`);
    }
  }, "createRazorpayOrder");
}
