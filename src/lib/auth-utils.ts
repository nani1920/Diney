import { createClient } from './supabase/server';
import { supabaseAdmin } from './supabase';
import { redis, getCacheKey } from './redis';
import { cookies } from 'next/headers';

/**
 * Checks if the current authenticated user is a platform super-admin.
 */
export async function isSuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    const adminEmailsStr = process.env.SUPER_ADMIN_EMAILS || '';
    const adminEmails = adminEmailsStr.split(',').map(e => e.trim().toLowerCase());
    
    return adminEmails.includes(user.email?.toLowerCase() || '');
}

/**
 * Verifies if the current user owns the specified tenant.
 * Uses Redis caching to minimize database hits.
 */
export async function verifyTenantOwnership(tenantId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    // --- impersonation logical check ---
    const cookieStore = await cookies();
    const impersonationTarget = cookieStore.get('impersonation_target')?.value;
    
    if (impersonationTarget) {
        // If they are trying to access the target they are impersonating,
        // we must verify they are actually a super admin first.
        const isAdmin = await isSuperAdmin();
        if (isAdmin) {
            // Check if name or ID matches (sometimes slugs are used as IDs in URL params)
            // But we need to be careful. The cookie stores the SLUG.
            // Let's resolve the ID if the cookie is a slug.
            
            const cacheKeySlug = `slug_to_id:${impersonationTarget}`;
            let targetId = await redis.get(cacheKeySlug) as string;
            
            if (!targetId) {
                const { data } = await supabaseAdmin
                    .from('tenants')
                    .select('id')
                    .eq('slug', impersonationTarget)
                    .single();
                if (data) {
                    targetId = data.id;
                    await redis.set(cacheKeySlug, targetId, { ex: 3600 });
                }
            }

            if (targetId === tenantId || impersonationTarget === tenantId) return true;
        }
    }

    // Check Redis for cached owner_id
    const cacheKey = `owner:${tenantId}`;
    let ownerId = await redis.get(cacheKey) as string;

    // Force fetch if ownerId is missing in cache
    if (!ownerId) {
        // Cache miss: Query database
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

        // Cache for 1 hour
        await redis.set(cacheKey, ownerId, { ex: 3600 });
    }

    return ownerId === user.id;
}

/**
 * Helper to enforce super-admin access in server actions.
 */
export async function ensureSuperAdmin() {
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
        throw new Error('Unauthorized: Super Admin access required');
    }
}

/**
 * Helper to enforce tenant ownership in server actions.
 */
export async function ensureTenantOwner(tenantId: string) {
    const isOwner = await verifyTenantOwnership(tenantId);
    if (!isOwner) {
        throw new Error('Unauthorized: Tenant ownership required');
    }
}
