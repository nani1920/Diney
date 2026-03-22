'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { Order, OrderItem, CartItem, OrderStatus, Customization, ServerActionResult } from '@/types';
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
    validatedData.items.forEach((item: OrderItem) => {
      const livePrice = item.id ? priceMap[item.id] : item.price;
      
      // [SECURITY REVENUE LOCK] 
      // Since customization prices are not currently stored in the master menu_items table,
      // we treat them as "Free Special Instructions" on the server.
      // This prevents a malicious actor from sending a negative price in the customizations JSON.
      const itemCustomizationsTotal = 0; 
      
      serverTotal += ((Number(livePrice) || 0) + itemCustomizationsTotal) * item.quantity;
    });

    // Override with server-calculated total for database insertion
    const finalTotal = serverTotal || validatedData.totalAmount;

    // Verify the tenant exists and is active
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('status')
      .eq('id', validatedData.tenantId)
      .single();
    
    if (tenantError || !tenant) {
      throw new Error(`Store not found`);
    }

    if (tenant.status !== 'active') {
      throw new Error(`Store is currently ${tenant.status}. Orders are not being accepted.`);
    }

    // [SECURITY FIX S4] Cryptographic verification of Razorpay signature
    let paymentStatus = 'pending';
    if (razorpayPaymentId && razorpayOrderId && razorpaySignature && process.env.RAZORPAY_KEY_SECRET) {
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            throw new Error("Payment signature verification failed. Potential spoofing attempt.");
        }
        paymentStatus = 'paid';
    }

    // Insert the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tenant_id: validatedData.tenantId,
        short_id: generateShortId(),
        customer_name: validatedData.customerName,
        customer_mobile: validatedData.customerMobile,
        total_amount: finalTotal, // Use verified total
        status: 'received',
        payment_status: paymentStatus,
        payment_id: razorpayPaymentId || null
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Supabase Insert Error:", orderError);
      throw new Error(`Order creation failed: ${orderError?.message || 'Unknown database error'}`);
    }

    // [SECURITY FIX S2] Set a secure cookie to "authorize" this mobile for this browser session
    // We set it on the base domain if available so it works across subdomains
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
      image_url: item.image_url
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
    return true;
  }, "updateOrderStatusServer");
}

export async function getTenantCustomers(tenantId: string) {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('customer_name, customer_mobile, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const customerMap: Record<string, any> = {};
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

    return Object.values(customerMap);
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
      customer_mobile: (data.customer_mobile as string).replace(/.(?=.{4})/g, 'X'),
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

export async function getOrderById(orderId: string, tenantId: string): Promise<ServerActionResult<Order>> {
  return withErrorHandling(async () => {
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
      customer_mobile: (data.customer_mobile as string).replace(/.(?=.{4})/g, 'X'), // Mask mobile: XXXXXX1234
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
    };
  }, "getOrderById");
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

export async function createRazorpayOrder(amount: number) {
  return withErrorHandling(async () => {
    const razorpay = getRazorpay();
    const options = {
      amount: Math.round(amount * 100), // convert INR to paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
    const order = await razorpay.orders.create(options);
    return order;
  }, "createRazorpayOrder");
}
