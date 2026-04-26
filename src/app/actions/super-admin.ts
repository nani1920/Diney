'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { redis, getCacheKey } from '@/lib/redis';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ensureSuperAdmin } from '@/lib/auth-utils';
import { withErrorHandling } from '@/lib/server-utils';
import { MasterProductSchema } from '@/lib/validations';

interface RawStatsOrder {
    total_amount: number;
    status: string;
    created_at: string;
    tenant_id: string;
    tenants: { name: string } | null | any;
}

export async function getGlobalStats() {
    return withErrorHandling(async () => {
        await ensureSuperAdmin();
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

         
        const { count: tenantCount, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .select('*', { count: 'exact', head: true });

        if (tenantError) throw tenantError;

         
        const { data: allOrders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('total_amount, status, created_at, tenant_id, tenants(name)')
            .eq('status', 'completed')
            .gte('created_at', sixtyDaysAgo.toISOString());

        if (ordersError) throw ordersError;

         
        const currentOrders = (allOrders as RawStatsOrder[] || []).filter((o: RawStatsOrder) => new Date(o.created_at) >= thirtyDaysAgo);
        const previousOrders = (allOrders as RawStatsOrder[] || []).filter((o: RawStatsOrder) => new Date(o.created_at) < thirtyDaysAgo);

        const totalRevenue = currentOrders.reduce((sum: number, o: RawStatsOrder) => sum + (Number(o.total_amount) || 0), 0);
        const prevRevenue = previousOrders.reduce((sum: number, o: RawStatsOrder) => sum + (Number(o.total_amount) || 0), 0);
        
        const revenueGrowth = prevRevenue === 0 ? 100 : Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);

        const hourlyTrend: Record<string, number> = {};
        for (let i = 0; i < 24; i++) {
            const h = new Date(now.getTime() - (i * 60 * 60 * 1000));
            h.setMinutes(0, 0, 0);
            hourlyTrend[h.toISOString()] = 0;
        }

        currentOrders.forEach((o: RawStatsOrder) => {
            const orderDate = new Date(o.created_at);
            orderDate.setMinutes(0, 0, 0);
            const key = orderDate.toISOString();
            if (hourlyTrend[key] !== undefined) {
                hourlyTrend[key] += Number(o.total_amount) || 0;
            }
        });

        const trendData = Object.entries(hourlyTrend)
            .map(([date, amount]: [string, number]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const tenantPerformance: Record<string, { name: string, revenue: number, orders: number }> = {};
        currentOrders.forEach((o: RawStatsOrder) => {
            const tId = o.tenant_id;
            const tName = (o.tenants as { name: string } | null)?.name || 'Unknown';
            if (!tenantPerformance[tId]) {
                tenantPerformance[tId] = { name: tName, revenue: 0, orders: 0 };
            }
            tenantPerformance[tId].revenue += Number(o.total_amount) || 0;
            tenantPerformance[tId].orders += 1;
        });

        const topPerformers = Object.values(tenantPerformance)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return {
            totalTenants: tenantCount || 0,
            totalOrders: currentOrders.length,
            totalRevenue,
            revenueGrowth,
            trendData,
            topPerformers
        };
    }, "getGlobalStats");
}

 
export async function updateTenantStatus(tenantId: string, status: 'pending' | 'active' | 'suspended' | 'rejected') {
    return withErrorHandling(async () => {
        await ensureSuperAdmin();
         
        const { data: tenant, error: fetchError } = await supabaseAdmin
            .from('tenants')
            .select('slug')
            .eq('id', tenantId)
            .single();

        if (fetchError || !tenant) {
            console.error(`[updateTenantStatus] Tenant fetch error for ID ${tenantId}:`, fetchError);
            throw fetchError || new Error('Tenant not found');
        }

         
        const { error } = await supabaseAdmin
            .from('tenants')
            .update({ status })
            .eq('id', tenantId);

        if (error) {
            console.error(`[updateTenantStatus] DB Error updating status for tenant ${tenantId}:`, error);
            throw error;
        }

         
        const configKey = getCacheKey(tenant.slug, 'config');
        const menuKey = getCacheKey(tenant.slug, 'menu');
        
        await Promise.all([
            redis.del(configKey),
            redis.del(menuKey)
        ]);

         
        revalidatePath(`/${tenant.slug}`);
        revalidatePath(`/${tenant.slug}/admin`, 'layout');
        revalidatePath(`/super-admin/tenants`);

        return true;
    }, "updateTenantStatus");
}

export async function updateTenantTier(tenantId: string, tier: string, status: string = 'active') {
    return withErrorHandling(async () => {
        await ensureSuperAdmin();
         
        const { data: tenant, error: fetchError } = await supabaseAdmin
            .from('tenants')
            .select('slug')
            .eq('id', tenantId)
            .single();

        if (fetchError || !tenant) throw fetchError || new Error('Tenant not found');

         
        const { error } = await supabaseAdmin
            .from('tenants')
            .update({ 
                tier,
                subscription_status: status
            })
            .eq('id', tenantId);

        if (error) throw error;

         
        const configKey = getCacheKey(tenant.slug, 'config');
        await redis.del(configKey);

         
        revalidatePath(`/${tenant.slug}/admin`, 'layout');
        revalidatePath(`/super-admin/tenants`);

        return true;
    }, "updateTenantTier");
}

export async function createAnnouncement(title: string, message: string, type: string = 'info') {
    return withErrorHandling(async () => {
        await ensureSuperAdmin();
        const { error } = await supabaseAdmin
            .from('announcements')
            .insert([{ title, message, type }]);

        if (error) throw error;
        return true;
    }, "createAnnouncement");
}

export async function deleteAnnouncement(id: string) {
    return withErrorHandling(async () => {
        await ensureSuperAdmin();
        const { error } = await supabaseAdmin
            .from('announcements')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }, "deleteAnnouncement");
}

export async function getAnnouncements() {
    return withErrorHandling(async () => {
        await ensureSuperAdmin();
        const { data, error } = await supabaseAdmin
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }, "getAnnouncements");
}

export async function getAllTenants() {
    return withErrorHandling(async () => {
        await ensureSuperAdmin();
        const { data, error } = await supabaseAdmin
            .from('tenants')
            .select(`
                *,
                owner:profiles(*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data;
    }, "getAllTenants");
}

export async function loginAsMerchant(tenantSlug: string) {
    await ensureSuperAdmin();
    const cookieStore = await cookies();
    
     
    cookieStore.set('impersonation_target', tenantSlug, {
        maxAge: 3600,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    });

    redirect(`/${tenantSlug}/admin`);
}

export async function exitImpersonation() {
    const cookieStore = await cookies();
    cookieStore.delete('impersonation_target');
    redirect('/super-admin/tenants');
}

 

export async function getMasterProducts() {
    return withErrorHandling(async () => {
        // Removed ensureSuperAdmin() to allow merchants to browse catalog for importing.
        // Reading the master catalog is safe for all authenticated users.
        const { data, error } = await supabaseAdmin
            .from('master_products')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    }, "getMasterProducts");
}

export async function upsertMasterProduct(product: any) {
    return withErrorHandling(async () => {
        await ensureSuperAdmin();
        
        const validatedData = MasterProductSchema.parse(product);

        const payload = {
            name: validatedData.name,
            description: validatedData.description,
            price: validatedData.price,
            category: validatedData.category,
            image_url: validatedData.image_url
        };

        const { data, error } = await supabaseAdmin
            .from('master_products')
            .upsert(
                validatedData.id ? { id: validatedData.id, ...payload } : payload,
                { onConflict: 'id' }
            )
            .select()
            .single();

        if (error) throw error;
        return data;
    }, "upsertMasterProduct");
}

export async function deleteMasterProduct(id: string) {
    return withErrorHandling(async () => {
        await ensureSuperAdmin();
        const { error } = await supabaseAdmin
            .from('master_products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }, "deleteMasterProduct");
}

export async function getAllPlatformRatings() {
    return withErrorHandling(async () => {
        await ensureSuperAdmin();
        const { data, error } = await supabaseAdmin
            .from('order_ratings')
            .select('*, orders(customer_name, short_id), tenants(name, slug)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return data;
    }, "getAllPlatformRatings");
}
