import { create } from 'zustand';
import type { CartItem, MenuItem, Customization, PromoCode } from '@/types';
import { getCart, addToCartDB, updateCartQuantityDB, clearCartDB, replaceCartDB } from '@/app/actions/cart';
import { toast } from 'react-hot-toast';

interface CartState {
    cart: CartItem[];
    isLoading: boolean;
    appliedPromo: PromoCode | null;
    
    // Actions
    setCart: (cart: CartItem[]) => void;
    fetchCart: (tenantId: string, sessionId: string) => Promise<void>;
    addToCart: (tenantId: string, sessionId: string, item: MenuItem, customizations?: Customization[]) => Promise<void>;
    updateQuantity: (tenantId: string, sessionId: string, uniqueId: string, delta: number) => Promise<void>;
    clearCart: (tenantId: string, sessionId: string) => Promise<void>;
    setPromo: (promo: PromoCode | null) => void;
    reorderItems: (tenantId: string, sessionId: string, dbItems: { menuItemId: string, quantity: number, customizations: Customization[] }[], fullCartItems: CartItem[]) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
    cart: [],
    isLoading: false,
    appliedPromo: null,

    setCart: (cart) => set({ cart }),

    fetchCart: async (tenantId, sessionId) => {
        set({ isLoading: true });
        try {
            const res = await getCart(tenantId, sessionId);
            if (res.success && res.data) {
                set({ cart: res.data as CartItem[] });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    addToCart: async (tenantId, sessionId, item, customizations = []) => {
        const uniqueId = `${item.id}-${JSON.stringify(customizations)}`;
        const existing = get().cart.find(i => i.uniqueId === uniqueId);
        
        // Optimistic Update
        if (existing) {
            set({
                cart: get().cart.map(i => i.uniqueId === uniqueId ? { ...i, quantity: i.quantity + 1 } : i)
            });
        } else {
            const newItem: CartItem = {
                ...item,
                cart_id: '', 
                quantity: 1,
                customizations,
                uniqueId
            };
            set({ cart: [...get().cart, newItem] });
        }

        try {
            const res = await addToCartDB(tenantId, sessionId, item.id, customizations);
            if (res.success && res.data) {
                const cartItemId = res.data as string;
                set({
                    cart: get().cart.map(i => i.uniqueId === uniqueId ? { ...i, cart_id: cartItemId } : i)
                });
            }
        } catch (error) {
            toast.error("Failed to sync cart item");
            get().fetchCart(tenantId, sessionId);
        }
    },

    updateQuantity: async (tenantId, sessionId, uniqueId, delta) => {
        const previousCart = [...get().cart];
        const item = get().cart.find(i => i.uniqueId === uniqueId);
        if (!item) return;

        // Optimistic Update
        set({
            cart: get().cart
                .map(i => i.uniqueId === uniqueId ? { ...i, quantity: i.quantity + delta } : i)
                .filter(i => i.quantity > 0)
        });

        try {
            let targetCartId = item.cart_id;
            
            if (!targetCartId) {
                await new Promise(r => setTimeout(r, 500));
                const res = await getCart(tenantId, sessionId);
                const dbItem = (res.data as any[] || []).find((i: any) => i.uniqueId === uniqueId);
                if (dbItem) targetCartId = dbItem.cart_id;
            }

            if (targetCartId) {
                await updateCartQuantityDB(tenantId, sessionId, targetCartId, delta);
            }
        } catch (error) {
            set({ cart: previousCart });
            toast.error("Failed to update quantity");
        }
    },

    clearCart: async (tenantId, sessionId) => {
        const previousCart = [...get().cart];
        set({ cart: [], appliedPromo: null });
        try {
            await clearCartDB(tenantId, sessionId);
        } catch (error) {
            set({ cart: previousCart });
            toast.error("Failed to clear cart");
        }
    },

    setPromo: (appliedPromo) => set({ appliedPromo }),

    reorderItems: async (tenantId, sessionId, dbItems, fullCartItems) => {
        const previousCart = [...get().cart];
        set({ cart: fullCartItems, isLoading: true });
        try {
            const result = await replaceCartDB(tenantId, sessionId, dbItems);
            if (!result.success) throw new Error(result.error);
            toast.success("Past order copied to cart!");
        } catch (error) {
            set({ cart: previousCart });
            toast.error("Failed to reorder items");
        } finally {
            set({ isLoading: false });
        }
    }
}));
