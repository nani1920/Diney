'use server';

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { redis, getCacheKey, DEFAULT_TTL } from '@/lib/redis';
import { MenuItem, ServerActionResult } from '@/types';
import { ensureTenantOwner } from '@/lib/auth-utils';
import { TenantSchema, MenuItemSchema } from '@/lib/validations';
import { withErrorHandling } from '@/lib/server-utils';
import { actionRateLimiter } from '@/lib/ratelimit';

export async function getTenantData(slug: string) {
  return withErrorHandling(async () => {
    const cacheKey = getCacheKey(slug, 'config');
    
     
    const cached = await redis.get(cacheKey) as any;
    if (cached && cached.owner_id) {
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

     
    await redis.set(cacheKey, tenant, { ex: DEFAULT_TTL });

    return tenant;
  }, "getTenantData");
}

export async function getTenantMenu(tenantId: string, slug: string) {
  return withErrorHandling(async () => {
    const cacheKey = getCacheKey(slug, 'menu');
    
     
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached as MenuItem[];
    }

     
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

    return mappedItems as any[];
  }, "getTenantMenu");
}

export async function registerTenant(name: string, slug: string, ownerId?: string) {
  return withErrorHandling(async () => {
     
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authentication required");
    
    const { success: rateLimitOk } = await actionRateLimiter.limit(`register:${user.id}`);
    if (!rateLimitOk) throw new Error("Too many registration attempts. Please wait.");

     
    const validatedData = TenantSchema.parse({ name, slug, owner_id: ownerId || user.id });

     
    const { data: existing } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', validatedData.slug)
      .single();

    if (existing) {
      throw new Error('Subdomain already taken');
    }

    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: validatedData.name,
        slug: validatedData.slug,
        owner_id: validatedData.owner_id,
        status: 'pending',
        config: {
          isStoreOpen: true,
          openingTime: '10:00',
          closingTime: '22:00'
        }
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

     
    const cacheKey = getCacheKey(validatedData.slug, 'config');
    await redis.del(cacheKey);

    return tenant;
  }, "registerTenant");
}
 

export async function upsertMenuItem(tenantId: string, slug: string, item: any) {
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
      prep_time_minutes: validatedData.prep_time_minutes
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
export async function updateTenantConfig(tenantId: string, slug: string, config: any) {
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
    const { data, error } = await supabaseAdmin
      .from('menu_categories')
      .upsert({
        ...category,
        tenant_id: tenantId
      })
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
