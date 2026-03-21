import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TenantData } from '@/context/StoreContext';
import { getTenantData } from '@/app/actions/tenant';

interface StoreState {
    tenant: TenantData | null;
    customer: { name: string; mobile: string } | null;
    sessionId: string | null;
    isStoreOpen: boolean;
    isInitialLoading: boolean;
    isAdmin: boolean;

    // Actions
    setTenant: (tenant: TenantData | null) => void;
    setCustomer: (name: string, mobile: string) => void;
    setSessionId: (id: string) => void;
    setIsStoreOpen: (isOpen: boolean) => void;
    setIsAdmin: (isAdmin: boolean) => void;
    initializeSession: () => void;
    fetchStoreData: (slug: string) => Promise<void>;
}

export const useStoreStore = create<StoreState>()(
    persist(
        (set, get) => ({
            tenant: null,
            customer: null,
            sessionId: null,
            isStoreOpen: true,
            isInitialLoading: true,
            isAdmin: false,

            setTenant: (tenant) => set({ tenant }),
            setCustomer: (name, mobile) => {
                set({ customer: { name, mobile } });
            },
            setSessionId: (sessionId) => set({ sessionId }),
            setIsStoreOpen: (isStoreOpen) => set({ isStoreOpen }),
            setIsAdmin: (isAdmin) => set({ isAdmin }),

            initializeSession: () => {
                if (get().sessionId) return;
                const sId = typeof crypto !== 'undefined' && crypto.randomUUID 
                    ? crypto.randomUUID() 
                    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                        const r = Math.random() * 16 | 0;
                        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                    });
                set({ sessionId: sId });
            },

            fetchStoreData: async (slug: string) => {
                set({ isInitialLoading: true });
                try {
                    const res = await getTenantData(slug);
                    if (res.success && res.data) {
                        const tenantData = res.data;
                        set({ 
                            tenant: tenantData,
                            isStoreOpen: tenantData.config?.isStoreOpen ?? true
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch store data:", error);
                } finally {
                    set({ isInitialLoading: false });
                }
            },
        }),
        {
            name: 'diney-store-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                customer: state.customer, 
                sessionId: state.sessionId 
            }),
        }
    )
);
