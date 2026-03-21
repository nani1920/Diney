'use client';

import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import type { TenantConfig } from '@/types';
import { updateTenantConfig } from '@/app/actions/tenant';
import { toast } from 'react-hot-toast';
import { useStoreStore } from '@/store/useStoreStore';
import { usePathname } from 'next/navigation';

export interface TenantData {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    config?: TenantConfig;
    is_active?: boolean;
    tier?: string;
    subscription_status?: string;
}

interface StoreContextType {
    tenant: TenantData | null;
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
    isAdmin: boolean;
    setIsAdmin: (isAdmin: boolean) => void;
    sessionId: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    // 1. Get stable actions from Zustand
    const fetchStoreDataStore = useStoreStore(s => s.fetchStoreData);
    const initializeSession = useStoreStore(s => s.initializeSession);
    const setCustomer = useStoreStore(s => s.setCustomer);
    const setIsStoreOpen = useStoreStore(s => s.setIsStoreOpen);
    const setIsAdmin = useStoreStore(s => s.setIsAdmin);
    const setTenant = useStoreStore(s => s.setTenant);

    // 2. Get selective state from Zustand
    const tenant = useStoreStore(s => s.tenant);
    const customer = useStoreStore(s => s.customer);
    const isStoreOpen = useStoreStore(s => s.isStoreOpen);
    const isInitialLoading = useStoreStore(s => s.isInitialLoading);
    const isAdmin = useStoreStore(s => s.isAdmin);
    const sessionId = useStoreStore(s => s.sessionId);

    // 3. Memoized Bridge Actions
    const fetchStoreData = useCallback(async (slug: string) => {
        await fetchStoreDataStore(slug);
    }, [fetchStoreDataStore]);

    const updateCustomer = useCallback((name: string, mobile: string) => {
        setCustomer(name, mobile);
    }, [setCustomer]);

    const toggleStoreStatus = useCallback(async () => {
        if (!tenant) return;
        const newStatus = !isStoreOpen;
        setIsStoreOpen(newStatus);
        const newConfig = { ...tenant.config, isStoreOpen: newStatus };
        const result = await updateTenantConfig(tenant.id, tenant.slug, newConfig);
        if (result.success) {
            setTenant({ ...tenant, config: newConfig });
        } else {
            toast.error('Failed to update status');
            setIsStoreOpen(!newStatus);
        }
    }, [tenant, isStoreOpen, setIsStoreOpen, setTenant]);

    const setOpeningTime = useCallback(async (time: string) => {
        if (!tenant) return;
        const newConfig = { ...tenant.config, openingTime: time };
        const result = await updateTenantConfig(tenant.id, tenant.slug, newConfig);
        if (result.success) setTenant({ ...tenant, config: newConfig });
    }, [tenant, setTenant]);

    const setClosingTime = useCallback(async (time: string) => {
        if (!tenant) return;
        const newConfig = { ...tenant.config, closingTime: time };
        const result = await updateTenantConfig(tenant.id, tenant.slug, newConfig);
        if (result.success) setTenant({ ...tenant, config: newConfig });
    }, [tenant, setTenant]);

    // 4. Effects
    const store = useStoreStore();
    const pathname = usePathname();

    useEffect(() => {
        store.initializeSession();
    }, [store]);

    useEffect(() => {
        const isCurrentlyAdmin = pathname.includes('/admin');
        if (store.isAdmin !== isCurrentlyAdmin) {
            store.setIsAdmin(isCurrentlyAdmin);
        }
    }, [pathname, store]);

    const value = useMemo(() => ({
        tenant,
        customer,
        isStoreOpen,
        isInitialLoading,
        isLoading: isInitialLoading,
        isAdmin,
        sessionId,
        setIsAdmin,
        updateCustomer,
        fetchStoreData,
        toggleStoreStatus,
        openingTime: tenant?.config?.openingTime || '10:00',
        closingTime: tenant?.config?.closingTime || '22:00',
        setOpeningTime,
        setClosingTime
    }), [
        tenant, customer, isStoreOpen, isInitialLoading, isAdmin, sessionId, 
        setIsAdmin, updateCustomer, fetchStoreData, toggleStoreStatus,
        setOpeningTime, setClosingTime
    ]);

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore error');
    return context;
};
