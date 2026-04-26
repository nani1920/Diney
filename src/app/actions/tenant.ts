'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { redis, getCacheKey, DEFAULT_TTL } from '@/lib/redis';
import { MenuItem, ServerActionResult } from '@/types';
import { ensureTenantOwner, ensureAdminOrStaff } from '@/lib/auth-utils';
import { TenantSchema, MenuItemSchema, CategorySchema } from '@/lib/validations';
import { withErrorHandling } from '@/lib/server-utils';
import { actionRateLimiter } from '@/lib/ratelimit';

export async function getTenantData(slug: string) {
  return withErrorHandling(async () => {
    const cacheKey = getCacheKey(slug, 'config');
    
     
    const cached = await redis.get(cacheKey) as any | null;
    if (cached) {
      return cached;
    }

     
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug, status, config, tier, subscription_status, created_at, owner_id')
      .eq('slug', slug)
      .single();

    if (error || !tenant) {
      throw new Error(`Tenant ${slug} not found`);
    }

    // [SECURITY FIX] Strip sensitive fields from config before sending to client
    const safeConfig = { ...((tenant.config as any) || {}) };
    delete safeConfig.razorpay_key_secret;
    
    const safeTenant = {
      ...tenant,
      config: safeConfig
    };

    // Cache the SAFE version
    await redis.set(cacheKey, safeTenant, { ex: DEFAULT_TTL });

    return safeTenant;
  }, "getTenantData");
}

export async function getTenantMenu(tenantId: string, slug: string) {
  return withErrorHandling(async () => {
    const cacheKey = getCacheKey(slug, 'menu');
    
     
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached as MenuItem[];
    }

     
    const supabase = await createServerClient();
    const { data: items, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(id, name, display_order)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    if (error) throw error;

     
    const mappedItems = (items || []).map(item => ({
      ...item,
      availability_status: item.is_available  
    }));

     
    await redis.set(cacheKey, mappedItems, { ex: DEFAULT_TTL });

    return mappedItems as MenuItem[];
  }, "getTenantMenu");
}

export async function registerTenant(name: string, slug: string, ownerId?: string) {
  return withErrorHandling(async () => {
    console.log('[registerTenant] Starting registration for:', { name, slug, ownerId });
    
    // 1. Auth Check
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error('[registerTenant] Auth failed:', authError);
        throw new Error("Authentication required");
    }
    console.log('[registerTenant] User authenticated:', user.id);
    
    // 2. Rate Limit
    const { success: rateLimitOk } = await actionRateLimiter.limit(`register:${user.id}`);
    if (!rateLimitOk) {
        console.warn('[registerTenant] Rate limit hit for user:', user.id);
        throw new Error("Too many registration attempts. Please wait.");
    }

    // 3. Validation
    console.log('[registerTenant] Validating data...');
    const validatedData = TenantSchema.parse({ name, slug, owner_id: ownerId || user.id });

    // 4. Duplicate Check
    console.log('[registerTenant] Checking for existing slug:', validatedData.slug);
    const { data: existing } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', validatedData.slug)
      .single();

    if (existing) {
      console.warn('[registerTenant] Slug already taken:', validatedData.slug);
      throw new Error('Subdomain already taken');
    }

    // 5. Insert
    console.log('[registerTenant] Inserting new tenant...');
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: validatedData.name,
        slug: validatedData.slug,
        owner_id: validatedData.owner_id,
        status: 'pending',
        tier: 'free',
        subscription_status: 'active',
        config: {
          isStoreOpen: true,
          openingTime: '10:00',
          closingTime: '22:00'
        }
      })
      .select()
      .single();

    if (error) {
        console.error('[registerTenant] Database insert error:', error);
        throw new Error(error.message);
    }

    console.log('[registerTenant] Registration successful:', tenant.id);

    // 6. Cache invalidation
    const cacheKey = getCacheKey(validatedData.slug, 'config');
    await redis.del(cacheKey);

    return tenant;
  }, "registerTenant");
}
 

export async function upsertMenuItem(tenantId: string, slug: string, item: Partial<MenuItem>) {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    
     
    const validatedData = MenuItemSchema.parse(item);

     
    let categoryId = validatedData.category_id;
    if (!categoryId) {
      const { data: cat } = await supabaseAdmin
        .from('menu_categories')
        .select('id')
        .eq('tenant_id', tenantId)
        .order('display_order', { ascending: true })
        .limit(1)
        .maybeSingle();
        
      if (cat) {
        categoryId = cat.id;
      } else {
        const { data: newCat } = await supabaseAdmin
          .from('menu_categories')
          .insert({ tenant_id: tenantId, name: 'General', display_order: 0 })
          .select()
          .single();
        categoryId = newCat?.id;
      }
    }

     
    const payload = {
      tenant_id: tenantId,
      category_id: categoryId,
      name: validatedData.name,
      description: validatedData.description,
      price: validatedData.price,
      veg_or_nonveg: validatedData.veg_or_nonveg,
      is_available: validatedData.availability_status,
      image_url: validatedData.image_url,
      prep_time_minutes: validatedData.prep_time_minutes,
      master_product_id: (validatedData as any).master_product_id
    };

     
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .upsert(
        validatedData.id ? { id: validatedData.id, ...payload } : payload,
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;

     
    const cacheKey = getCacheKey(slug, 'menu');
    await redis.del(cacheKey);

    return { ...data, availability_status: data.is_available };
  }, "upsertMenuItem");
}

export async function toggleMenuItemStock(tenantId: string, slug: string, itemId: string, isAvailable: boolean) {
  return withErrorHandling(async () => {
    await ensureAdminOrStaff(tenantId);
    
    const { error } = await supabaseAdmin
      .from('menu_items')
      .update({ is_available: isAvailable })
      .eq('id', itemId)
      .eq('tenant_id', tenantId);

    if (error) throw error;

    const cacheKey = getCacheKey(slug, 'menu');
    await redis.del(cacheKey);
    
    return true;
  }, "toggleMenuItemStock");
}

export async function deleteMenuItemServer(tenantId: string, slug: string, itemId: string) {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    const { error } = await supabaseAdmin
      .from('menu_items')
      .delete()
      .eq('id', itemId)
      .eq('tenant_id', tenantId);

    if (error) throw error;

     
    const cacheKey = getCacheKey(slug, 'menu');
    await redis.del(cacheKey);
    
    return true;
  }, "deleteMenuItemServer");
}
export async function updateTenantConfig(tenantId: string, slug: string, config: Record<string, unknown>) {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    
    const { error } = await supabaseAdmin
      .from('tenants')
      .update({ config })
      .eq('id', tenantId);

    if (error) throw error;

    const cacheKey = getCacheKey(slug, 'config');
    await redis.del(cacheKey);

    return true;
  }, "updateTenantConfig");
}

export async function updatePaymentSettings(
  tenantId: string, 
  slug: string, 
  keyId: string, 
  keySecret?: string
) {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    
    // 1. Fetch current config
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('config')
      .eq('id', tenantId)
      .single();

    const oldConfig = (tenant?.config as any) || {};
    const newConfig = { 
      ...oldConfig, 
      razorpay_key_id: keyId 
    };

    // [BUG FIX] Preserve old secret if not providing a new one
    if (keySecret) {
      (newConfig as any).razorpay_key_secret = keySecret;
    } else if (oldConfig.razorpay_key_secret) {
      (newConfig as any).razorpay_key_secret = oldConfig.razorpay_key_secret;
    }

    const { error } = await supabaseAdmin
      .from('tenants')
      .update({ config: newConfig })
      .eq('id', tenantId);

    if (error) throw error;

    // Cache Invalidation
    const cacheKey = getCacheKey(slug, 'config');
    await redis.del(cacheKey);

    return true;
  }, "updatePaymentSettings");
}

 

export async function getTenantCategories(tenantId: string) {
  return withErrorHandling(async () => {
    const { data, error } = await supabaseAdmin
      .from('menu_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data;
  }, "getTenantCategories");
}

export async function upsertCategory(tenantId: string, slug: string, category: any) {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    
    // 1. Validate Input
    const validatedData = CategorySchema.parse(category);

    // 2. Explicitly Map Fields (Avoid raw spread for security)
    const payload = {
        name: validatedData.name,
        display_order: validatedData.display_order,
        tenant_id: tenantId
    };

    const { data, error } = await supabaseAdmin
      .from('menu_categories')
      .upsert(
        validatedData.id ? { id: validatedData.id, ...payload } : payload,
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;

     
    const cacheKey = getCacheKey(slug, 'menu');
    await redis.del(cacheKey);

    return data;
  }, "upsertCategory");
}

export async function deleteCategory(tenantId: string, slug: string, categoryId: string) {
  return withErrorHandling(async () => {
    await ensureTenantOwner(tenantId);
    const { error } = await supabaseAdmin
      .from('menu_categories')
      .delete()
      .eq('id', categoryId)
      .eq('tenant_id', tenantId);

    if (error) throw error;

     
    const cacheKey = getCacheKey(slug, 'menu');
    await redis.del(cacheKey);

    return true;
  }, "deleteCategory");
}
