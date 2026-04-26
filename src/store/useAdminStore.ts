import { create } from 'zustand';
import type { MenuItem, Category, Customer } from '@/types';
import { 
    getTenantMenu, 
    upsertMenuItem, 
    deleteMenuItemServer, 
    getTenantCategories,
    upsertCategory as upsertCategoryServer,
    deleteCategory as deleteCategoryServer
} from '@/app/actions/tenant';
import { getTenantCustomers } from '@/app/actions/orders';
import { toast } from 'react-hot-toast';

interface AdminState {
    menuItems: MenuItem[];
    categories: Category[];
    customers: Customer[];
    isLoading: boolean;

    // Actions
    fetchAdminData: (tenantId: string, tenantSlug: string, includeCustomers?: boolean) => Promise<void>;
    addMenuItem: (tenantId: string, tenantSlug: string, item: MenuItem) => Promise<boolean>;
    updateMenuItem: (tenantId: string, tenantSlug: string, item: MenuItem) => Promise<boolean>;
    deleteMenuItem: (tenantId: string, tenantSlug: string, itemId: string) => Promise<boolean>;
    upsertCategory: (tenantId: string, tenantSlug: string, category: Partial<Category>) => Promise<boolean>;
    deleteCategory: (tenantId: string, tenantSlug: string, categoryId: string) => Promise<boolean>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
    menuItems: [],
    categories: [],
    customers: [],
    isLoading: false,

    fetchAdminData: async (tenantId, tenantSlug, includeCustomers = false) => {
        set({ isLoading: true });
        try {
            const [menuRes, categoriesRes] = await Promise.all([
                getTenantMenu(tenantId, tenantSlug),
                getTenantCategories(tenantId)
            ]);

            if (menuRes.success) set({ menuItems: menuRes.data || [] });
            if (categoriesRes.success) set({ categories: categoriesRes.data || [] });

            // Background fetch for customers - only if authorized
            if (includeCustomers) {
                getTenantCustomers(tenantId).then(res => {
                    if (res.success) set({ customers: res.data || [] });
                });
            }
        } finally {
            set({ isLoading: false });
        }
    },

    addMenuItem: async (tenantId, tenantSlug, item) => {
        const previous = [...get().menuItems];
        const tempId = 'temp-' + Date.now();
        set({ menuItems: [...get().menuItems, { ...item, id: tempId }] });

        const res = await upsertMenuItem(tenantId, tenantSlug, item);
        if (res.success && res.data) {
            set({ menuItems: get().menuItems.map(i => i.id === tempId ? res.data as MenuItem : i) });
            toast.success("Item added");
            return true;
        } else {
            set({ menuItems: previous });
            toast.error("Failed to add item");
            return false;
        }
    },

    updateMenuItem: async (tenantId, tenantSlug, item) => {
        const previous = [...get().menuItems];
        set({ menuItems: get().menuItems.map(i => i.id === item.id ? item : i) });

        const res = await upsertMenuItem(tenantId, tenantSlug, item);
        if (res.success && res.data) {
            set({ menuItems: get().menuItems.map(i => i.id === item.id ? res.data as MenuItem : i) });
            toast.success("Item updated");
            return true;
        } else {
            set({ menuItems: previous });
            toast.error("Failed to update item");
            return false;
        }
    },

    deleteMenuItem: async (tenantId, tenantSlug, itemId) => {
        const previous = [...get().menuItems];
        set({ menuItems: get().menuItems.filter(i => i.id !== itemId) });

        const res = await deleteMenuItemServer(tenantId, tenantSlug, itemId);
        if (res.success) {
            toast.success("Item deleted");
            return true;
        } else {
            set({ menuItems: previous });
            toast.error("Failed to delete item");
            return false;
        }
    },

    upsertCategory: async (tenantId, tenantSlug, category) => {
        const previous = [...get().categories];
        const isNew = !category.id;
        const tempId = category.id || 'temp-' + Date.now();
        
        if (isNew) {
            set({ categories: [...get().categories, { ...category, id: tempId } as Category] });
        } else {
            set({ categories: get().categories.map(c => c.id === category.id ? { ...c, ...category } as Category : c) });
        }

        const res = await upsertCategoryServer(tenantId, tenantSlug, category);
        if (res.success) {
            const finalData = res.data || category;
            set({ categories: get().categories.map(c => c.id === tempId ? finalData as Category : c) });
            toast.success(isNew ? "Category created" : "Category updated");
            return true;
        } else {
            set({ categories: previous });
            toast.error(res.error || "Failed to save category");
            return false;
        }
    },

    deleteCategory: async (tenantId, tenantSlug, categoryId) => {
        const previous = [...get().categories];
        set({ categories: get().categories.filter(c => c.id !== categoryId) });

        const res = await deleteCategoryServer(tenantId, tenantSlug, categoryId);
        if (res.success) return true;
        set({ categories: previous });
        return false;
    }
}));
