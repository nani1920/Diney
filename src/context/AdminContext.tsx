'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { MenuItem, Customer, Category } from '@/types';
import { 
    getTenantMenu, 
    upsertMenuItem, 
    deleteMenuItemServer, 
    getTenantCategories,
    upsertCategory as upsertCategoryServer,
    deleteCategory as deleteCategoryServer
} from '@/app/actions/tenant';
import { getTenantCustomers } from '@/app/actions/orders';
import { useStore } from '@/context/StoreContext';
import { toast } from 'react-hot-toast';

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
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAdminData = useCallback(async () => {
        if (!tenant) return;
        setIsLoading(true);
        try {
            const [menuRes, categoriesRes, customersRes] = await Promise.all([
                getTenantMenu(tenant.id, tenant.slug),
                getTenantCategories(tenant.id),
                getTenantCustomers(tenant.id)
            ]);

            if (menuRes.success) setMenuItems(menuRes.data || []);
            if (categoriesRes.success) setCategories(categoriesRes.data || []);
            if (customersRes.success) {
                setCustomers(customersRes.data || []);
                setIsAdmin(true);
            }
        } finally {
            setIsLoading(false);
        }
    }, [tenant, setIsAdmin]);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    const addMenuItem = async (item: MenuItem) => {
        if (!tenant) return false;
        
        const previousMenu = [...menuItems];
        const optimisticId = item.id || 'temp-' + Date.now();
        const optimisticItem = { ...item, id: optimisticId };
        
        setMenuItems((prev) => [...prev, optimisticItem]);
        
        try {
            const result = await upsertMenuItem(tenant.id, tenant.slug, item);
            if (result.success && result.data) {
                const itemData = result.data as MenuItem & { is_available?: boolean };
                const mappedItem: MenuItem = {
                    ...itemData,
                    availability_status: itemData.is_available ?? itemData.availability_status
                };
                setMenuItems((prev) => 
                    prev.map(i => i.id === optimisticId ? mappedItem : i)
                );
                toast.success('Item added successfully');
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            setMenuItems(previousMenu);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Failed to add item: ' + message);
            return false;
        }
    };

    const updateMenuItem = async (item: MenuItem) => {
        if (!tenant) return false;
        
        const previousMenu = [...menuItems];
        setMenuItems((prev) => prev.map((i) => (i.id === item.id ? { ...item } : i)));
        
        try {
            const result = await upsertMenuItem(tenant.id, tenant.slug, item);
            if (result.success && result.data) {
                const itemData = result.data as MenuItem & { is_available?: boolean };
                const mappedItem: MenuItem = {
                    ...itemData,
                    availability_status: itemData.is_available ?? itemData.availability_status
                };
                setMenuItems((prev) => prev.map((i) => (i.id === item.id ? mappedItem : i)));
                toast.success('Item updated successfully');
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            setMenuItems(previousMenu);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Failed to update item: ' + message);
            return false;
        }
    };

    const deleteMenuItem = async (itemId: string) => {
        if (!tenant) return false;
        
        const previousMenu = [...menuItems];
        setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
        
        try {
            const result = await deleteMenuItemServer(tenant.id, tenant.slug, itemId);
            if (result.success) {
                toast.success('Item deleted successfully');
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            setMenuItems(previousMenu);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Failed to delete item: ' + message);
            return false;
        }
    };

    const upsertCategory = async (category: Partial<Category>) => {
        if (!tenant) return false;
        
        const previousCategories = [...categories];
        const isNew = !category.id;
        const optimisticId = category.id || 'temp-' + Date.now();
        const optimisticCategory = { ...category, id: optimisticId } as Category;
        
        if (isNew) {
            setCategories((prev) => [...prev, optimisticCategory]);
        } else {
            setCategories((prev) => prev.map(c => c.id === category.id ? optimisticCategory : c));
        }
        
        try {
            const result = await upsertCategoryServer(tenant.id, tenant.slug, category);
            if (result.success) {
                if (isNew && result.data) {
                    setCategories((prev) => 
                        prev.map(c => c.id === optimisticId ? result.data as Category : c)
                    );
                }
                toast.success(isNew ? 'Category created' : 'Category updated');
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            setCategories(previousCategories);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Failed to save category: ' + message);
            return false;
        }
    };

    const deleteCategory = async (categoryId: string) => {
        if (!tenant) return false;
        
        const previousCategories = [...categories];
        setCategories((prev) => prev.filter(c => c.id !== categoryId));
        
        try {
            const result = await deleteCategoryServer(tenant.id, tenant.slug, categoryId);
            if (result.success) {
                toast.success('Category deleted');
                return true;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            setCategories(previousCategories);
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Failed to delete category: ' + message);
            return false;
        }
    };

    return (
        <AdminContext.Provider value={{
            menuItems,
            categories,
            customers,
            isAdmin,
            setIsAdmin,
            addMenuItem,
            updateMenuItem,
            deleteMenuItem,
            upsertCategory,
            deleteCategory,
            fetchAdminData,
            isLoading
        }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) throw new Error('useAdmin must be used within an AdminProvider');
    return context;
};
