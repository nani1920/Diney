'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { ensureTenantOwner } from '@/lib/auth-utils';
import { withErrorHandling } from '@/lib/server-utils';

export async function getStoreAnalytics(
  tenantId: string, 
  timeframe: 'today' | 'week' | 'month' | 'specific' = 'today',
  specificDate?: string // ISO date string
) {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    let query = supabaseAdmin
      .from('orders')
      .select('id, total_amount, status, created_at, customer_name, customer_mobile, order_items(id, name, price, quantity)')
      .eq('tenant_id', tenantId)
      .neq('status', 'cancelled');

    const now = new Date();
    if (timeframe === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query = query.gte('created_at', startOfDay);
    } else if (timeframe === 'week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - 7)).toISOString();
      query = query.gte('created_at', startOfWeek);
    } else if (timeframe === 'month') {
      const startOfMonth = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      query = query.gte('created_at', startOfMonth);
    } else if (timeframe === 'specific' && specificDate) {
      const date = new Date(specificDate);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).toISOString();
      query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
    }

    const { data: orders, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    // If no orders, return empty structure instead of throwing
    if (!orders || orders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        topItems: [],
        chartData: []
      };
    }

    // Aggregate Data
    const totalRevenue = (orders as any[]).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Top Selling Items
    const itemMap: Record<string, { name: string; count: number; revenue: number }> = {};
    (orders as any[]).forEach(o => {
      o.order_items?.forEach((oi: any) => {
        if (!itemMap[oi.name]) {
          itemMap[oi.name] = { name: oi.name, count: 0, revenue: 0 };
        }
        itemMap[oi.name].count += oi.quantity;
        itemMap[oi.name].revenue += oi.price * oi.quantity;
      });
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Order Distribution (by hour for today/specific, by day for week/month)
    const distribution: Record<string, number> = {};
    (orders as any[]).forEach(o => {
      const date = new Date(o.created_at);
      const key = (timeframe === 'today' || timeframe === 'specific')
        ? `${date.getHours()}:00` 
        : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      distribution[key] = (distribution[key] || 0) + 1;
    });

    const chartData = Object.entries(distribution).map(([label, value]) => ({ label, value }));

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      topItems,
      chartData
    };
  }, "getStoreAnalytics");
}
