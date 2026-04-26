'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { Order, OrderItem, CartItem, OrderStatus, Customization, ServerActionResult, Customer } from '@/types';
import { ensureAdminOrStaff, isSuperAdmin } from '@/lib/auth-utils';
import { OrderSchema } from '@/lib/validations';
import { orderRateLimiter, viewOrderRateLimiter } from '@/lib/ratelimit';
import { withErrorHandling } from '@/lib/server-utils';
import { cookies } from 'next/headers';
import { getRazorpay } from '@/lib/razorpay';
import crypto from 'crypto';
import { redis, getCacheKey } from '@/lib/redis';

import { SignJWT, jwtVerify } from 'jose';
import xss from 'xss';

const CUSTOMER_AUTH_SECRET = new TextEncoder().encode(
  process.env.STAFF_JWT_SECRET || 'customer-fallback-secret-for-dev'
);

function generateShortId() {
  // Use crypto for secure random numbers
  return crypto.randomInt(100000, 999999).toString();
}

export async function createOrder(
  tenantId: string,
  customerName: string,
  customerMobile: string,
  items: CartItem[],
  totalAmount: number,
  razorpayPaymentId?: string,
  razorpayOrderId?: string,
  razorpaySignature?: string,
  orderType?: 'TAKEAWAY' | 'DINE_IN',
  tableNumber?: string
) {
  return withErrorHandling(async () => {
    // 0. Sanitize Inputs (XSS Protection)
    const safeName = xss(customerName).slice(0, 100);
    const safeMobile = xss(customerMobile).slice(0, 15);
    const safeTable = tableNumber ? xss(tableNumber).slice(0, 10) : null;

    const identifier = `order:${tenantId}:${customerMobile}`;
    const { success: rateLimitOk } = await orderRateLimiter.limit(identifier);

    if (!rateLimitOk) {
      throw new Error("Too many orders attempted. Please wait a minute and try again.");
    }

    const validatedData = OrderSchema.parse({
      tenantId,
      customerName: safeName,
      customerMobile: safeMobile,
      items,
      totalAmount
    });

    // Server-side Price Verification
    const menuItemIds = (validatedData.items as any[]).map((i: any) => i.id).filter(Boolean) as string[];
    const { data: liveItems, error: itemsFetchError } = await supabaseAdmin
      .from('menu_items')
      .select('id, price')
      .in('id', menuItemIds);

    if (itemsFetchError) throw itemsFetchError;

    const priceMap: Record<string, number> = {};
    (liveItems as { id: string; price: number }[])?.forEach((item: { id: string; price: number }) => {
      priceMap[item.id] = Number(item.price);
    });

    let serverTotal = 0;
    (validatedData.items as any[]).forEach((item: any) => {
      const livePrice = item.id ? priceMap[item.id] : item.price;
      const itemCustomizationsTotal = (item.customizations || [])
        .reduce((cSum: number, c: Customization) => cSum + (Number(c.price) || 0), 0);
      serverTotal += ((Number(livePrice) || 0) + itemCustomizationsTotal) * item.quantity;
    });

    const platformFee = 0;
    serverTotal += platformFee;
    const finalTotal = serverTotal || validatedData.totalAmount;

    // Fetch Tenant (with Cache)
    const configCacheKey = getCacheKey(validatedData.tenantId, 'config');
    let tenant = await redis.get(configCacheKey) as { status: string; config: Record<string, unknown> } | null;

    if (!tenant) {
      const { data: dbTenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .select('status, config')
        .eq('id', validatedData.tenantId)
        .single();

      if (tenantError || !dbTenant) throw new Error(`Store not found`);
      tenant = dbTenant as { status: string; config: Record<string, unknown> };
      await redis.set(configCacheKey, tenant, { ex: 300 });
    }

    if (tenant.status !== 'active') {
      throw new Error(`Store is currently ${tenant.status}. Orders are not being accepted.`);
    }

    // Razorpay signature verification
    let paymentStatus = 'pending';
    const config = (tenant.config as any) || {};
    const effectiveSecret = config.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET;

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

    // Idempotency Check
    if (razorpayPaymentId) {
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('id, short_id, status, payment_status')
        .eq('payment_id', razorpayPaymentId)
        .maybeSingle();

      if (existingOrder) {
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

    let sessionId: string | null = null;
    let finalOrderType = orderType || 'TAKEAWAY';
    const finalTableNumber = safeTable || null;

    // Logging for debugging
    console.log(`[Order Placement DEBUG]`, {
      receivedOrderType: orderType,
      receivedTableNumber: tableNumber,
      finalOrderType,
      finalTableNumber
    });

    // Safety: If tableNumber is present, it MUST be a DINE_IN order
    if (finalTableNumber && finalOrderType !== 'DINE_IN') {
      console.log(`[Order Placement DEBUG] Overriding to DINE_IN because tableNumber is present`);
      finalOrderType = 'DINE_IN';
    }

    if (finalOrderType === 'DINE_IN' && finalTableNumber) {
      const { data: tableData, error: tableError } = await supabaseAdmin
        .from('tables')
        .select('id, active_session_id, occupancy_status')
        .eq('tenant_id', validatedData.tenantId)
        .eq('table_number', finalTableNumber)
        .single();

      if (tableError && tableError.code !== 'PGRST116') {
        throw new Error('Failed to verify table status.');
      }

      if (tableData) {
        sessionId = tableData.active_session_id;
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          await supabaseAdmin.from('tables')
            .update({ active_session_id: sessionId, occupancy_status: 'occupied' })
            .eq('id', tableData.id);
        } else {
          await supabaseAdmin.from('tables')
            .update({ occupancy_status: 'occupied' })
            .eq('id', tableData.id);
        }
      } else {
        sessionId = crypto.randomUUID();
        await supabaseAdmin.from('tables')
          .insert({
            tenant_id: validatedData.tenantId,
            table_number: finalTableNumber,
            occupancy_status: 'occupied',
            active_session_id: sessionId
          });
      }
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tenant_id: validatedData.tenantId,
        short_id: generateShortId(),
        customer_name: safeName,
        customer_mobile: safeMobile,
        total_amount: finalTotal,
        status: 'received',
        payment_status: paymentStatus,
        payment_id: razorpayPaymentId || null,
        order_type: finalOrderType,
        table_number: finalOrderType === 'DINE_IN' ? finalTableNumber : null,
        session_id: sessionId
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

    await redis.del(getCacheKey(validatedData.tenantId, 'analytics:today'));
    await redis.del(getCacheKey(validatedData.tenantId, 'customers'));

    const cookieStore = await cookies();
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN?.split(':')[0];
    const isLocalhost = baseDomain === 'localhost' || baseDomain === 'lvh.me' || !baseDomain;

    // Sign the mobile number to prevent IDOR
    const token = await new SignJWT({ mobile: safeMobile })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(CUSTOMER_AUTH_SECRET);

    cookieStore.set(`auth_mobile_${validatedData.tenantId}`, token, {
      maxAge: 3600 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      ...(isLocalhost ? {} : { domain: `.${baseDomain}` })
    });

    const orderItems = validatedData.items.map((item: any) => ({
      order_id: order.id,
      name: item.name,
      price: (item.id && priceMap[item.id]) ? priceMap[item.id] : item.price,
      quantity: item.quantity,
      image_url: item.image_url,
      customizations: item.customizations || [],
      menu_item_id: item.id || null
    }));

    // NEW ERROR CHECKING & LOGGING
    console.log(`[Order Creation] Inserting ${orderItems.length} items for Order #${order.short_id || order.id.slice(0, 6)}`);

    const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);

    if (itemsError) {
      console.error(`[CRITICAL DB ERROR] Failed to insert order items for Order #${order.id}:`, itemsError);
      // Rollback order header to maintain data integrity
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      throw new Error(`Critical failure saving order details: ${itemsError.message}`);
    }

    console.log(`[Order Created Successfully]`, {
      orderId: order.id,
      shortId: order.short_id,
      customer: order.customer_name,
      items: orderItems.map(i => `${i.quantity}x ${i.name}`)
    });

    return { orderId: order.id, shortId: order.short_id };
  }, "createOrder");
}

// Unified Mapping Helper to ensure Admin & User Profile views are identical
function mapDbOrder(o: Record<string, any>): Order {
  return {
    order_id: o.id,
    short_id: o.short_id || o.id.replace(/\D/g, '').slice(0, 6) || '000000',
    customer_name: o.customer_name || 'Guest',
    customer_mobile: o.customer_mobile,
    order_note: o.order_note,
    order_type: o.order_type as 'TAKEAWAY' | 'DINE_IN',
    table_number: o.table_number,
    session_id: o.session_id,
    total_amount: Number(o.total_amount),
    order_status: o.status as OrderStatus,
    order_time: o.created_at,
    payment_status: o.payment_status,
    payment_id: o.payment_id,
    items: (o.order_items || []).map((oi: Record<string, any>) => ({
      id: oi.id,
      name: oi.name,
      price: Number(oi.price),
      quantity: oi.quantity,
      image_url: oi.image_url,
      customizations: oi.customizations as Customization[]
    }))
  };
}

export async function getTenantOrders(tenantId: string, page: number = 1, pageSize: number = 20): Promise<ServerActionResult<{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: Order[];
}>> {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const orders = (data || []).map(mapDbOrder);
    const total = count || 0;

    return {
      page,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / (pageSize || 1)),
      data: orders
    };
  }, "getTenantOrders");
}

export async function getLiveOrders(tenantId: string): Promise<ServerActionResult<Order[]>> {
  return withErrorHandling(async () => {
    // Note: We don't necessarily need ensureTenantOwner here if called from Staff Dashboard, 
    // but the dashboard layout already protects this via staff session check.
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('tenant_id', tenantId)
      .in('status', ['received', 'preparing', 'ready'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbOrder);
  }, "getLiveOrders");
}

export async function getStoreAnalytics(tenantId: string): Promise<ServerActionResult<{
  totalOrders: number;
  totalRevenue: number;
  preparingCount: number;
  completedCount: number;
}>> {
  return withErrorHandling(async () => {
    console.log(`[getStoreAnalytics] Fetching for tenant: ${tenantId}`);

    const { data: orders, error, count } = await supabaseAdmin
      .from('orders')
      .select('total_amount, status', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (error) {
      console.error(`[getStoreAnalytics] DB Error:`, error);
      throw error;
    }

    console.log(`[getStoreAnalytics] Found ${count} orders for tenant ${tenantId}`);

    const stats = {
      totalOrders: count || 0,
      totalRevenue: (orders || [])
        .filter((o: any) => o.status === 'completed')
        .reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0),
      preparingCount: (orders || []).filter((o: any) => o.status === 'preparing').length,
      completedCount: (orders || []).filter((o: any) => o.status === 'completed').length
    };

    return stats;
  }, "getStoreAnalytics");
}

export async function updateOrderStatusServer(orderId: string, status: string, tenantId: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);
    
    const validStatuses = ['received', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid order status: ${status}`);
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .select('table_number, order_type, session_id')
      .single();

    if (error) throw error;

    // If a Dine-in order becomes ready, poke the table to trigger staff alerts and update count
    if (order?.order_type === 'DINE_IN' && order?.table_number) {
      let sid = order.session_id;

      // Robust fallback: if session_id is missing, get it from the table
      if (!sid) {
        const { data: tableData } = await supabaseAdmin
          .from('tables')
          .select('active_session_id')
          .eq('tenant_id', tenantId)
          .eq('table_number', order.table_number)
          .single();
        sid = tableData?.active_session_id;
      }

      if (sid) {
        const { data: readyCount, error: countErr } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('session_id', sid)
          .eq('status', 'ready');

        if (!countErr) {
          await supabaseAdmin
            .from('tables')
            .update({
              last_alert_at: status === 'ready' ? new Date().toISOString() : undefined,
              ready_orders_count: readyCount?.length || 0
            })
            .eq('tenant_id', tenantId)
            .eq('table_number', order.table_number);
        } else {
          console.error('[UpdateStatus] Error counting ready orders:', countErr);
        }
      }
    }

    await redis.del(getCacheKey(tenantId, 'analytics:today'));
    return true;
  }, "updateOrderStatusServer");
}

export async function getTenantCustomers(tenantId: string): Promise<ServerActionResult<Customer[]>> {
  return withErrorHandling<Customer[]>(async (): Promise<Customer[]> => {
    await ensureAdminOrStaff(tenantId);
    const cacheKey = getCacheKey(tenantId, 'customers');
    const cached = await redis.get(cacheKey);
    if (cached) return cached as Customer[];

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('customer_name, customer_mobile, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) throw error;
    const customerMap: Record<string, Customer> = {};
    (data as { customer_name: string; customer_mobile: string; created_at: string }[] || []).forEach((o: any) => {
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
    await redis.set(cacheKey, result, { ex: 600 });
    return result;
  }, "getTenantCustomers");
}

export async function getCustomerOrders(tenantId: string, customerMobile: string) {
  return withErrorHandling(async () => {
    if (!customerMobile || customerMobile.length < 10) return [];
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
    const session = (await cookies()).get(`auth_mobile_${tenantId}`)?.value;
    if (!session) return [];

    try {
      const { payload } = await jwtVerify(session, CUSTOMER_AUTH_SECRET);
      const authedMobile = payload.mobile as string;
      if (authedMobile !== customerMobile) return [];
    } catch (err) {
      console.error('[Auth] Customer token verification failed:', err);
      return [];
    }

    return (data || []).map(mapDbOrder);
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

    const session = (await cookies()).get(`auth_mobile_${tenantId}`)?.value;
    if (!session) return null;

    try {
      const { payload } = await jwtVerify(session, CUSTOMER_AUTH_SECRET);
      const authedMobile = (payload as any).mobile;
      if (authedMobile !== data.customer_mobile) return null;
    } catch (err) {
      return null;
    }

    return mapDbOrder(data);
  }, "getAuthenticatedOrder");
}

export async function getAdminOrderById(orderId: string, tenantId: string): Promise<ServerActionResult<Order>> {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    if (!data) return undefined;

    return mapDbOrder(data);
  }, "getAdminOrderById");
}

export async function submitOrderRating(orderId: string, tenantId: string, rating: number, tags: string[], feedback?: string) {
  return withErrorHandling(async () => {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    const { error: ratingError } = await supabaseAdmin
      .from('order_ratings')
      .upsert({ order_id: orderId, tenant_id: tenantId, rating, tags, feedback: feedback || null }, { onConflict: 'order_id' });

    if (ratingError) throw ratingError;
    return true;
  }, "submitOrderRating");
}

export async function getTenantRatings(tenantId: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);
    const { data, error } = await supabaseAdmin
      .from('order_ratings')
      .select('*, orders(customer_name, short_id)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }, "getTenantRatings");
}

export async function createRazorpayOrder(amount: number, tenantId: string, customerData?: { name: string; mobile: string }, items?: CartItem[]) {
  return withErrorHandling(async () => {
    if (!tenantId) throw new Error("Missing store identifier.");
    if (amount < 1) throw new Error(`Invalid amount: ₹${amount}.`);

    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('config')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) throw new Error("Could not load store payment settings.");
    const config = (tenant?.config as Record<string, any>) || {};
    const razorpay = getRazorpay(config.razorpay_key_id && config.razorpay_key_secret ? { keyId: config.razorpay_key_id as string, keySecret: config.razorpay_key_secret as string } : undefined);

    const minimalItems = (items || []).map((i: CartItem) => ({ 
      id: i.id, 
      n: i.name, 
      p: i.price, 
      q: i.quantity, 
      c: (i.customizations || []).map((c: Customization) => ({ n: c.name, p: c.price })) 
    }));

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: { tenantId, customerName: customerData?.name || 'Guest', customerMobile: customerData?.mobile || '', items: JSON.stringify(minimalItems).slice(0, 1800), source: 'diney_v1' }
    };

    try {
      const order = await razorpay.orders.create(options);
      return order;
    } catch (rzpError: any) {
      throw new Error(`Razorpay Error: ${rzpError.description || rzpError.message}`);
    }
  }, "createRazorpayOrder");
}

export async function getTableBill(tenantId: string, tableNumber: string, customerMobile?: string) {
  return withErrorHandling(async () => {
    const { data: tableData, error: tableError } = await supabaseAdmin
      .from('tables')
      .select('active_session_id, occupancy_status, alert_status')
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber)
      .single();

    if (tableError || !tableData?.active_session_id) return null;

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('tenant_id', tenantId)
      .eq('session_id', tableData.active_session_id)
      .order('created_at', { ascending: true });

    if (ordersError) throw ordersError;

    // Security Check: 
    // 1. If customerMobile is provided, ensure they are part of this session
    // 2. If no mobile, verify the requester is a Staff/Admin
    if (customerMobile) {
      const isParticipant = (orders as { customer_mobile: string }[]).some((o: { customer_mobile: string }) => o.customer_mobile === customerMobile);
      if (!isParticipant) {
        console.log(`[Security] Unauthorized bill access attempt for Table ${tableNumber} by ${customerMobile}`);
        return null;
      }
    } else {
      try {
        await ensureAdminOrStaff(tenantId);
      } catch (e) {
        return null;
      }
    }

    let totalPaid = 0;
    let totalUnpaid = 0;
    const allItems: (OrderItem & { order_id: string; order_status: OrderStatus; order_time: string })[] = [];

    (orders as (Record<string, any> & { order_items: any[] })[]).forEach((o: any) => {
      const orderStatus = o.status as OrderStatus;
      const orderTime = o.created_at as string;
      const orderId = o.id as string;

      if (o.payment_status === 'paid') totalPaid += Number(o.total_amount);
      else totalUnpaid += Number(o.total_amount);

      if (o.order_items) {
        o.order_items.forEach((item: any) => {
          allItems.push({
            id: item.id,
            order_id: orderId,
            name: item.name,
            price: Number(item.price),
            quantity: item.quantity,
            image_url: item.image_url,
            customizations: (item.customizations || []) as Customization[],
            order_status: orderStatus,
            order_time: orderTime
          });
        });
      }
    });

    return {
      session_id: tableData.active_session_id,
      table_number: tableNumber,
      table_status: tableData.occupancy_status,
      alert_status: tableData.alert_status,
      orders,
      items: allItems,
      totalPaid,
      totalUnpaid,
      subtotal: totalPaid + totalUnpaid
    };
  }, "getTableBill");
}

export async function clearTableSession(tenantId: string, tableNumber: string, isPaid: boolean = false) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);
    const { data: table, error: tErr } = await supabaseAdmin
      .from('tables')
      .select('id, active_session_id, occupancy_status')
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber)
      .single();

    if (tErr || !table) throw new Error("Table not found");

    // 1. If there's an active session, complete all lingering orders
    if (table.active_session_id) {
      await supabaseAdmin.from('orders')
        .update({ status: 'completed', ...(isPaid ? { payment_status: 'paid' } : {}) })
        .eq('tenant_id', tenantId) // Security: Scoped to tenant
        .eq('session_id', table.active_session_id)
        .neq('status', 'completed');
    }

    // 2. Always reset table status to available for new guests
    await supabaseAdmin.from('tables')
      .update({
        active_session_id: null,
        occupancy_status: 'available',
        alert_status: 'none',
        handled_by_staff_id: null,
        assigned_staff_id: null, // Dynamic Unassign on session end
        last_alert_at: null,
        ready_orders_count: 0
      })
      .eq('id', table.id);

    return true;
  }, "clearTableSession");
}

export async function getAdminTables(tenantId: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);

    // Fetch all tables for the tenant
    const { data: tables, error: tErr } = await supabaseAdmin
      .from('tables')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('table_number', { ascending: true });

    if (tErr) throw tErr;

    const sessionIds = tables.map((t: any) => t.active_session_id).filter(Boolean);

    if (sessionIds.length > 0) {
      const { data: orders, error: oErr } = await supabaseAdmin
        .from('orders')
        .select('session_id, customer_name, status')
        .eq('tenant_id', tenantId) // Security: Strict tenant isolation
        .in('session_id', sessionIds);

      if (oErr) console.error("[AdminTables] Failed to fetch session details:", oErr);

      const customerMap: Record<string, string> = {};
      const readyMap: Record<string, number> = {};

      (orders as any[] | null)?.forEach((o: any) => {
        if (!customerMap[o.session_id]) customerMap[o.session_id] = o.customer_name;
        if (o.status === 'ready') {
          readyMap[o.session_id] = (readyMap[o.session_id] || 0) + 1;
        }
      });

      return tables.map((t: any) => ({
        ...t,
        customer_name: t.active_session_id ? customerMap[t.active_session_id] : null,
        ready_orders_count: t.active_session_id ? (readyMap[t.active_session_id] || 0) : 0
      }));
    }

    return tables.map((t: any) => ({ ...t, customer_name: null, ready_orders_count: 0 }));
  }, "getAdminTables");
}

export async function markTableOrdersAsServed(tenantId: string, tableNumber: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);

    // 1. Get the table and its active session
    const { data: table, error: tErr } = await supabaseAdmin
      .from('tables')
      .select('id, active_session_id') // Ensure ID is fetched for the update below
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber)
      .single();

    if (tErr || !table || !table.active_session_id) {
      throw new Error("Table session not found.");
    }

    // 2. Update all 'ready' orders for this session to 'completed'
    const { error: oErr } = await supabaseAdmin
      .from('orders')
      .update({ status: 'completed' })
      .eq('tenant_id', tenantId) // Security: Scoped to tenant
      .eq('session_id', table.active_session_id)
      .eq('status', 'ready');

    if (oErr) throw oErr;

    // 3. Reset table alerts and ready count
    const { error: tUpdateErr } = await supabaseAdmin
      .from('tables')
      .update({
        ready_orders_count: 0,
        last_alert_at: null,
        alert_status: 'none',
        handled_by_staff_id: null,
        occupancy_status: 'occupied' // Ensure it stays occupied after serving
      })
      .eq('id', table.id);

    if (tUpdateErr) throw tUpdateErr;

    return true;
  }, "markTableOrdersAsServed");
}

export async function notifyWaiterForReadyFood(tenantId: string, tableNumber: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);

    // Poke the table with a new alert timestamp
    const { error } = await supabaseAdmin
      .from('tables')
      .update({
        last_alert_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber);

    if (error) throw error;
    return { success: true };
  }, "notifyWaiterForReadyFood");
}

export async function addAdminTable(tenantId: string, tableNumber: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);
    const { data, error } = await supabaseAdmin
      .from('tables')
      .insert({ 
        tenant_id: tenantId, 
        table_number: tableNumber, 
        occupancy_status: 'available', 
        alert_status: 'none',
        active_session_id: null 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }, "addAdminTable");
}

export async function requestTableCheckout(tenantId: string, tableNumber: string) {
  return withErrorHandling(async () => {
    const { data: table, error: tErr } = await supabaseAdmin
      .from('tables')
      .select('id, table_number, occupancy_status')
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber)
      .single();

    if (tErr || !table) throw new Error(`Table ${tableNumber} not found.`);

    const occupancy = table.occupancy_status?.toLowerCase() || 'available';
    if (occupancy !== 'occupied') {
      throw new Error(`Cannot request checkout for an empty table.`);
    }

    const lastAlert = table.last_alert_at ? new Date(table.last_alert_at).getTime() : 0;
    const now = Date.now();
    if (now - lastAlert < 60000) {
      const remaining = Math.ceil((60000 - (now - lastAlert)) / 1000);
      throw new Error(`Please wait ${remaining}s before requesting again.`);
    }

    await supabaseAdmin
      .from('tables')
      .update({
        alert_status: 'bill',
        last_alert_at: new Date().toISOString()
      })
      .eq('id', table.id);

    return { success: true };
  }, "requestTableCheckout");
}

export async function callWaiter(tenantId: string, tableNumber: string) {
  return withErrorHandling(async () => {
    const { data: table, error: tErr } = await supabaseAdmin
      .from('tables')
      .select('id, table_number, occupancy_status, alert_status')
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber)
      .single();

    if (tErr || !table) throw new Error(`Table ${tableNumber} not found.`);

    const occupancy = table.occupancy_status?.toLowerCase() || 'available';

    const lastAlert = table.last_alert_at ? new Date(table.last_alert_at).getTime() : 0;
    const now = Date.now();
    if (now - lastAlert < 60000) {
      const remaining = Math.ceil((60000 - (now - lastAlert)) / 1000);
      throw new Error(`Please wait ${remaining}s before calling again.`);
    }

    await supabaseAdmin
      .from('tables')
      .update({
        alert_status: 'service',
        last_alert_at: new Date().toISOString()
      })
      .eq('id', table.id);

    return { success: true };
  }, "callWaiter");
}

export async function acknowledgeTableAlert(tenantId: string, tableNumber: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);
    await supabaseAdmin
      .from('tables')
      .update({ 
        alert_status: 'none',
        handled_by_staff_id: null 
      })
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber);
    return { success: true };
  }, "acknowledgeTableAlert");
}

export async function startHandlingAlert(tenantId: string, tableNumber: string, staffId: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);
    await supabaseAdmin
      .from('tables')
      .update({ 
        handled_by_staff_id: staffId 
      })
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber);
    return { success: true };
  }, "startHandlingAlert");
}

export async function claimTable(tenantId: string, tableNumber: string, staffId: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);
    await supabaseAdmin
      .from('tables')
      .update({ 
        assigned_staff_id: staffId 
      })
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber);
    return { success: true };
  }, "claimTable");
}

export async function releaseTable(tenantId: string, tableNumber: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);
    await supabaseAdmin
      .from('tables')
      .update({ 
        assigned_staff_id: null 
      })
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber);
    return { success: true };
  }, "releaseTable");
}

export async function validateTable(tenantId: string, tableNumber: string, customerMobile?: string) {
  return withErrorHandling(async () => {
    const { data: table, error } = await supabaseAdmin
      .from('tables')
      .select('id, table_number, occupancy_status, alert_status, active_session_id')
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber)
      .maybeSingle();

    if (error) throw error;
    if (!table) return null;

    // If table has an active session, check if the requester is part of it
    if (table.active_session_id && table.occupancy_status === 'occupied') {
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('customer_mobile')
        .eq('session_id', table.active_session_id);

      const isParticipant = (orders as { customer_mobile: string }[] | null)?.some((o: { customer_mobile: string }) => o.customer_mobile === customerMobile);

      // If there are orders in this session and the requester isn't one of them
      if (orders && orders.length > 0 && !isParticipant) {
        return { ...table, isOccupiedByOther: true };
      }
    }

    return table;
  }, "validateTable");
}

export async function deleteAdminTable(tenantId: string, tableId: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);

    // Safety check: Don't delete if occupied
    const { data: table, error: fErr } = await supabaseAdmin
      .from('tables')
      .select('occupancy_status, active_session_id')
      .eq('id', tableId)
      .eq('tenant_id', tenantId)
      .single();

    if (fErr) throw fErr;
    if (table.active_session_id || table.occupancy_status === 'occupied') {
      throw new Error("Cannot delete a table while guests are dining. Please settle the bill first.");
    }

    const { error } = await supabaseAdmin
      .from('tables')
      .delete()
      .eq('id', tableId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return true;
  }, "deleteAdminTable");
}

export async function staffCreateOrder(
  tenantId: string,
  tableNumber: string,
  items: CartItem[],
  totalAmount: number,
  customerName?: string,
  customerMobile?: string
) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);

    // 1. Get or Create Session
    const { data: tableData } = await supabaseAdmin
      .from('tables')
      .select('id, active_session_id')
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber)
      .single();

    let sessionId = tableData?.active_session_id;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      await supabaseAdmin.from('tables')
        .update({ 
          active_session_id: sessionId, 
          occupancy_status: 'occupied',
          alert_status: 'none' 
        })
        .eq('id', tableData?.id);
    }

    // 2. Resolve Customer Info
    let finalName = customerName;
    let finalMobile = customerMobile;

    if (!finalName || !finalMobile) {
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('customer_name, customer_mobile')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingOrder) {
        finalName = finalName || existingOrder.customer_name;
        finalMobile = finalMobile || existingOrder.customer_mobile;
      }
    }

    // 3. Insert Order Header
    const { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .insert({
        tenant_id: tenantId,
        short_id: generateShortId(),
        customer_name: finalName || 'Waiter Entry',
        customer_mobile: finalMobile || '9999999999',
        total_amount: totalAmount,
        status: 'received',
        payment_status: 'pending',
        order_type: 'DINE_IN',
        table_number: tableNumber,
        session_id: sessionId
      })
      .select()
      .single();

    if (oErr) throw oErr;

    // 3. Insert Items
    const orderItems = items.map((item: CartItem) => ({
      order_id: order.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url,
      customizations: item.customizations || [],
      menu_item_id: item.id || null
    }));

    const { error: iErr } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (iErr) throw iErr;

    return { success: true, orderId: order.id };
  }, "staffCreateOrder");
}

export async function updateTableSessionCustomer(tenantId: string, tableNumber: string, sessionId: string, customerName: string, customerMobile: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);
    
    // 1. Update all orders in this session
    const { error: ordersError } = await supabaseAdmin
      .from('orders')
      .update({ 
        customer_name: customerName, 
        customer_mobile: customerMobile 
      })
      .eq('tenant_id', tenantId)
      .eq('session_id', sessionId);

    if (ordersError) throw ordersError;

    // 2. Clear customer cache to reflect changes in staff view
    await redis.del(getCacheKey(tenantId, 'customers'));

    return true;
  }, "updateTableSessionCustomer");
}

export async function staffSettleTable(tenantId: string, tableNumber: string) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);

    const { data: table } = await supabaseAdmin
      .from('tables')
      .select('active_session_id, id')
      .eq('tenant_id', tenantId)
      .eq('table_number', tableNumber)
      .single();

    if (!table?.active_session_id) throw new Error("No active session for this table");

    // 1. Mark all orders in this session as paid and completed
    await supabaseAdmin.from('orders')
      .update({ status: 'completed', payment_status: 'paid' })
      .eq('session_id', table.active_session_id);

    // 2. Reset table to available
    await supabaseAdmin.from('tables')
      .update({ 
        active_session_id: null, 
        occupancy_status: 'available',
        alert_status: 'none',
        handled_by_staff_id: null,
        assigned_staff_id: null, // Dynamic Unassign
        ready_orders_count: 0 // Fix Served Glitch
      })
      .eq('id', table.id);

    return true;
  }, "staffSettleTable");
}
