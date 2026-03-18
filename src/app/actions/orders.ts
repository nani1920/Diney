'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { Order, CartItem } from '@/types';
import { ensureTenantOwner } from '@/lib/auth-utils';
import { OrderSchema } from '@/lib/validations';
import { orderRateLimiter } from '@/lib/ratelimit';
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
    // 1. Rate Limiting (by tenantId and customerMobile)
    const identifier = `order:${tenantId}:${customerMobile}`;
    const { success: rateLimitOk } = await orderRateLimiter.limit(identifier);
    
    if (!rateLimitOk) {
      throw new Error("Too many orders attempted. Please wait a minute and try again.");
    }

    // 2. Data Validation
    const validatedData = OrderSchema.parse({
      tenantId,
      customerName,
      customerMobile,
      items,
      totalAmount
    });

    // 3. Verify Tenant Status
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

    // 4. Create the primary order record
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

    // 5. Insert order items
    const orderItems = validatedData.items.map(item => ({
      order_id: order.id,
      menu_item_id: item.id || null, // Best effort link
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      customizations: item.customizations
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

export async function getTenantOrders(tenantId: string) {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

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
        id: oi.menu_item_id,
        name: oi.name,
        price: Number(oi.price),
        quantity: oi.quantity,
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
