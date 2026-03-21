'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { PromoCode, TenantConfig } from '@/types';
import { getTenantData, updateTenantConfig } from '@/app/actions/tenant';
import { toast } from 'react-hot-toast';

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
    const [tenant, setTenant] = useState<TenantData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [isStoreOpen, setIsStoreOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [customer, setCustomer] = useState<{ name: string; mobile: string } | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [openingTime, setOpeningTimeState] = useState('10:00');
    const [closingTime, setClosingTimeState] = useState('22:00');

    useEffect(() => {
        const savedName = localStorage.getItem('customerName');
        const savedMobile = localStorage.getItem('customerMobile');
        if (savedName && savedMobile) {
            setCustomer({ name: savedName, mobile: savedMobile });
        }

        let sId = localStorage.getItem('sessionId');
        if (!sId) {
            sId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            localStorage.setItem('sessionId', sId);
        }
        setSessionId(sId);
    }, []);

    const updateCustomer = (name: string, mobile: string) => {
        localStorage.setItem('customerName', name);
        localStorage.setItem('customerMobile', mobile);
        setCustomer({ name, mobile });
    };

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
        }
    }, []);

    const toggleStoreStatus = async () => {
        if (!tenant) return;
        const newStatus = !isStoreOpen;
        setIsStoreOpen(newStatus);
        const newConfig = { ...tenant.config, isStoreOpen: newStatus };
        const result = await updateTenantConfig(tenant.id, tenant.slug, newConfig);
        if (result.success) {
            setTenant({ ...tenant, config: newConfig });
        } else {
            toast.error('Failed to update store status');
            setIsStoreOpen(!newStatus);
        }
    };

    const setOpeningTime = async (time: string) => {
        if (!tenant) return;
        const previousTime = openingTime;
        setOpeningTimeState(time);
        
        const newConfig = { ...tenant.config, openingTime: time };
        const result = await updateTenantConfig(tenant.id, tenant.slug, newConfig);
        if (result.success) {
            setTenant({ ...tenant, config: newConfig });
        } else {
            setOpeningTimeState(previousTime);
            toast.error('Failed to update opening time');
        }
    };

    const setClosingTime = async (time: string) => {
        if (!tenant) return;
        const previousTime = closingTime;
        setClosingTimeState(time);
        
        const newConfig = { ...tenant.config, closingTime: time };
        const result = await updateTenantConfig(tenant.id, tenant.slug, newConfig);
        if (result.success) {
            setTenant({ ...tenant, config: newConfig });
        } else {
            setClosingTimeState(previousTime);
            toast.error('Failed to update closing time');
        }
    };

    return (
        <StoreContext.Provider value={{
            tenant,
            isStoreOpen,
            customer,
            updateCustomer,
            toggleStoreStatus,
            openingTime,
            closingTime,
            setOpeningTime,
            setClosingTime,
            fetchStoreData,
            isLoading,
            isInitialLoading,
            isAdmin,
            setIsAdmin,
            sessionId
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within a StoreProvider');
    return context;
};
