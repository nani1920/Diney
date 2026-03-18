'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { withErrorHandling } from '@/lib/server-utils';

 
 

export async function getCart(tenantId: string, sessionId: string) {
    return withErrorHandling(async () => {
        if (!tenantId) throw new Error("Tenant context required");
        
        const { data, error } = await supabaseAdmin
            .from('carts')
            .select(`
                id,
                quantity,
                customizations,
                menu_item:menu_item_id (*)
            `)
            .eq('tenant_id', tenantId)
            .eq('session_id', sessionId);

        if (error) throw error;

        return data.map((item: any) => ({
            cart_id: item.id,
            ...item.menu_item,
            quantity: item.quantity,
            customizations: item.customizations
        }));
    }, "getCart");
}

export async function addToCartDB(tenantId: string, sessionId: string, menuItemId: string, customizations: any[] = []) {
    return withErrorHandling(async () => {
        const { data: existing } = await supabaseAdmin
            .from('carts')
            .select('id, quantity')
            .eq('tenant_id', tenantId)
            .eq('session_id', sessionId)
            .eq('menu_item_id', menuItemId)
            .eq('customizations', JSON.stringify(customizations))
            .single();

        if (existing) {
            const { error } = await supabaseAdmin
                .from('carts')
                .update({ quantity: existing.quantity + 1 })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabaseAdmin
                .from('carts')
                .insert({
                    tenant_id: tenantId,
                    session_id: sessionId,
                    menu_item_id: menuItemId,
                    quantity: 1,
                    customizations
                });
            if (error) throw error;
        }

        return true;
    }, "addToCartDB");
}

export async function updateCartQuantityDB(tenantId: string, sessionId: string, cartId: string, delta: number) {
    return withErrorHandling(async () => {
        const { data: existing } = await supabaseAdmin
            .from('carts')
            .select('quantity')
            .eq('id', cartId)
            .eq('tenant_id', tenantId)
            .eq('session_id', sessionId)
            .single();

        if (!existing) throw new Error('Item not found or session mismatch');

        const newQuantity = existing.quantity + delta;

        if (newQuantity <= 0) {
            const { error } = await supabaseAdmin
                .from('carts')
                .delete()
                .eq('id', cartId)
                .eq('tenant_id', tenantId)
                .eq('session_id', sessionId);
            if (error) throw error;
        } else {
            const { error } = await supabaseAdmin
                .from('carts')
                .update({ quantity: newQuantity })
                .eq('id', cartId)
                .eq('tenant_id', tenantId)
                .eq('session_id', sessionId);
            if (error) throw error;
        }

        return true;
    }, "updateCartQuantityDB");
}

export async function clearCartDB(tenantId: string, sessionId: string) {
    return withErrorHandling(async () => {
        const { error } = await supabaseAdmin
            .from('carts')
            .delete()
            .eq('tenant_id', tenantId)
            .eq('session_id', sessionId);

        if (error) throw error;
        return true;
    }, "clearCartDB");
}
