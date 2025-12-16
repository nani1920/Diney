'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { MenuItem, Order, Customer, CartItem, PromoCode } from '@/types';

// Promo Codes
const PROMO_CODES: PromoCode[] = [
    {
        code: 'GFood',
        discount_type: 'percentage',
        discount_value: 10, // 10% off
        min_order_value: 200,
        is_active: true
    }
];

// Initial Seed Data with prep times
const INITIAL_MENU: MenuItem[] = [
    // Quick Snacks (5-8 mins)
    {
        id: '1',
        name: 'Veg Samosa',
        description: 'Crispy fried pastry with spiced potato filling',
        price: 20,
        veg_or_nonveg: 'veg',
        availability_status: true,
        prep_time_minutes: 5
    },
    {
        id: '2',
        name: 'Aloo Cutlet',
        description: 'Deep-fried spiced potato patty',
        price: 30,
        veg_or_nonveg: 'veg',
        availability_status: true,
        prep_time_minutes: 6
    },
    {
        id: '3',
        name: 'Bread Pakora',
        description: 'Bread stuffed with potato filling, battered & fried',
        price: 35,
        veg_or_nonveg: 'veg',
        availability_status: true,
        prep_time_minutes: 7
    },
    {
        id: '4',
        name: 'French Fries',
        description: 'Crispy salted potato fries',
        price: 60,
        veg_or_nonveg: 'veg',
        availability_status: true,
        prep_time_minutes: 8
    },
    // Street Food (10-12 mins)
    {
        id: '5',
        name: 'Veg Burger',
        description: 'Burger with veg patty, onion & sauce',
        price: 70,
        veg_or_nonveg: 'veg',
        availability_status: true,
        prep_time_minutes: 10
    },
    {
        id: '6',
        name: 'Chicken Burger',
        description: 'Crispy chicken patty with mayo',
        price: 90,
        veg_or_nonveg: 'non-veg',
        availability_status: true,
        prep_time_minutes: 12
    },
    {
        id: '7',
        name: 'Veg Momos (6 pcs)',
        description: 'Steamed dumplings with veg stuffing',
        price: 80,
        veg_or_nonveg: 'veg',
        availability_status: true,
        prep_time_minutes: 10
    },
    {
        id: '8',
        name: 'Chicken Momos (6 pcs)',
        description: 'Steamed dumplings with chicken stuffing',
        price: 100,
        veg_or_nonveg: 'non-veg',
        availability_status: true,
        prep_time_minutes: 12
    },
    // Indian Fast Food (12-15 mins)
    {
        id: '9',
        name: 'Pav Bhaji',
        description: 'Buttered pav with spicy vegetable curry',
        price: 90,
        veg_or_nonveg: 'veg',
        availability_status: true,
        prep_time_minutes: 12
    },
    {
        id: '10',
        name: 'Vada Pav',
        description: 'Spicy potato fritter in pav with chutneys',
        price: 30,
        veg_or_nonveg: 'veg',
        availability_status: true,
        prep_time_minutes: 8
    },
    {
        id: '11',
        name: 'Masala Dosa (Mini)',
        description: 'Crispy dosa with potato masala',
        price: 80,
        veg_or_nonveg: 'veg',
        availability_status: true,
        prep_time_minutes: 15
    },
    // Fried & Grilled (10-15 mins)
    {
        id: '12',
        name: 'Chicken Pakora',
        description: 'Deep-fried spicy chicken bites',
        price: 110,
        veg_or_nonveg: 'non-veg',
        availability_status: true,
        prep_time_minutes: 12
    },
    {
        id: '13',
        name: 'Chicken Nuggets (6 pcs)',
        description: 'Crispy fried nuggets',
        price: 120,
        veg_or_nonveg: 'non-veg',
        availability_status: true,
        prep_time_minutes: 10
    },
    // Add-ons & Drinks (2-5 mins)
    {
        id: '14',
        name: 'Cold Drink (Can)',
        description: 'Coke / Pepsi / Sprite',
        price: 40,
        veg_or_nonveg: 'veg',
        availability_status: true,
        prep_time_minutes: 2
    },
    {
        id: '15',
        name: 'Masala Chai',
        description: 'Traditional Indian spiced tea',
        price: 20,
        veg_or_nonveg: 'veg',
        availability_status: true,
        prep_time_minutes: 5
    },
    {
        id: '16',
        name: 'Lemon Soda',
        description: 'Refreshing lemon flavored soda',
        price: 30,
        veg_or_nonveg: 'veg',
        availability_status: true,
        prep_time_minutes: 3
    }
];

interface StoreContextType {
    menuItems: MenuItem[];
    orders: Order[];
    customers: Customer[];
    cart: CartItem[];
    promoCodes: PromoCode[];
    appliedPromo: PromoCode | null;
    addToCart: (item: MenuItem, customizations?: any[]) => void;
    updateCartQuantity: (itemId: string, delta: number) => void;
    clearCart: () => void;
    placeOrder: (customer: { name: string; mobile: string; note?: string }) => Order;
    updateOrderStatus: (orderId: string, status: Order['order_status']) => void;
    addMenuItem: (item: MenuItem) => void;
    updateMenuItem: (item: MenuItem) => void;
    deleteMenuItem: (itemId: string) => void;
    validatePromoCode: (code: string, cartTotal: number) => { valid: boolean; message: string; promo?: PromoCode };
    applyPromoCode: (promo: PromoCode | null) => void;
    isStoreOpen: boolean;
    toggleStoreStatus: () => void;
    openingTime: string;
    closingTime: string;
    setOpeningTime: (time: string) => void;
    setClosingTime: (time: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const [isStoreOpen, setIsStoreOpen] = useState(true);
    const [openingTime, setOpeningTimeState] = useState('10:00');
    const [closingTime, setClosingTimeState] = useState('22:00');




    // Load from LocalStorage
    useEffect(() => {
        const MENU_VERSION = '3'; // Increment when menu changes
        const savedVersion = localStorage.getItem('menuVersion');
        const savedMenu = localStorage.getItem('menuItems');
        const savedOrders = localStorage.getItem('orders');
        const savedCustomers = localStorage.getItem('customers');
        const savedStoreStatus = localStorage.getItem('isStoreOpen');
        const savedOpeningTime = localStorage.getItem('openingTime');
        const savedClosingTime = localStorage.getItem('closingTime');

        // Force update menu if version changed
        if (savedVersion !== MENU_VERSION) {
            setMenuItems(INITIAL_MENU);
            localStorage.setItem('menuVersion', MENU_VERSION);
        } else if (savedMenu) {
            setMenuItems(JSON.parse(savedMenu));
        } else {
            setMenuItems(INITIAL_MENU);
        }

        if (savedOrders) setOrders(JSON.parse(savedOrders));
        if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
        if (savedStoreStatus !== null) setIsStoreOpen(savedStoreStatus === 'true');
        if (savedOpeningTime) setOpeningTimeState(savedOpeningTime);
        if (savedClosingTime) setClosingTimeState(savedClosingTime);

        setIsInitialized(true);
    }, []);

    // Sync to LocalStorage
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('menuItems', JSON.stringify(menuItems));
            localStorage.setItem('orders', JSON.stringify(orders));
            localStorage.setItem('customers', JSON.stringify(customers));
            localStorage.setItem('isStoreOpen', String(isStoreOpen));
            localStorage.setItem('openingTime', openingTime);
            localStorage.setItem('closingTime', closingTime);
        }
    }, [menuItems, orders, customers, isStoreOpen, openingTime, closingTime, isInitialized]);

    const addToCart = (item: MenuItem, customizations?: any[]) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id && JSON.stringify(i.customizations) === JSON.stringify(customizations));
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id && JSON.stringify(i.customizations) === JSON.stringify(customizations)
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, { ...item, quantity: 1, customizations }];
        });
    };

    const updateCartQuantity = (itemId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) =>
                    item.id === itemId ? { ...item, quantity: item.quantity + delta } : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const clearCart = () => {
        setCart([]);
        setAppliedPromo(null);
    };

    const validatePromoCode = (code: string, cartTotal: number) => {
        const promo = PROMO_CODES.find(p => p.code === code && p.is_active);

        if (!promo) {
            return { valid: false, message: 'Invalid promo code' };
        }

        if (cartTotal < promo.min_order_value) {
            return { valid: false, message: `Minimum order value ₹${promo.min_order_value} required` };
        }

        return { valid: true, message: 'Promo code applied successfully!', promo };
    };

    const applyPromoCode = (promo: PromoCode | null) => {
        setAppliedPromo(promo);
    };

    const placeOrder = (customerData: { name: string; mobile: string; note?: string }) => {
        const subtotal = cart.reduce((sum, item) => {
            const itemTotal = item.price * item.quantity;
            const customizationTotal = (item.customizations || [])
                .filter(c => c.price)
                .reduce((cSum, c) => cSum + (c.price || 0) * item.quantity, 0);
            return sum + itemTotal + customizationTotal;
        }, 0);

        let discountAmount = 0;
        if (appliedPromo) {
            if (appliedPromo.discount_type === 'percentage') {
                discountAmount = Math.round((subtotal * appliedPromo.discount_value) / 100);
            } else {
                discountAmount = appliedPromo.discount_value;
            }
        }

        const totalAmount = subtotal - discountAmount;

        // Calculate estimated ready time (max prep time + 5 min buffer)
        const maxPrepTime = Math.max(...cart.map(item => item.prep_time_minutes));
        const estimatedReadyTime = new Date(Date.now() + (maxPrepTime + 5) * 60000).toISOString();

        // Create or Update Customer
        const existingCustomer = customers.find(c => c.mobile === customerData.mobile);
        if (existingCustomer) {
            const updatedCustomer = {
                ...existingCustomer,
                total_spent: existingCustomer.total_spent + totalAmount,
                last_order_date: new Date().toISOString()
            };
            setCustomers(prev => prev.map(c => c.mobile === customerData.mobile ? updatedCustomer : c));
        } else {
            const newCustomer: Customer = {
                customer_id: crypto.randomUUID(),
                name: customerData.name,
                mobile: customerData.mobile,
                total_spent: totalAmount,
                last_order_date: new Date().toISOString()
            };
            setCustomers(prev => [...prev, newCustomer]);
        }

        const newOrder: Order = {
            order_id: Math.floor(1000 + Math.random() * 9000).toString(),
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

        setOrders((prev) => [newOrder, ...prev]);
        clearCart();
        return newOrder;
    };

    const updateOrderStatus = (orderId: string, status: Order['order_status']) => {
        setOrders((prev) =>
            prev.map((o) => (o.order_id === orderId ? { ...o, order_status: status } : o))
        );
    };

    const addMenuItem = (item: MenuItem) => {
        setMenuItems((prev) => [...prev, item]);
    };

    const updateMenuItem = (item: MenuItem) => {
        setMenuItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    };

    const deleteMenuItem = (itemId: string) => {
        setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
    };

    const toggleStoreStatus = () => {
        setIsStoreOpen(prev => !prev);
    };

    return (
        <StoreContext.Provider
            value={{
                menuItems,
                orders,
                customers,
                cart,
                promoCodes: PROMO_CODES,
                appliedPromo,
                addToCart,
                updateCartQuantity,
                clearCart,
                placeOrder,
                updateOrderStatus,
                addMenuItem,
                updateMenuItem,
                deleteMenuItem,
                validatePromoCode,
                applyPromoCode,
                isStoreOpen,
                toggleStoreStatus,
                openingTime,
                closingTime,
                setOpeningTime: setOpeningTimeState,
                setClosingTime: setClosingTimeState
            }}
        >
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within a StoreProvider');
    return context;
};
