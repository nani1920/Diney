'use client';

import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import type { MenuItem, CartItem, PromoCode, Customization, OrderItem } from '@/types';
import { useStore } from '@/context/StoreContext';
import { useAdmin } from '@/context/AdminContext';
import { useCartStore } from '@/store/useCartStore';

interface CartContextType {
    cart: CartItem[];
    appliedPromo: PromoCode | null;
    promoCodes: PromoCode[];
    addToCart: (item: MenuItem, customizations?: Customization[]) => Promise<void>;
    updateCartQuantity: (uniqueId: string, delta: number) => Promise<void>;
    clearCart: () => Promise<void>;
    reorderPastOrder: (orderItems: OrderItem[]) => Promise<void>;
    validatePromoCode: (code: string, cartTotal: number) => { valid: boolean; message: string; promo?: PromoCode };
    applyPromoCode: (promo: PromoCode | null) => void;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const PROMO_CODES: PromoCode[] = [
    {
        code: 'GFood',
        discount_type: 'percentage',
        discount_value: 10,
        min_order_value: 200,
        is_active: true
    }
];

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const { tenant, sessionId } = useStore();
    const { menuItems } = useAdmin();
    
    // 1. Stable actions from Zustand
    const fetchCartStore = useCartStore(s => s.fetchCart);
    const addToCartStore = useCartStore(s => s.addToCart);
    const updateQuantityStore = useCartStore(s => s.updateQuantity);
    const clearCartStore = useCartStore(s => s.clearCart);
    const setPromoStore = useCartStore(s => s.setPromo);
    const reorderItemsStore = useCartStore(s => s.reorderItems);

    // 2. Selective state from Zustand
    const cart = useCartStore(s => s.cart);
    const appliedPromo = useCartStore(s => s.appliedPromo);
    const isLoading = useCartStore(s => s.isLoading);

    // 3. Memoized Bridge Actions
    const fetchCart = useCallback(async (tid: string, sid: string) => {
        await fetchCartStore(tid, sid);
    }, [fetchCartStore]);

    const addToCart = useCallback(async (item: MenuItem, customizations?: Customization[]) => {
        if (!tenant || !sessionId) return;
        await addToCartStore(tenant.id, sessionId, item, customizations);
    }, [tenant?.id, sessionId, addToCartStore]);

    const updateCartQuantity = useCallback(async (uniqueId: string, delta: number) => {
        if (!tenant || !sessionId) return;
        await updateQuantityStore(tenant.id, sessionId, uniqueId, delta);
    }, [tenant?.id, sessionId, updateQuantityStore]);

    const clearCart = useCallback(async () => {
        if (!tenant || !sessionId) return;
        await clearCartStore(tenant.id, sessionId);
    }, [tenant?.id, sessionId, clearCartStore]);

    const applyPromoCode = useCallback((promo: PromoCode | null) => {
        setPromoStore(promo);
    }, [setPromoStore]);

    const reorderPastOrder = useCallback(async (orderItems: OrderItem[]) => {
        if (!tenant || !sessionId) return;
        
        const dbItems: { menuItemId: string, quantity: number, customizations: Customization[] }[] = [];
        const fullCartItems: CartItem[] = [];

        for (const item of orderItems) {
            const liveItem = menuItems.find((m: MenuItem) => m.id === item.id || m.name === item.name);
            if (!liveItem || !liveItem.id) continue;
            
            const uniqueId = `${liveItem.id}-${JSON.stringify(item.customizations || [])}`;
            fullCartItems.push({
                ...liveItem,
                id: liveItem.id,
                uniqueId,
                quantity: item.quantity,
                customizations: item.customizations || [],
                cart_id: '' 
            });
            
            dbItems.push({
                menuItemId: liveItem.id,
                quantity: item.quantity,
                customizations: item.customizations || []
            });
        }

        if (fullCartItems.length > 0) {
            await reorderItemsStore(tenant.id, sessionId, dbItems, fullCartItems);
        }
    }, [tenant?.id, sessionId, menuItems, reorderItemsStore]);

    // 4. Effects
    useEffect(() => {
        if (tenant && sessionId) {
            fetchCart(tenant.id, sessionId);
        }
    }, [tenant?.id, sessionId, fetchCart]);

    const value = useMemo(() => ({
        cart,
        appliedPromo,
        promoCodes: PROMO_CODES,
        isLoading,
        addToCart,
        updateCartQuantity,
        clearCart,
        reorderPastOrder,
        validatePromoCode: (code: string, cartTotal: number) => {
            const promo = PROMO_CODES.find(p => p.code === code && p.is_active);
            if (!promo) return { valid: false, message: 'Invalid promo code' };
            if (cartTotal < promo.min_order_value) {
                return { valid: false, message: `Min ₹${promo.min_order_value}` };
            }
            return { valid: true, message: 'Applied!', promo };
        },
        applyPromoCode
    }), [
        cart, appliedPromo, isLoading, addToCart, updateCartQuantity, 
        clearCart, reorderPastOrder, applyPromoCode
    ]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart error');
    return context;
};
