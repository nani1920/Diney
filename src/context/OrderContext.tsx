'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Order, OrderStatus } from '@/types';
import { createOrder as createCloudOrder, updateOrderStatusServer, getTenantOrders, getCustomerOrders, getOrderById, getAuthenticatedOrder } from '@/app/actions/orders';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'react-hot-toast';
import { playNotificationChime } from '@/lib/sounds';
import { usePathname } from 'next/navigation';

interface OrderContextType {
    orders: Order[];
    placeOrder: (customerData: { name: string; mobile: string; note?: string }) => Promise<Order | null>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    fetchCustomerOrders: (tenantId: string, mobile: string) => Promise<Order[]>;
    refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
    const { tenant, isAdmin } = useStore();
    const { cart, appliedPromo } = useCart();
    const [orders, setOrders] = useState<Order[]>([]);
    const pathname = usePathname();

    const fetchCustomerOrders = useCallback(async (tenantId: string, mobile: string) => {
        const result = await getCustomerOrders(tenantId, mobile);
        if (result.success && result.data) {
            const incomingOrders = result.data as Order[];
            setOrders(prev => {
                const merged = [...prev];
                incomingOrders.forEach(newOrder => {
                    const existingIdx = merged.findIndex(o => o.order_id === newOrder.order_id);
                    if (existingIdx >= 0) {
                        merged[existingIdx] = { ...newOrder, items: newOrder.items?.length > 0 ? newOrder.items : merged[existingIdx].items };
                    } else {
                        merged.unshift(newOrder);
                    }
                });
                return merged.sort((a, b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime());
            });
            return incomingOrders;
        }
        return [];
    }, []);

    const refreshOrders = useCallback(async () => {
        if (!tenant) return;
        const ordersRes = await getTenantOrders(tenant.id);
        if (ordersRes.success) {
            setOrders(ordersRes.data || []);
        } else {
            console.error('Failed to fetch orders:', ordersRes.error);
            toast.error(ordersRes.error || 'Failed to fetch orders');
        }
    }, [tenant]);

    // Automatically refresh orders for admins
    useEffect(() => {
        if (tenant && isAdmin) {
            refreshOrders();
        }
    }, [tenant, isAdmin, refreshOrders]);

    // Real-time listener
    useEffect(() => {
        if (!tenant) return;

        const channel = supabase
            .channel(`tenant_orders_${tenant.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `tenant_id=eq.${tenant.id}`
            }, async (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newOrderRaw = payload.new;
                    setTimeout(async () => {
                        const result = isAdmin 
                            ? await getOrderById(newOrderRaw.id, tenant.id)
                            : await getAuthenticatedOrder(newOrderRaw.id, tenant.id);
                        
                        if (result?.success && result.data) {
                            const newOrder = result.data as Order;
                            setOrders(prev => {
                                if (prev.some(o => o.order_id === newOrder.order_id)) return prev;
                                 if (newOrder.order_status === 'received' && isAdmin && pathname?.includes('/admin')) {
                                    playNotificationChime();
                                    toast.success(`New order received! #${newOrder.short_id}`, { icon: '🔔' });
                                }
                                return [newOrder, ...prev];
                            });
                        }
                    }, 1000);
                } else if (payload.eventType === 'UPDATE') {
                    const updatedOrder = payload.new;
                    setOrders(prev => prev.map(o => o.order_id === updatedOrder.id ? { ...o, order_status: updatedOrder.status } : o));
                } else if (payload.eventType === 'DELETE') {
                    const deletedId = payload.old.id;
                    setOrders(prev => prev.filter(o => o.order_id !== deletedId));
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [tenant, isAdmin]);

    const placeOrder = async (customerData: { name: string; mobile: string; note?: string }) => {
        if (!tenant) { toast.error('Store data not loaded'); return null; }
        if (cart.length === 0) { toast.error('Your cart is empty'); return null; }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity) + (item.customizations || []).reduce((cSum, c) => cSum + (c.price || 0) * item.quantity, 0), 0);
        const discountAmount = appliedPromo ? (appliedPromo.discount_type === 'percentage' ? Math.round((subtotal * appliedPromo.discount_value) / 100) : appliedPromo.discount_value) : 0;
        const totalAmount = subtotal - discountAmount;

        const result = await createCloudOrder(tenant.id, customerData.name, customerData.mobile, cart, totalAmount);
        if (!result.success || !result.data) {
            toast.error(result.error || 'Failed to place order');
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

        setOrders(prev => [newOrder, ...prev]);
        return newOrder;
    };

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        if (!tenant) return;
        const previousOrders = [...orders];
        
        setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, order_status: status } : o));

        try {
            const result = await updateOrderStatusServer(orderId, status, tenant.id);
            if (!result.success) throw new Error(result.error);
        } catch (error: any) {
            setOrders(previousOrders);
            toast.error('Failed to update status. Rolled back.');
        }
    };

    return (
        <OrderContext.Provider value={{
            orders,
            placeOrder,
            updateOrderStatus,
            fetchCustomerOrders,
            refreshOrders
        }}>
            {children}
        </OrderContext.Provider>
    );
};

export const useOrders = () => {
    const context = useContext(OrderContext);
    if (!context) throw new Error('useOrders must be used within an OrderProvider');
    return context;
};
