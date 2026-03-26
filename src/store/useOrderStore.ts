import { create } from 'zustand';
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

    // Actions
    setOrders: (orders: Order[]) => void;
    setIsQRScannerOpen: (isOpen: boolean) => void;
    setQrScannedOrder: (order: Order | null) => void;
    
    fetchTenantOrders: (tenantId: string) => Promise<void>;
    fetchCustomerOrders: (tenantId: string, mobile: string) => Promise<void>;
    updateOrderStatus: (tenantId: string, orderId: string, status: OrderStatus) => Promise<void>;
    broadcastQRScan: (tenantId: string, isAdmin: boolean, order: Order) => void;
    
    placeOrder: (tenant: any, sessionId: string, customerData: { name: string; mobile: string; note?: string }, cart: CartItem[], appliedPromo: PromoCode | null) => Promise<Order | null>;
    
    setupRealtime: (tenantId: string, isAdmin: boolean, pathname?: string) => void;
    cleanupRealtime: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
    orders: [],
    qrScannedOrder: null,
    isQRScannerOpen: false,
    realtimeChannel: null,
    isLoading: false,
    isPollingFallback: false,
    lastCompletedOrderId: null,

    setOrders: (orders) => set({ orders }),
    setIsQRScannerOpen: (isQRScannerOpen) => set({ isQRScannerOpen }),
    setQrScannedOrder: (qrScannedOrder) => set({ qrScannedOrder }),

    fetchTenantOrders: async (tenantId) => {
        set({ isLoading: true });
        const res = await getTenantOrders(tenantId);
        if (res.success) {
            set({ orders: res.data || [] });
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

    placeOrder: async (tenant, sessionId, customerData, cart, appliedPromo) => {
        if (!tenant) return null;
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity) + (item.customizations || []).reduce((cSum, c) => cSum + (c.price || 0) * item.quantity, 0), 0);
        const discountAmount = appliedPromo ? (appliedPromo.discount_type === 'percentage' ? Math.round((subtotal * appliedPromo.discount_value) / 100) : appliedPromo.discount_value) : 0;
        const totalAmount = subtotal - discountAmount;

        const result = await createCloudOrder(tenant.id, customerData.name, customerData.mobile, cart, totalAmount);
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
                    // Delay slightly to allow DB to propagate
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
                    
                    if (isOurOrder) {
                        // NEW: Virtual Pager Alerts for Customers (Scoped)
                        if (!isAdmin && upOrder.status === 'ready') {
                            // Play the special customer-ready chime
                            playUserReadyChime();
                            // Trigger high-intensity triple pulse (Android)
                            triggerReadyVibration();
                            
                            toast.success(`Your order is ready! 🥡`, { 
                                duration: 10000,
                                id: 'order-ready-alert',
                                icon: '🔔'
                            });
                        } else if (!isAdmin) {
                            // Soft pulse for any other status update (Preparing, etc)
                            triggerStatusVibration();
                        }
                    }

                    set(state => ({
                        lastCompletedOrderId: (!isAdmin && upOrder.status === 'completed') ? upOrder.id : state.lastCompletedOrderId,
                        orders: state.orders.map(o => o.order_id === upOrder.id ? { ...o, order_status: upOrder.status } : o)
                    }));
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
}));
