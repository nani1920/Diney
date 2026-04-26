import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, OrderStatus, CartItem, PromoCode } from '@/types';
import { supabase } from '@/lib/supabase';
import {
    createOrder as createCloudOrder,
    updateOrderStatusServer,
    getTenantOrders,
    getCustomerOrders,
    getAdminOrderById,
    getAuthenticatedOrder
} from '@/app/actions/orders';
import { toast } from 'react-hot-toast';
import { playNotificationChime, playUserReadyChime, triggerReadyVibration, triggerStatusVibration } from '@/lib/sounds';

interface OrderState {
    orders: Order[];
    qrScannedOrder: Order | null;
    isQRScannerOpen: boolean;
    realtimeChannel: any | null;
    isLoading: boolean;
    isPollingFallback: boolean;
    lastCompletedOrderId: string | null;
    orderType: 'TAKEAWAY' | 'DINE_IN';
    tableNumber: string | null;

    // Actions
    setOrderType: (type: 'TAKEAWAY' | 'DINE_IN') => void;
    setTableNumber: (tableNumber: string | null) => void;
    setOrders: (orders: Order[]) => void;
    setIsQRScannerOpen: (isOpen: boolean) => void;
    setQrScannedOrder: (order: Order | null) => void;

    fetchTenantOrders: (tenantId: string) => Promise<void>;
    fetchCustomerOrders: (tenantId: string, mobile: string) => Promise<void>;
    updateOrderStatus: (tenantId: string, orderId: string, status: OrderStatus) => Promise<void>;
    broadcastQRScan: (tenantId: string, isAdmin: boolean, order: Order) => void;

    placeOrder: (
        tenant: any, 
        sessionId: string, 
        customerData: { name: string; mobile: string; note?: string }, 
        cart: CartItem[], 
        appliedPromo: PromoCode | null,
        explicitOrderType?: 'TAKEAWAY' | 'DINE_IN',
        explicitTableNumber?: string | null
    ) => Promise<Order | null>;

    setupRealtime: (tenantId: string, isAdmin: boolean, pathname?: string) => void;
    cleanupRealtime: () => void;
}

export const useOrderStore = create<OrderState>()(
    persist(
        (set, get) => ({
            orders: [],
            qrScannedOrder: null,
            isQRScannerOpen: false,
            realtimeChannel: null,
            isLoading: false,
            isPollingFallback: false,
            lastCompletedOrderId: null,
            orderType: 'TAKEAWAY',
            tableNumber: null,

            setOrderType: (orderType) => set({ orderType }),
            setTableNumber: (tableNumber) => set({ tableNumber }),
            setOrders: (orders) => set({ orders }),
            setIsQRScannerOpen: (isQRScannerOpen) => set({ isQRScannerOpen }),
            setQrScannedOrder: (qrScannedOrder) => set({ qrScannedOrder }),

            fetchTenantOrders: async (tenantId, page = 1) => {
                set({ isLoading: true });
                const res = await getTenantOrders(tenantId, page, 200); 
                if (res.success && res.data) {
                    set({ orders: res.data.data || [] });
                }
                set({ isLoading: false });
            },

            fetchCustomerOrders: async (tenantId, mobile) => {
                set({ isLoading: true });
                const res = await getCustomerOrders(tenantId, mobile);
                if (res.success && res.data) {
                    const incoming = res.data as Order[];
                    set(state => {
                        const merged = [...state.orders];
                        incoming.forEach(newOrder => {
                            const idx = merged.findIndex(o => o.order_id === newOrder.order_id);
                            if (idx >= 0) merged[idx] = newOrder;
                            else merged.unshift(newOrder);
                        });
                        return { orders: merged.sort((a, b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime()) };
                    });
                }
                set({ isLoading: false });
            },

            updateOrderStatus: async (tenantId, orderId, status) => {
                const previousOrders = [...get().orders];
                set({
                    orders: get().orders.map(o => o.order_id === orderId ? { ...o, order_status: status } : o)
                });

                const result = await updateOrderStatusServer(orderId, status, tenantId);
                if (!result.success) {
                    set({ orders: previousOrders });
                    toast.error("Failed to update status");
                }
            },

            broadcastQRScan: (tenantId, isAdmin, order) => {
                if (!isAdmin) return;
                supabase.channel(`tenant_orders_${tenantId}`).send({
                    type: 'broadcast',
                    event: 'qr_scanned',
                    payload: { order, isInternal: true, sourceTenantId: tenantId }
                });
            },

            placeOrder: async (tenant, sessionId, customerData, cart, appliedPromo, explicitOrderType, explicitTableNumber) => {
                if (!tenant) return null;
                
                const storeState = get();
                const finalOrderType = explicitOrderType || storeState.orderType;
                const finalTableNumber = explicitTableNumber !== undefined ? explicitTableNumber : storeState.tableNumber;

                const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity) + (item.customizations || []).reduce((cSum, c) => cSum + (c.price || 0) * item.quantity, 0), 0);
                const discountAmount = appliedPromo ? (appliedPromo.discount_type === 'percentage' ? Math.round((subtotal * appliedPromo.discount_value) / 100) : appliedPromo.discount_value) : 0;
                const totalAmount = subtotal - discountAmount;

                const result = await createCloudOrder(
                    tenant.id, 
                    customerData.name, 
                    customerData.mobile, 
                    cart, 
                    totalAmount,
                    undefined, // rzp
                    undefined,
                    undefined,
                    finalOrderType,
                    finalTableNumber || undefined
                );
                
                if (!result.success || !result.data) {
                    toast.error(result.error || 'Failed to place order');
                    return null;
                }

                const orderData = result.data;
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
                    estimated_ready_time: new Date(Date.now() + 15 * 60000).toISOString(),
                    order_status: 'received',
                    order_time: new Date().toISOString(),
                };

                set({ orders: [newOrder, ...get().orders] });
                return newOrder;
            },

            setupRealtime: (tenantId, isAdmin, pathname) => {
                const { cleanupRealtime } = get();
                cleanupRealtime();

                const channel = supabase
                    .channel(`tenant_orders_${tenantId}`)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'orders',
                        filter: `tenant_id=eq.${tenantId}`
                    }, async (payload) => {
                        if (payload.eventType === 'INSERT') {
                            setTimeout(async () => {
                                const res = isAdmin
                                    ? await getAdminOrderById(payload.new.id, tenantId)
                                    : await getAuthenticatedOrder(payload.new.id, tenantId);

                                if (res?.success && res.data) {
                                    const newOrder = res.data as Order;
                                    set(state => {
                                        if (state.orders.find(o => o.order_id === newOrder.order_id)) return state;
                                        if (newOrder.order_status === 'received' && isAdmin && pathname?.includes('/admin')) {
                                            playNotificationChime();
                                            toast.success(`New order #${newOrder.short_id}`, { icon: '🔔' });
                                        }
                                        return { orders: [newOrder, ...state.orders] };
                                    });
                                }
                            }, 500);
                        } else if (payload.eventType === 'UPDATE') {
                            const upOrder = payload.new;
                            const isOurOrder = get().orders.some(o => o.order_id === upOrder.id);

                            if (isOurOrder || isAdmin) {
                                if (upOrder.status === 'ready') {
                                    if (isAdmin) {
                                        // Only notify staff for Dine-In orders that need serving
                                        if (upOrder.order_type === 'DINE_IN') {
                                            playNotificationChime();
                                            toast.success(`Order #${upOrder.short_id || upOrder.id.slice(0, 6)} is ready to serve! 🧑‍🍳`, { icon: '✅' });
                                        }
                                    } else {
                                        // Customers always get notified
                                        playUserReadyChime();
                                        triggerReadyVibration();
                                        toast.success(`Your order is ready! 🥡`, {
                                            duration: 10000,
                                            id: 'order-ready-alert',
                                            icon: '🔔'
                                        });
                                    }
                                } else if (!isAdmin && isOurOrder) {
                                    triggerStatusVibration();
                                }
                            }

                            set(state => {
                                const currentOrder = state.orders.find(o => o.order_id === upOrder.id);
                                if (!currentOrder) return state;

                                const statusWeights: Record<string, number> = {
                                    'received': 0,
                                    'preparing': 1,
                                    'ready': 2,
                                    'completed': 3,
                                    'cancelled': -1
                                };

                                const shouldUpdateStatus = 
                                    statusWeights[upOrder.status] > statusWeights[currentOrder.order_status] ||
                                    upOrder.status === 'cancelled';

                                return {
                                    lastCompletedOrderId: (!isAdmin && upOrder.status === 'completed') ? upOrder.id : state.lastCompletedOrderId,
                                    orders: state.orders.map(o => o.order_id === upOrder.id ? {
                                        ...o,
                                        order_status: shouldUpdateStatus ? upOrder.status : o.order_status,
                                        payment_status: upOrder.payment_status || o.payment_status,
                                        table_number: upOrder.table_number || o.table_number,
                                        session_id: upOrder.session_id || o.session_id
                                    } : o)
                                };
                            });
                            if (upOrder.status === 'completed' && get().qrScannedOrder?.order_id === upOrder.id) {
                                set({ isQRScannerOpen: false, qrScannedOrder: null });
                            }
                        } else if (payload.eventType === 'DELETE') {
                            set(state => ({ orders: state.orders.filter(o => o.order_id !== payload.old.id) }));
                        }
                    })
                    .on('broadcast', { event: 'qr_scanned' }, (payload) => {
                        const { order, isInternal, sourceTenantId } = payload.payload;
                        if (isAdmin && order && isInternal && sourceTenantId === tenantId) {
                            playNotificationChime();
                            set({ qrScannedOrder: order, isQRScannerOpen: true });
                        }
                    });

                channel.subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        set({ isPollingFallback: false });
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        set({ isPollingFallback: true });
                    }
                });

                set({ realtimeChannel: channel });
            },

            cleanupRealtime: () => {
                const { realtimeChannel } = get();
                if (realtimeChannel) {
                    supabase.removeChannel(realtimeChannel);
                    set({ realtimeChannel: null });
                }
            }
        }),
        {
            name: 'order-storage',
            partialize: (state) => ({ 
                orderType: state.orderType, 
                tableNumber: state.tableNumber 
            }),
        }
    )
);
