'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { MenuItem, Order, Customer, CartItem, PromoCode } from '@/types';
import { getTenantData, getTenantMenu, upsertMenuItem, deleteMenuItemServer, updateTenantConfig, getTenantCategories } from '@/app/actions/tenant';
import { createOrder as createCloudOrder, getTenantOrders, updateOrderStatusServer, getTenantCustomers } from '@/app/actions/orders';
import { getCart, addToCartDB, updateCartQuantityDB, clearCartDB } from '@/app/actions/cart';
import { toast } from 'react-hot-toast';

export interface TenantData {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    config?: any;
    is_active?: boolean;
    tier?: string;
    subscription_status?: string;
}

// Promo Codes
const PROMO_CODES: PromoCode[] = [
    {
        code: 'GFood',
        discount_type: 'percentage',
        discount_value: 10, // 10% off
        min_order_value: 200,
        is_active: true
    }
];

// Initial Seed Data with prep times
// Initial state removed - now fetched from cloud

interface StoreContextType {
    tenant: TenantData | null;
    menuItems: MenuItem[];
    categories: any[];
    orders: Order[];
    customers: Customer[];
    cart: CartItem[];
    promoCodes: PromoCode[];
    appliedPromo: PromoCode | null;
    addToCart: (item: MenuItem, customizations?: any[]) => void;
    updateCartQuantity: (itemId: string, delta: number) => void;
    clearCart: () => void;
    placeOrder: (customer: { name: string; mobile: string; note?: string }) => Promise<Order | null>;
    updateOrderStatus: (orderId: string, status: Order['order_status']) => void;
    addMenuItem: (item: MenuItem) => Promise<boolean>;
    updateMenuItem: (item: MenuItem) => Promise<boolean>;
    deleteMenuItem: (itemId: string) => Promise<boolean>;
    validatePromoCode: (code: string, cartTotal: number) => { valid: boolean; message: string; promo?: PromoCode };
    applyPromoCode: (promo: PromoCode | null) => void;
    isStoreOpen: boolean;
    customer: { name: string; mobile: string } | null;
    updateCustomer: (name: string, mobile: string) => void;
    toggleStoreStatus: () => void;
    openingTime: string;
    closingTime: string;
    setOpeningTime: (time: string) => void;
    setClosingTime: (time: string) => void;
    fetchStoreData: (slug: string) => Promise<void>;
    isLoading: boolean;
    isInitialLoading: boolean;
    sessionId: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    const [isStoreOpen, setIsStoreOpen] = useState(false);
    const [customer, setCustomer] = useState<{ name: string; mobile: string } | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Initial Hydration
    useEffect(() => {
        const savedName = localStorage.getItem('customerName');
        const savedMobile = localStorage.getItem('customerMobile');
        if (savedName && savedMobile) {
            setCustomer({ name: savedName, mobile: savedMobile });
        }

        let sId = localStorage.getItem('sessionId');
        if (!sId) {
            // Fallback for non-secure contexts (lvh.me)
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                sId = crypto.randomUUID();
            } else {
                sId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
            localStorage.setItem('sessionId', sId);
        }
        setSessionId(sId);
    }, []);

    const updateCustomer = (name: string, mobile: string) => {
        localStorage.setItem('customerName', name);
        localStorage.setItem('customerMobile', mobile);
        setCustomer({ name, mobile });
    };
    const [openingTime, setOpeningTimeState] = useState('10:00');
    const [closingTime, setClosingTimeState] = useState('22:00');

    const fetchStoreData = useCallback(async (slug: string) => {
        setIsInitialLoading(true);
        try {
            const tenantRes = await getTenantData(slug);
            if (!tenantRes.success || !tenantRes.data) {
                setTenant(null); // Explicitly clear if not found
                toast.error(tenantRes.error || 'Store not found');
                return;
            }
            const tenantData = tenantRes.data;
            setTenant(tenantData);

            // Fetch Menu and Categories in parallel
            const [menuRes, categoriesRes] = await Promise.all([
                getTenantMenu(tenantData.id, slug),
                getTenantCategories(tenantData.id)
            ]);
            
            if (menuRes.success) {
                setMenuItems(menuRes.data || []);
            }

            if (categoriesRes.success) {
                setCategories(categoriesRes.data || []);
            }
            
            const ordersRes = await getTenantOrders(tenantData.id);
            if (ordersRes.success) {
                setOrders(ordersRes.data || []);
            }
            
            const customersRes = await getTenantCustomers(tenantData.id);
            if (customersRes.success) {
                setCustomers(customersRes.data || []);
            }

            // Fetch Database Cart
            const sId = localStorage.getItem('sessionId');
            if (sId) {
                const cartRes = await getCart(tenantData.id, sId);
                if (cartRes.success) {
                    setCart(cartRes.data || []);
                }
            }

            // Apply tenant config if exists
            if (tenantData.config) {
                setIsStoreOpen(tenantData.config.isStoreOpen ?? true);
                setOpeningTimeState(tenantData.config.openingTime ?? '10:00');
                setClosingTimeState(tenantData.config.closingTime ?? '22:00');
            }
        } catch (error) {
            console.error('Failed to fetch store data:', error);
            toast.error('Error loading store data');
        } finally {
            setIsInitialLoading(false);
            setIsInitialized(true);
        }
    }, []);




    // We removed localStorage sync for cart in favor of DB persistence
    // But we keep it as a transient fallback if needed
    useEffect(() => {
        if (isInitialized && cart.length > 0) {
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    }, [cart, isInitialized]);

    const addToCart = async (item: MenuItem, customizations?: any[]) => {
        if (!tenant || !sessionId) {
            toast.error('Session not initialized');
            return;
        }

        // Optimistic UI Update
        const tempCartItem: CartItem = { 
            ...item, 
            quantity: 1, 
            customizations,
            id: item.id // Keep original item ID for lookup
        };

        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id && JSON.stringify(i.customizations) === JSON.stringify(customizations));
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id && JSON.stringify(i.customizations) === JSON.stringify(customizations)
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, tempCartItem];
        });

        // Sync to DB
        const result = await addToCartDB(tenant.id, sessionId, item.id, customizations);
        if (!result.success) {
            toast.error(result.error || 'Failed to sync cart to cloud');
            // Refresh cart from DB as fallback
            const refreshRes = await getCart(tenant.id, sessionId);
            if (refreshRes.success) setCart(refreshRes.data || []);
        }
    };

    const updateCartQuantity = async (itemId: string, delta: number) => {
        if (!tenant || !sessionId) return;

        // Find the cart item ID from the current cart state
        const cartItem = cart.find(i => i.id === itemId);
        if (!cartItem) return;

        // Optimistic UI
        setCart((prev) =>
            prev
                .map((item) =>
                    item.id === itemId ? { ...item, quantity: item.quantity + delta } : item
                )
                .filter((item) => item.quantity > 0)
        );

        // Sync to DB
        // If we have a cart_id (from DB), use it, otherwise we'd need to fetch or use a matching strategy
        // For simplicity, let's look up the item in the DB cart
        const cartRes = await getCart(tenant.id, sessionId);
        if (cartRes.success) {
            const dbItem = (cartRes.data as any[]).find(i => i.id === itemId);
            if (dbItem) {
                await updateCartQuantityDB(tenant.id, sessionId, dbItem.cart_id, delta);
            }
        }
    };

    const clearCart = async () => {
        setCart([]);
        setAppliedPromo(null);
        if (tenant && sessionId) {
            await clearCartDB(tenant.id, sessionId);
        }
    };

    const validatePromoCode = (code: string, cartTotal: number) => {
        const promo = PROMO_CODES.find(p => p.code === code && p.is_active);

        if (!promo) {
            return { valid: false, message: 'Invalid promo code' };
        }

        if (cartTotal < promo.min_order_value) {
            return { valid: false, message: `Minimum order value ₹${promo.min_order_value} required` };
        }

        return { valid: true, message: 'Promo code applied successfully!', promo };
    };

    const applyPromoCode = (promo: PromoCode | null) => {
        setAppliedPromo(promo);
    };

    const placeOrder = async (customerData: { name: string; mobile: string; note?: string }) => {
        if (!tenant) {
            toast.error('Store data not loaded');
            return null;
        }

        const subtotal = cart.reduce((sum, item) => {
            const itemTotal = item.price * item.quantity;
            const customizationTotal = (item.customizations || [])
                .filter(c => c.price)
                .reduce((cSum, c) => cSum + (c.price || 0) * item.quantity, 0);
            return sum + itemTotal + customizationTotal;
        }, 0);

        let discountAmount = 0;
        if (appliedPromo) {
            if (appliedPromo.discount_type === 'percentage') {
                discountAmount = Math.round((subtotal * appliedPromo.discount_value) / 100);
            } else {
                discountAmount = appliedPromo.discount_value;
            }
        }

        const totalAmount = subtotal - discountAmount;

        // 🚀 Cloud Submission
        setIsLoading(true);
        const result = await createCloudOrder(
            tenant.id,
            customerData.name,
            customerData.mobile,
            cart,
            totalAmount
        );
        setIsLoading(false);

        if (!result.success || !result.data) {
            toast.error(result.error || 'Failed to place order. Please try again.');
            return null;
        }

        const orderData = result.data;

        // Local state update for immediate feedback
        const maxPrepTime = Math.max(...cart.map(item => item.prep_time_minutes || 10));
        const estimatedReadyTime = new Date(Date.now() + (maxPrepTime + 5) * 60000).toISOString();

        const newOrder: Order = {
            order_id: orderData.orderId!,
            short_id: orderData.shortId || orderData.orderId!.replace(/\D/g, '').slice(0, 6) || '000000',
            customer_name: customerData.name,
            customer_mobile: customerData.mobile,
            order_note: customerData.note,
            items: [...cart],
            total_amount: totalAmount,
            discount_amount: discountAmount > 0 ? discountAmount : undefined,
            applied_promo_code: appliedPromo?.code,
            estimated_ready_time: estimatedReadyTime,
            order_status: 'received',
            order_time: new Date().toISOString(),
        };

        setOrders((prev) => [newOrder, ...prev]);
        clearCart();
        toast.success('Order placed successfully!');
        return newOrder;
    };

    const updateOrderStatus = async (orderId: string, status: Order['order_status']) => {
        if (!tenant) return;
        
        // Optimistic update
        setOrders((prev) =>
            prev.map((o) => (o.order_id === orderId ? { ...o, order_status: status } : o))
        );

        const result = await updateOrderStatusServer(orderId, status, tenant.id);
        if (!result.success) {
            toast.error('Failed to update order status in cloud');
            // Rollback could be implemented here if needed
        }
    };

    const addMenuItem = async (item: MenuItem) => {
        if (!tenant) return false;
        
        // Optimistic UI Update
        const optimisticId = item.id || 'temp-' + Date.now();
        const optimisticItem = { ...item, id: optimisticId };
        
        setMenuItems((prev) => [...prev, optimisticItem as any]);
        setIsLoading(true);
        
        try {
            const result = await upsertMenuItem(tenant.id, tenant.slug, item);
            setIsLoading(false);
            
            if (result.success && result.data) {
                const itemData = result.data;
                const mappedItem = {
                    ...itemData,
                    availability_status: (itemData as any).is_available ?? (itemData as any).availability_status
                };
                // Replace optimistic item with actual server item (keeps DB ID and mapping)
                setMenuItems((prev) => 
                    prev.map(i => i.id === optimisticId ? (mappedItem as any) : i)
                );
                toast.success('Item added successfully');
                return true;
            } else {
                // Rollback
                setMenuItems((prev) => prev.filter(i => i.id !== optimisticId));
                toast.error('Failed to add item: ' + result.error);
                return false;
            }
        } catch (error) {
            setIsLoading(false);
            setMenuItems((prev) => prev.filter(i => i.id !== optimisticId));
            toast.error('Error adding item');
            return false;
        }
    };

    const updateMenuItem = async (item: MenuItem) => {
        if (!tenant) return false;
        
        // Optimistic UI Update
        const previousState = [...menuItems];
        setMenuItems((prev) => prev.map((i) => (i.id === item.id ? { ...item } : i)));
        setIsLoading(true);
        
        try {
            const result = await upsertMenuItem(tenant.id, tenant.slug, item);
            setIsLoading(false);

            if (result.success && result.data) {
                const itemData = result.data;
                const mappedItem = {
                    ...itemData,
                    availability_status: (itemData as any).is_available ?? (itemData as any).availability_status
                };
                setMenuItems((prev) => prev.map((i) => (i.id === item.id ? (mappedItem as any) : i)));
                toast.success('Item updated successfully');
                return true;
            } else {
                // Rollback
                setMenuItems(previousState);
                toast.error('Failed to update item: ' + result.error);
                return false;
            }
        } catch (error) {
            setIsLoading(false);
            setMenuItems(previousState);
            toast.error('Error updating item');
            return false;
        }
    };

    const deleteMenuItem = async (itemId: string) => {
        if (!tenant) return false;
        
        // Optimistic UI Update
        const deletedItem = menuItems.find(i => i.id === itemId);
        setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
        setIsLoading(true);
        
        try {
            const result = await deleteMenuItemServer(tenant.id, tenant.slug, itemId);
            setIsLoading(false);

            if (result.success) {
                toast.success('Item deleted successfully');
                return true;
            } else {
                // Rollback
                if (deletedItem) setMenuItems((prev) => [...prev, deletedItem]);
                toast.error('Failed to delete item: ' + result.error);
                return false;
            }
        } catch (error) {
            setIsLoading(false);
            if (deletedItem) setMenuItems((prev) => [...prev, deletedItem]);
            toast.error('Error deleting item');
            return false;
        }
    };

    const toggleStoreStatus = async () => {
        if (!tenant) return;
        const newStatus = !isStoreOpen;
        setIsStoreOpen(newStatus);
        
        const newConfig = {
            ...tenant.config,
            isStoreOpen: newStatus
        };
        
        const result = await updateTenantConfig(tenant.id, tenant.slug, newConfig);
        if (result.success) {
            setTenant({ ...tenant, config: newConfig });
        } else {
            toast.error('Failed to update store status in cloud');
            setIsStoreOpen(!newStatus); // Rollback
        }
    };

    const setOpeningTime = async (time: string) => {
        if (!tenant) return;
        setOpeningTimeState(time);
        const newConfig = { ...tenant.config, openingTime: time };
        const result = await updateTenantConfig(tenant.id, tenant.slug, newConfig);
        if (result.success) setTenant({ ...tenant, config: newConfig });
    };

    const setClosingTime = async (time: string) => {
        if (!tenant) return;
        setClosingTimeState(time);
        const newConfig = { ...tenant.config, closingTime: time };
        const result = await updateTenantConfig(tenant.id, tenant.slug, newConfig);
        if (result.success) setTenant({ ...tenant, config: newConfig });
    };

    return (
        <StoreContext.Provider
            value={{
                tenant,
                menuItems,
                categories,
                orders,
                customers,
                cart,
                promoCodes: PROMO_CODES,
                appliedPromo,
                addToCart,
                updateCartQuantity,
                clearCart,
                placeOrder: placeOrder as any,
                updateOrderStatus,
                addMenuItem,
                updateMenuItem,
                deleteMenuItem,
                validatePromoCode,
                applyPromoCode,
                isStoreOpen,
                customer,
                updateCustomer,
                toggleStoreStatus,
                openingTime,
                closingTime,
                setOpeningTime: setOpeningTimeState,
                setClosingTime: setClosingTimeState,
                fetchStoreData,
                isLoading,
                isInitialLoading,
                sessionId
            }}
        >
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within a StoreProvider');
    return context;
};
