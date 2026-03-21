'use client';

import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import type { MenuItem, Category, Customer } from '@/types';
import { useStore } from '@/context/StoreContext';
import { useAdminStore } from '@/store/useAdminStore';

interface AdminContextType {
    menuItems: MenuItem[];
    categories: Category[];
    customers: Customer[];
    isAdmin: boolean;
    setIsAdmin: (isAdmin: boolean) => void;
    addMenuItem: (item: MenuItem) => Promise<boolean>;
    updateMenuItem: (item: MenuItem) => Promise<boolean>;
    deleteMenuItem: (itemId: string) => Promise<boolean>;
    upsertCategory: (category: Partial<Category>) => Promise<boolean>;
    deleteCategory: (categoryId: string) => Promise<boolean>;
    fetchAdminData: () => Promise<void>;
    isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
    const { tenant, isAdmin, setIsAdmin } = useStore();
    
    // 1. Stable actions from Zustand
    const fetchAdminDataStore = useAdminStore(s => s.fetchAdminData);
    const addMenuItemStore = useAdminStore(s => s.addMenuItem);
    const updateMenuItemStore = useAdminStore(s => s.updateMenuItem);
    const deleteMenuItemStore = useAdminStore(s => s.deleteMenuItem);
    const upsertCategoryStore = useAdminStore(s => s.upsertCategory);
    const deleteCategoryStore = useAdminStore(s => s.deleteCategory);

    // 2. Selective state from Zustand
    const menuItems = useAdminStore(s => s.menuItems);
    const categories = useAdminStore(s => s.categories);
    const customers = useAdminStore(s => s.customers);
    const isLoading = useAdminStore(s => s.isLoading);

    // 3. Memoized Bridge Actions
    const fetchAdminData = useCallback(async () => {
        if (tenant) {
            await fetchAdminDataStore(tenant.id, tenant.slug);
        }
    }, [tenant?.id, tenant?.slug, fetchAdminDataStore]);

    const addMenuItem = useCallback(async (item: MenuItem) => {
        if (!tenant) return false;
        return await addMenuItemStore(tenant.id, tenant.slug, item);
    }, [tenant?.id, tenant?.slug, addMenuItemStore]);

    const updateMenuItem = useCallback(async (item: MenuItem) => {
        if (!tenant) return false;
        return await updateMenuItemStore(tenant.id, tenant.slug, item);
    }, [tenant?.id, tenant?.slug, updateMenuItemStore]);

    const deleteMenuItem = useCallback(async (itemId: string) => {
        if (!tenant) return false;
        return await deleteMenuItemStore(tenant.id, tenant.slug, itemId);
    }, [tenant?.id, tenant?.slug, deleteMenuItemStore]);

    const upsertCategory = useCallback(async (category: Partial<Category>) => {
        if (!tenant) return false;
        return await upsertCategoryStore(tenant.id, tenant.slug, category);
    }, [tenant?.id, tenant?.slug, upsertCategoryStore]);

    const deleteCategory = useCallback(async (categoryId: string) => {
        if (!tenant) return false;
        return await deleteCategoryStore(tenant.id, tenant.slug, categoryId);
    }, [tenant?.id, tenant?.slug, deleteCategoryStore]);

    // 4. Effects
    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    const value = useMemo(() => ({
        menuItems,
        categories,
        customers,
        isLoading,
        isAdmin,
        setIsAdmin,
        fetchAdminData,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        upsertCategory,
        deleteCategory
    }), [
        menuItems, categories, customers, isLoading, isAdmin, setIsAdmin, 
        fetchAdminData, addMenuItem, updateMenuItem, deleteMenuItem, 
        upsertCategory, deleteCategory
    ]);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) throw new Error('useAdmin error');
    return context;
};
