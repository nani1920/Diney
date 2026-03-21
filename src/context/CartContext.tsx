'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MenuItem, CartItem, PromoCode, Customization, OrderItem } from '@/types';
import { getCart, addToCartDB, updateCartQuantityDB, clearCartDB, replaceCartDB } from '@/app/actions/cart';
import { useStore } from '@/context/StoreContext';
import { useAdmin } from '@/context/AdminContext';
import { toast } from 'react-hot-toast';

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
    const [cart, setCart] = useState<CartItem[]>([]);
    const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

    // Initial load from LocalStorage or DB
    useEffect(() => {
        if (!tenant || !sessionId) return;
        
        const loadCart = async () => {
             // Try LocalStorage first for instant UI
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                try {
                    const parsed = JSON.parse(savedCart);
                    // Migration/Fix: Ensure every item has a uniqueId
                    const validated = (parsed as CartItem[]).map(item => ({
                        ...item,
                        uniqueId: item.uniqueId || `${item.id}-${JSON.stringify(item.customizations || [])}`
                    }));
                    setCart(validated);
                } catch (err) {
                    console.error("Failed to parse local cart", err);
                }
            }

            // Then sync with DB
            const cartRes = await getCart(tenant.id, sessionId);
            if (cartRes.success && cartRes.data) {
                setCart(cartRes.data);
                localStorage.setItem('cart', JSON.stringify(cartRes.data));
            }
        };

        loadCart();
    }, [tenant, sessionId]);

    // Sync LocalStorage on change
    useEffect(() => {
        if (cart.length > 0) {
            localStorage.setItem('cart', JSON.stringify(cart));
        } else {
            localStorage.removeItem('cart');
        }
    }, [cart]);

    const addToCart = async (item: MenuItem, customizations?: Customization[]) => {
        if (!tenant || !sessionId) {
            toast.error('Session not initialized');
            return;
        }

        const uniqueId = `${item.id}-${JSON.stringify(customizations || [])}`;
        const previousCart = [...cart];
        
        const tempCartItem: CartItem = { 
            ...item, 
            uniqueId,
            quantity: 1, 
            customizations: customizations || [],
            id: item.id  
        };

        setCart((prev) => {
            const existing = prev.find((i) => i.uniqueId === uniqueId);
            if (existing) {
                return prev.map((i) =>
                    i.uniqueId === uniqueId
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, tempCartItem];
        });

        // --- SERVER SYNC ---
        try {
            const cartItemId = await addToCartDB(tenant.id, sessionId, item.id, customizations);
            if (typeof cartItemId === 'string') {
                // Update the item with its real DB ID for future direct updates
                setCart(prev => prev.map(i => i.uniqueId === uniqueId ? { ...i, cart_id: cartItemId } : i));
            } else {
                throw new Error('Failed to get cart item ID');
            }
        } catch (error) {
            // --- ROLLBACK ---
            setCart(previousCart);
            const message = error instanceof Error ? error.message : 'Failed to sync cart';
            toast.error(message || 'Failed to sync cart. Changes rolled back.');
            
            // Re-sync with DB to be sure
            const refreshRes = await getCart(tenant.id, sessionId);
            if (refreshRes.success) setCart(refreshRes.data || []);
        }
    };

    const updateCartQuantity = async (uniqueId: string, delta: number) => {
        if (!tenant || !sessionId) return;

        // --- OPTIMISTIC UPDATE ---
        const previousCart = [...cart];
        const cartItem = cart.find(i => i.uniqueId === uniqueId);
        if (!cartItem) return;

        setCart((prev) =>
            prev
                .map((item) =>
                    item.uniqueId === uniqueId ? { ...item, quantity: item.quantity + delta } : item
                )
                .filter((item) => item.quantity > 0)
        );

        // --- SERVER SYNC ---
        try {
            // HIGH PERFORMANCE: Use cart_id directly if we have it
            let targetCartId = cartItem.cart_id;
            
            if (!targetCartId) {
                // Fallback: This only happens if user clicks +/- before the first addToCartDB finishes
                const cartRes = await getCart(tenant.id, sessionId);
                const dbItem = (cartRes.data || []).find((i: CartItem) => i.uniqueId === uniqueId);
                if (dbItem) targetCartId = dbItem.cart_id;
            }

            if (targetCartId) {
                const result = await updateCartQuantityDB(tenant.id, sessionId, targetCartId, delta);
                if (!result.success) throw new Error(result.error);
            } else {
                throw new Error("Item sync ID missing");
            }
        } catch (error) {
            // --- ROLLBACK ---
            setCart(previousCart);
            const message = error instanceof Error ? error.message : 'Failed to update quantity';
            toast.error(message || 'Failed to update quantity. Rolled back.');
        }
    };

    const clearCart = async () => {
        const previousCart = [...cart];
        setCart([]);
        setAppliedPromo(null);
        
        if (tenant && sessionId) {
            try {
                const result = await clearCartDB(tenant.id, sessionId);
                if (!result.success) throw new Error();
            } catch {
                setCart(previousCart);
                toast.error('Failed to clear cloud cart. Rolled back.');
            }
        }
    };

    const reorderPastOrder = async (orderItems: OrderItem[]) => {
        if (!tenant || !sessionId) {
            toast.error('Session not initialized');
            return;
        }
        
        const previousCart = [...cart];
        const newCartItems: CartItem[] = [];
        const dbItems: { menuItemId: string, quantity: number, customizations: Customization[] }[] = [];
        let allMatched = true;

        for (const item of orderItems) {
            const liveItem = menuItems.find((m: MenuItem) => m.id === item.id || m.name === item.name);
            if (!liveItem || !liveItem.id) {
                allMatched = false;
                continue;
            }
            
            const uniqueId = `${liveItem.id}-${JSON.stringify(item.customizations || [])}`;
            newCartItems.push({
                ...liveItem,
                id: liveItem.id,
                uniqueId,
                quantity: item.quantity,
                customizations: item.customizations || []
            });

            dbItems.push({
                menuItemId: liveItem.id,
                quantity: item.quantity,
                customizations: item.customizations || []
            });
        }

        if (newCartItems.length === 0) {
            toast.error("None of these items are currently available on the menu.");
            return;
        }

        toast.loading("Replacing cart...", { id: 'reorder' });
        setCart(newCartItems);

        try {
            const result = await replaceCartDB(tenant.id, sessionId, dbItems);
            if (!result.success) throw new Error(result.error);
            
            if (!allMatched) {
                toast.success("Added to cart! (Some items no longer available)", { id: 'reorder' });
            } else {
                toast.success("Order copied to cart!", { id: 'reorder' });
            }
        } catch (error) {
            setCart(previousCart);
            const message = error instanceof Error ? error.message : 'Failed to sync reorder';
            toast.error(message || "Failed to sync reorder", { id: 'reorder' });
        }
    };

    const validatePromoCode = (code: string, cartTotal: number) => {
        const promo = PROMO_CODES.find(p => p.code === code && p.is_active);
        if (!promo) return { valid: false, message: 'Invalid promo code' };
        if (cartTotal < promo.min_order_value) {
            return { valid: false, message: `Minimum order value ₹${promo.min_order_value} required` };
        }
        return { valid: true, message: 'Promo code applied successfully!', promo };
    };

    const applyPromoCode = (promo: PromoCode | null) => {
        setAppliedPromo(promo);
    };

    return (
        <CartContext.Provider value={{
            cart,
            appliedPromo,
            promoCodes: PROMO_CODES,
            addToCart,
            updateCartQuantity,
            clearCart,
            reorderPastOrder,
            validatePromoCode,
            applyPromoCode
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
