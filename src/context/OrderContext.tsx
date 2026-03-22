'use client';

import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import type { Order, OrderStatus } from '@/types';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { useOrderStore } from '@/store/useOrderStore';
import { usePathname } from 'next/navigation';

interface OrderContextType {
    orders: Order[];
    placeOrder: (customerData: { name: string; mobile: string; note?: string }) => Promise<Order | null>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    fetchCustomerOrders: (tenantId: string, mobile: string) => Promise<void>;
    refreshOrders: () => Promise<void>;
    isQRScannerOpen: boolean;
    setIsQRScannerOpen: (isOpen: boolean) => void;
    qrScannedOrder: Order | null;
    setQrScannedOrder: (order: Order | null) => void;
    broadcastQRScan: (order: Order) => void;
    lastCompletedOrderId: string | null;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
    const { tenant, isAdmin, customer, sessionId } = useStore();
    const { cart, appliedPromo } = useCart();
    const pathname = usePathname();

    // 1. Stable actions from Zustand
    const setupRealtimeStore = useOrderStore(s => s.setupRealtime);
    const cleanupRealtimeStore = useOrderStore(s => s.cleanupRealtime);
    const fetchTenantOrdersStore = useOrderStore(s => s.fetchTenantOrders);
    const fetchCustomerOrdersStore = useOrderStore(s => s.fetchCustomerOrders);
    const updateOrderStatusStore = useOrderStore(s => s.updateOrderStatus);
    const broadcastQRScanStore = useOrderStore(s => s.broadcastQRScan);
    const placeOrderStore = useOrderStore(s => s.placeOrder);
    const setIsQRScannerOpenStore = useOrderStore(s => s.setIsQRScannerOpen);
    const setQrScannedOrderStore = useOrderStore(s => s.setQrScannedOrder);

    // 2. Selective state from Zustand
    const orders = useOrderStore(s => s.orders);
    const qrScannedOrder = useOrderStore(s => s.qrScannedOrder);
    const isQRScannerOpen = useOrderStore(s => s.isQRScannerOpen);
    const isPollingFallback = useOrderStore(s => s.isPollingFallback);
    const lastCompletedOrderId = useOrderStore(s => s.lastCompletedOrderId);

    // 3. Memoized Bridge Actions (The "Senior" Resilience Fix)
    const fetchCustomerOrders = useCallback(async (tid: string, mobile: string) => {
        await fetchCustomerOrdersStore(tid, mobile);
    }, [fetchCustomerOrdersStore]);

    const refreshOrders = useCallback(async () => {
        if (tenant) await fetchTenantOrdersStore(tenant.id);
    }, [tenant?.id, fetchTenantOrdersStore]);

    const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
        if (tenant) await updateOrderStatusStore(tenant.id, id, status);
    }, [tenant?.id, updateOrderStatusStore]);

    const broadcastQRScan = useCallback((order: Order) => {
        if (tenant) broadcastQRScanStore(tenant.id, isAdmin, order);
    }, [tenant?.id, isAdmin, broadcastQRScanStore]);

    const placeOrder = useCallback(async (customerData: { name: string; mobile: string; note?: string }) => {
        return await placeOrderStore(tenant, sessionId || '', customerData, cart, appliedPromo);
    }, [tenant, sessionId, cart, appliedPromo, placeOrderStore]);

    // 4. Effects
    useEffect(() => {
        if (tenant) {
            setupRealtimeStore(tenant.id, isAdmin, pathname);
        }
        return () => cleanupRealtimeStore();
    }, [tenant?.id, isAdmin, pathname, setupRealtimeStore, cleanupRealtimeStore]);

    useEffect(() => {
        if (tenant && isAdmin) {
            fetchTenantOrdersStore(tenant.id);
        }
    }, [tenant?.id, isAdmin, fetchTenantOrdersStore]);

    useEffect(() => {
        if (!isPollingFallback || !tenant) return;
        const interval = setInterval(() => {
            if (isAdmin) {
                fetchTenantOrdersStore(tenant.id);
            } else if (customer?.mobile) {
                fetchCustomerOrdersStore(tenant.id, customer.mobile);
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [isPollingFallback, tenant?.id, isAdmin, customer?.mobile, fetchTenantOrdersStore, fetchCustomerOrdersStore]);

    const value = useMemo(() => ({
        orders,
        qrScannedOrder,
        isQRScannerOpen,
        setIsQRScannerOpen: setIsQRScannerOpenStore,
        setQrScannedOrder: setQrScannedOrderStore,
        placeOrder,
        updateOrderStatus,
        fetchCustomerOrders,
        refreshOrders,
        broadcastQRScan,
        lastCompletedOrderId
    }), [
        orders, qrScannedOrder, isQRScannerOpen, setIsQRScannerOpenStore, 
        setQrScannedOrderStore, placeOrder, updateOrderStatus, 
        fetchCustomerOrders, refreshOrders, broadcastQRScan, lastCompletedOrderId
    ]);

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
};

export const useOrders = () => {
    const context = useContext(OrderContext);
    if (!context) throw new Error('useOrders must be used within OrderProvider');
    return context;
};
