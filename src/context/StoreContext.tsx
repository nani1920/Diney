'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { MenuItem, Order, Customer, CartItem, PromoCode, ServerActionResult } from '@/types';
import { getTenantData, getTenantMenu, upsertMenuItem, deleteMenuItemServer, updateTenantConfig, getTenantCategories } from '@/app/actions/tenant';
import { createOrder as createCloudOrder, getTenantOrders, updateOrderStatusServer, getTenantCustomers, getCustomerOrders, getOrderById } from '@/app/actions/orders';
import { supabase } from '@/lib/supabase';
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

 
const PROMO_CODES: PromoCode[] = [
    {
        code: 'GFood',
        discount_type: 'percentage',
        discount_value: 10,  
        min_order_value: 200,
        is_active: true
    }
];

 
 

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
    fetchCustomerOrders: (tenantId: string, mobile: string) => Promise<void>;
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

     
    useEffect(() => {
        const savedName = localStorage.getItem('customerName');
        const savedMobile = localStorage.getItem('customerMobile');
        if (savedName && savedMobile) {
            setCustomer({ name: savedName, mobile: savedMobile });
        }

        let sId = localStorage.getItem('sessionId');
        if (!sId) {
             
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
        if (tenant) {
            fetchCustomerOrders(tenant.id, mobile);
        }
    };

    const fetchCustomerOrders = useCallback(async (tenantId: string, mobile: string) => {
        const result = await getCustomerOrders(tenantId, mobile);
        if (result.success) {
            setOrders(result.data || []);
            return result.data;
        }
        return [];
    }, []);
    const [openingTime, setOpeningTimeState] = useState('10:00');
    const [closingTime, setClosingTimeState] = useState('22:00');

    const fetchStoreData = useCallback(async (slug: string) => {
        setIsInitialLoading(true);
        try {
            const tenantRes = await getTenantData(slug);
            if (!tenantRes.success || !tenantRes.data) {
                setTenant(null);  
                toast.error(tenantRes.error || 'Store not found');
                return;
            }
            const tenantData = tenantRes.data;
            setTenant(tenantData);

             
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
            } else {
                 
                const savedMobile = localStorage.getItem('customerMobile');
                if (savedMobile) {
                    await fetchCustomerOrders(tenantData.id, savedMobile);
                } else {
                    setOrders([]);
                }
            }
            
            const customersRes = await getTenantCustomers(tenantData.id);
            if (customersRes.success) {
                setCustomers(customersRes.data || []);
            } else {
                setCustomers([]);
            }

             
            const sId = localStorage.getItem('sessionId');
            if (sId) {
                const cartRes = await getCart(tenantData.id, sId);
                if (cartRes.success) {
                    setCart(cartRes.data || []);
                }
            }

             
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

    useEffect(() => {
        if (!tenant) return;

        const channel = supabase
            .channel(`tenant_orders_${tenant.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `tenant_id=eq.${tenant.id}`
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newOrderRaw = payload.new;
                        // Small delay to ensure DB items are ready
                        setTimeout(async () => {
                            const result = await getOrderById(newOrderRaw.id, tenant.id);
                            if (result.success && result.data) {
                                const newOrder = result.data as Order; // Explicit cast to help TS narrowing
                                setOrders(prev => {
                                    if (prev.some(o => o.order_id === newOrder.order_id)) return prev;
                                    if (newOrder.order_status === 'received') {
                                        toast.success(`New order received! #${newOrder.short_id}`, {
                                            duration: 5000,
                                            icon: '🔔'
                                        });
                                    }
                                    return [newOrder, ...prev];
                                });
                            }
                        }, 1000);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedOrder = payload.new;
                        setOrders(prev => 
                            prev.map(o => o.order_id === updatedOrder.id 
                                ? { ...o, order_status: updatedOrder.status } 
                                : o
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old.id;
                        setOrders(prev => prev.filter(o => o.order_id !== deletedId));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tenant]);




     
     
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

         
        const tempCartItem: CartItem = { 
            ...item, 
            quantity: 1, 
            customizations,
            id: item.id  
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

         
        const result = await addToCartDB(tenant.id, sessionId, item.id, customizations);
        if (!result.success) {
            toast.error(result.error || 'Failed to sync cart to cloud');
             
            const refreshRes = await getCart(tenant.id, sessionId);
            if (refreshRes.success) setCart(refreshRes.data || []);
        }
    };

    const updateCartQuantity = async (itemId: string, delta: number) => {
        if (!tenant || !sessionId) return;

         
        const cartItem = cart.find(i => i.id === itemId);
        if (!cartItem) return;

         
        setCart((prev) =>
            prev
                .map((item) =>
                    item.id === itemId ? { ...item, quantity: item.quantity + delta } : item
                )
                .filter((item) => item.quantity > 0)
        );

         
         
         
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
        
         
        setOrders((prev) =>
            prev.map((o) => (o.order_id === orderId ? { ...o, order_status: status } : o))
        );

        const result = await updateOrderStatusServer(orderId, status, tenant.id);
        if (!result.success) {
            toast.error('Failed to update order status in cloud');
             
        }
    };

    const addMenuItem = async (item: MenuItem) => {
        if (!tenant) return false;
        
         
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
                 
                setMenuItems((prev) => 
                    prev.map(i => i.id === optimisticId ? (mappedItem as any) : i)
                );
                toast.success('Item added successfully');
                return true;
            } else {
                 
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
            setIsStoreOpen(!newStatus);  
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
                fetchCustomerOrders,
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
