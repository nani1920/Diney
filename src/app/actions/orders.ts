'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { Order, CartItem, Customer, ServerActionResult } from '@/types';
import { ensureTenantOwner } from '@/lib/auth-utils';
import { OrderSchema } from '@/lib/validations';
import { orderRateLimiter, viewOrderRateLimiter } from '@/lib/ratelimit';
import { withErrorHandling } from '@/lib/server-utils';

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
  totalAmount: number
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

     
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tenant_id: validatedData.tenantId,
        short_id: generateShortId(),
        customer_name: validatedData.customerName,
        customer_mobile: validatedData.customerMobile,
        total_amount: validatedData.totalAmount,
        status: 'received'
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error(`Order creation failed`);
    }

     
    const orderItems = validatedData.items.map(item => ({
      order_id: order.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error inserting order items:', itemsError);
    }

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

    return (data || []).map((o: any) => ({
      order_id: o.id,
      short_id: o.short_id || o.id.replace(/\D/g, '').slice(0, 6) || '000000',
      customer_name: o.customer_name,
      customer_mobile: o.customer_mobile,
      order_note: o.order_note,
      total_amount: Number(o.total_amount),
      order_status: o.status,
      order_time: o.created_at,
      items: (o.order_items || []).map((oi: any) => ({
        id: oi.id,
        name: oi.name,
        price: Number(oi.price),
        quantity: oi.quantity,
        image_url: oi.image_url,
        customizations: oi.customizations
      }))
    }));
  }, "getCustomerOrders");
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
      customer_name: data.customer_name,
      customer_mobile: data.customer_mobile,
      order_note: data.order_note,
      total_amount: Number(data.total_amount),
      order_status: data.status,
      order_time: data.created_at,
      items: (data.order_items || []).map((oi: any) => ({
        id: oi.id,
        name: oi.name,
        price: Number(oi.price),
        quantity: oi.quantity,
        image_url: oi.image_url,
        customizations: oi.customizations
      }))
    };
  }, "getOrderById");
}
