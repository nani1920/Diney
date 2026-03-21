import { createClient } from './supabase/server';
import { supabaseAdmin } from './supabase';
import { redis, getCacheKey } from './redis';
import { cookies } from 'next/headers';

 
export async function isSuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    const adminEmailsStr = process.env.SUPER_ADMIN_EMAILS || '';
    const adminEmails = adminEmailsStr.split(',').map(e => e.trim().toLowerCase());
    
    return adminEmails.includes(user.email?.toLowerCase() || '');
}

 
export async function verifyTenantOwnership(tenantId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

     
    const cookieStore = await cookies();
    const impersonationTarget = cookieStore.get('impersonation_target')?.value;
    
    if (impersonationTarget) {
         
         
        const isAdmin = await isSuperAdmin();
        if (isAdmin) {
             
             
             
            const targetSlug = impersonationTarget.toLowerCase();
            const cacheKeySlug = `slug_to_id:${targetSlug}`;
            let targetId = await redis.get(cacheKeySlug) as string;
            
            if (!targetId) {
                const { data } = await supabaseAdmin
                    .from('tenants')
                    .select('id')
                    .eq('slug', targetSlug)
                    .single();
                if (data) {
                    targetId = data.id;
                    await redis.set(cacheKeySlug, targetId, { ex: 3600 });
                }
            }

            if (targetId === tenantId || targetSlug === tenantId.toLowerCase()) return true;
        }
    }

     
    const cacheKey = `owner:${tenantId}`;
    let ownerId = await redis.get(cacheKey) as string;

     
    if (!ownerId) {
         
        const { data, error } = await supabaseAdmin
            .from('tenants')
            .select('owner_id')
            .eq('id', tenantId)
            .single();

        if (error || !data || !data.owner_id) {
            console.error(`[Security Error] Failed to resolve owner for tenant ${tenantId}`);
            return false;
        }
        
        ownerId = data.owner_id;

         
        await redis.set(cacheKey, ownerId, { ex: 3600 });
    }

    return ownerId === user.id;
}

 
export async function ensureSuperAdmin() {
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
        throw new Error('Unauthorized: Super Admin access required');
    }
}

 
export async function ensureTenantOwner(tenantId: string) {
    const isOwner = await verifyTenantOwnership(tenantId);
    if (!isOwner) {
        throw new Error('Unauthorized: Tenant ownership required');
    }
}
