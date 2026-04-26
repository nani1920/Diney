'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    Plus, 
    Minus, 
    ShoppingCart, 
    CheckCircle2, 
    Receipt, 
    Utensils,
    Search,
    ChevronRight,
    Wallet,
    Clock,
    User,
    Phone,
    ChevronDown,
    ChefHat,
    ArrowRight,
    ArrowLeft,
    Trash2,
    Edit2,
    ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { staffCreateOrder, staffSettleTable, updateOrderStatusServer, updateTableSessionCustomer } from '@/app/actions/orders';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    X, 
    Save, 
    User as UserIcon, 
    Phone as PhoneIcon,
    AlertCircle
} from 'lucide-react';
import { MenuItem, CartItem } from '@/types';
import { useRouter } from 'next/navigation';

interface StaffTableTerminalClientProps {
    tableNumber: string;
    billData: any;
    menu: MenuItem[];
    tenantId: string;
    tenantSlug: string;
}

export default function StaffTableTerminalClient({ 
    tableNumber, 
    billData: initialBill, 
    menu, 
    tenantId, 
    tenantSlug 
}: StaffTableTerminalClientProps) {
    const router = useRouter();
    const [bill, setBill] = useState(initialBill);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [activeTab, setActiveTab] = useState<'menu' | 'bill'>('menu');
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [isSettling, setIsSettling] = useState(false);
    const [expandedStatuses, setExpandedStatuses] = useState<string[]>(['ready', 'received']);
    const [nameError, setNameError] = useState(false);
    const [phoneError, setPhoneError] = useState(false);
    
    // Customer Editing State
    const [isEditingCustomer, setIsEditingCustomer] = useState(false);
    const [tempName, setTempName] = useState('');
    const [tempMobile, setTempMobile] = useState('');
    const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);

    const toggleStatus = (status: string) => {
        setExpandedStatuses(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const sessionId = bill?.session_id;

    useEffect(() => {
        if (!tableNumber) return;

        // 1. Listen for table changes (to detect new sessions starting)
        const tableChannel = supabase
            .channel(`table-status-${tableNumber}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'tables', 
                filter: `table_number=eq.${tableNumber}` 
            }, (payload) => {
                // Only refresh if session changed
                if (payload.new.active_session_id !== payload.old?.active_session_id) {
                    router.refresh();
                }
            })
            .subscribe();

        // 2. Listen for order changes if session exists
        let orderChannel: any = null;

        if (sessionId) {
            orderChannel = supabase
                .channel(`table-bill-${sessionId}`)
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'orders', 
                    filter: `session_id=eq.${sessionId}` 
                }, (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        setBill((prev: any) => {
                            if (!prev || prev.session_id !== sessionId) return prev;
                            return {
                                ...prev,
                                items: prev.items.map((item: any) => 
                                    item.order_id === payload.new.id 
                                        ? { ...item, order_status: payload.new.status } 
                                        : item
                                )
                            };
                        });
                    } else if (payload.eventType === 'INSERT') {
                        // New order placed, refresh to get items
                        router.refresh();
                    }
                })
                .subscribe();
        }

        return () => { 
            supabase.removeChannel(tableChannel);
            if (orderChannel) supabase.removeChannel(orderChannel);
        };
    }, [tableNumber, sessionId, router]);

    useEffect(() => { 
        setBill(initialBill); 
        // Sync customer info from session
        const sessionOrders = initialBill?.orders || [];
        const lastOrder = sessionOrders[sessionOrders.length - 1];
        if (lastOrder) {
            setCustomerName(lastOrder.customer_name || '');
            setCustomerMobile(lastOrder.customer_mobile || '');
        }
    }, [initialBill]);


    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { ...item, uniqueId: `${item.id}-${Date.now()}`, quantity: 1, customizations: [] }];
        });
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = Math.max(0, i.quantity + delta);
                return { ...i, quantity: newQty };
            }
            return i;
        }).filter(i => i.quantity > 0));
    };

    const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    const handleServeItem = async (orderId: string) => {
        try {
            const res = await updateOrderStatusServer(orderId, 'completed', tenantId);
            if (res) {
                toast.success("Item served");
                router.refresh();
            }
        } catch (err) {
            toast.error("Failed to serve item");
        }
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return;

        // Validation
        const cleanName = customerName.trim();
        const cleanMobile = customerMobile.trim();
        let hasError = false;

        if (!cleanName || cleanName.length < 2) {
            toast.error("Enter a valid name (min 2 chars)");
            setNameError(true);
            hasError = true;
        } else {
            setNameError(false);
        }

        if (!/^\d{10}$/.test(cleanMobile)) {
            toast.error("Enter a valid 10-digit mobile number");
            setPhoneError(true);
            hasError = true;
        } else {
            setPhoneError(false);
        }

        if (hasError) {
            // Automatically open the guest info modal if details are missing
            setTempName(customerName || '');
            setTempMobile(customerMobile || '');
            setIsEditingCustomer(true);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await staffCreateOrder(
                tenantId, 
                tableNumber, 
                cart, 
                cartTotal, 
                cleanName, 
                cleanMobile
            );
            
            if (res.success) {
                toast.success("Order placed successfully");
                setCart([]);
                router.refresh();
            }
        } catch (err) { 
            toast.error("Failed to place order"); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const handleSettle = async () => {
        setIsSettling(true);
        try {
            const res = await staffSettleTable(tenantId, tableNumber);
            if (res) {
                toast.success("Table settled");
                router.push(`/${tenantSlug}/staff/floor-map`);
            }
        } catch (err) { 
            toast.error("Settle failed"); 
            setIsSettling(false);
        }
    };

    const aggregatedBillItems = bill?.items?.reduce((acc: any, item: any) => {
        const existing = acc.find((a: any) => a.name === item.name && a.price === item.price);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            acc.push({ ...item });
        }
        return acc;
    }, []) || [];

    const categories = useMemo(() => {
        const uniqueCats = Array.from(new Set(menu.map(i => i.category?.name).filter(Boolean))) as string[];
        return ['all', ...uniqueCats.sort()];
    }, [menu]);

    const filteredMenu = useMemo(() => {
        return menu.filter(i => {
            const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory === 'all' || i.category?.name === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [menu, search, activeCategory]);

    return (
        <div className="flex-1 flex flex-col min-h-0 relative bg-white md:bg-neutral-50/50 scroll-smooth overflow-hidden">
            <header className="bg-white border-b border-neutral-100 shrink-0 sticky top-0 z-30">
                <div className="px-4 md:px-6 py-4 flex items-center gap-4">
                    <Link 
                        href={`/${tenantSlug}/staff/floor-map`}
                        className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200 shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-neutral-600" />
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-emerald-600">
                                TABLE <span className="text-neutral-900">#{tableNumber}</span>
                            </h1>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 leading-none mb-1">Total</p>
                                <p className="text-2xl font-black text-emerald-600 tracking-tighter leading-none">₹{bill?.subtotal || 0}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-0">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                                <span className="truncate max-w-[120px] text-neutral-600">{customerName || 'GUEST'}</span>
                                <span className="w-1 h-1 bg-neutral-200 rounded-full" />
                                <span className="tracking-[0.15em]">{customerMobile || 'NO MOBILE'}</span>
                            </div>
                            <button 
                                onClick={() => {
                                    setTempName(customerName || '');
                                    setTempMobile(customerMobile || '');
                                    setIsEditingCustomer(true);
                                }}
                                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors group"
                            >
                                <Edit2 className="w-3 h-3 text-neutral-300 group-hover:text-neutral-600 transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex lg:hidden border-b border-neutral-100 px-4 md:px-6 relative">
                    <button 
                        onClick={() => setActiveTab('menu')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-3 py-4 transition-all relative",
                            activeTab === 'menu' ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-600"
                        )}
                    >
                        <Utensils className={clsx("w-4 h-4 transition-colors duration-300", activeTab === 'menu' ? "text-emerald-500" : "text-neutral-300")} />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300">Menu</span>
                        {activeTab === 'menu' && (
                            <motion.div 
                                layoutId="activeTabUnderline"
                                className="absolute bottom-0 inset-x-4 h-0.5 bg-neutral-900 rounded-t-full z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab('bill')}
                        className={clsx(
                            "flex-1 flex items-center justify-center gap-3 py-4 transition-all relative",
                            activeTab === 'bill' ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-600"
                        )}
                    >
                        <ClipboardList className={clsx("w-4 h-4 transition-colors duration-300", activeTab === 'bill' ? "text-emerald-500" : "text-neutral-300")} />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300">Cart & Bill</span>
                        {activeTab === 'bill' && (
                            <motion.div 
                                layoutId="activeTabUnderline"
                                className="absolute bottom-0 inset-x-4 h-0.5 bg-neutral-900 rounded-t-full z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        {cart.length > 0 && (
                            <span className="absolute top-3 right-4 w-5 h-5 bg-emerald-500 text-white text-[9px] rounded-full flex items-center justify-center font-black border-2 border-white shadow-sm animate-in zoom-in">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-px min-h-0 overflow-hidden px-0 pb-0">

                {/* Left Section: Menu */}
                <div className={clsx(
                    "flex-1 flex flex-col min-w-0 min-h-0 bg-white rounded-2xl md:rounded-none border border-gray-100 md:border-0 overflow-hidden shadow-sm md:shadow-none relative",
                    activeTab !== 'menu' ? "hidden lg:flex" : "flex"
                )}>
                    <div className="p-3 md:p-5 border-b border-gray-100 bg-white shrink-0">
                        <div className="relative group mb-2 md:mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search menu..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 md:py-3 pl-9 pr-3 text-xs focus:bg-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium"
                            />
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={clsx(
                                        "px-4 py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border shadow-sm",
                                        activeCategory === cat 
                                            ? "bg-emerald-600 border-emerald-600 text-white" 
                                            : "bg-white border-gray-100 text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 scrollbar-transparent overscroll-contain bg-gray-50/30">
                        <div className="p-4 md:p-10 md:px-[5%] pb-24 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-5 md:gap-6">
                            {filteredMenu.map((item) => {
                                const cartItem = cart.find(c => c.id === item.id);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            if (!item.availability_status) {
                                                toast.error("Item is out of stock");
                                                return;
                                            }
                                            if (!cartItem) addToCart(item);
                                        }}
                                        className={clsx(
                                            "bg-white border rounded-2xl p-0 text-left transition-all cursor-pointer group flex flex-col h-auto relative overflow-hidden",
                                            cartItem ? "border-emerald-500 shadow-md ring-1 ring-emerald-500/20" : "border-gray-100 hover:border-emerald-500/40 hover:shadow-md",
                                            !item.availability_status && "opacity-60 grayscale-[0.5]"
                                        )}
                                    >
                                        <div className="aspect-[4/3] w-full bg-gray-50 relative overflow-hidden border-b border-gray-100">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Utensils className="w-5 h-5 text-gray-200" />
                                                </div>
                                            )}
                                            
                                            {/* Status Badges */}
                                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                <div className={clsx(
                                                    "w-2 h-2 rounded-full",
                                                    item.veg_or_nonveg === 'veg' ? "bg-green-500 shadow-sm" : "bg-red-500 shadow-sm"
                                                )} />
                                                {!item.availability_status && (
                                                    <div className="bg-rose-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm tracking-tighter">
                                                        Sold Out
                                                    </div>
                                                )}
                                            </div>

                                            {cartItem && (
                                                <div className="absolute top-2 right-2 z-10">
                                                    <div className="bg-emerald-600 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-white">
                                                        {cartItem.quantity}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 flex-1 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-bold text-[11px] text-gray-900 leading-tight line-clamp-2 mb-1">{item.name}</h4>
                                                <p className="text-[11px] font-bold text-emerald-600">₹{item.price}</p>
                                            </div>
                                            <div className="flex justify-end mt-2">
                                                {cartItem ? (
                                                    <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                        <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }} className="p-1 hover:text-rose-500 transition-colors"><Minus className="w-3 h-3" /></button>
                                                        <span className="text-[10px] font-bold text-gray-900 w-3 text-center">{cartItem.quantity}</span>
                                                        <button onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }} className="p-1 hover:text-emerald-500 transition-colors"><Plus className="w-3 h-3" /></button>
                                                    </div>
                                                ) : item.availability_status ? (
                                                    <div className="bg-emerald-600 text-white text-[12px] font-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform active:scale-90">
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <div className="bg-neutral-100 text-neutral-400 text-[10px] font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-neutral-200">
                                                        <Minus className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Place Order Button - Now anchored to menu section */}
                    <AnimatePresence>
                        {cart.length > 0 && (
                            <motion.div 
                                initial={{ y: 50, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                exit={{ y: 50, opacity: 0 }} 
                                className="fixed lg:absolute bottom-8 lg:bottom-6 inset-x-4 z-[99] max-w-[420px] mx-auto"
                            >
                                <div className="w-full bg-emerald-600 hover:bg-emerald-650 text-white p-3 md:p-3.5 rounded-2xl shadow-2xl flex items-center justify-between group transition-all border border-emerald-500/50">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setCart([]); }}
                                            className="bg-rose-500 hover:bg-rose-600 p-2.5 rounded-xl transition-all active:scale-90 flex items-center justify-center group/trash shadow-lg border border-white/20"
                                            title="Clear Cart"
                                        >
                                            <Trash2 className="w-4 h-4 text-white transition-transform group-hover/trash:scale-110" />
                                        </button>
                                        <div className="text-left">
                                            <p className="text-[8px] font-bold uppercase tracking-widest opacity-80 leading-none mb-1">New Order</p>
                                            <p className="text-xs font-black leading-none">{cart.length} Items • ₹{cartTotal}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handlePlaceOrder} 
                                        disabled={isSubmitting} 
                                        className="flex items-center gap-1.5 bg-white text-emerald-600 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all shadow-md shrink-0 hover:bg-emerald-50 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSubmitting ? "..." : "Place Order"}{!isSubmitting && <ArrowRight className="w-3 h-3" />}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Section: Live Receipt */}
                <div className={clsx(
                    "w-full lg:w-[310px] xl:w-[340px] flex flex-col shrink-0 min-h-0 flex-1 lg:flex-none",
                    activeTab !== 'bill' ? "hidden lg:flex" : "flex"
                )}>
                    <div className="bg-white border border-gray-100 md:border-0 rounded-2xl md:rounded-none flex-1 flex flex-col shadow-sm md:shadow-none min-h-0 overflow-hidden relative h-full">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/30 shrink-0">
                            <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-emerald-600" />
                                <h3 className="font-bold text-[10px] text-emerald-900 uppercase tracking-widest">Live Receipt</h3>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Table {tableNumber}</span>
                                {bill?.orders?.[0]?.customer_name && (
                                    <span className="text-[9px] font-medium text-gray-400 truncate max-w-[100px] text-right">{bill.orders[0].customer_name}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-0 space-y-2 scrollbar-transparent min-h-0">
                            {(!bill?.items || bill.items.length === 0) ? (
                                <div className="h-full flex flex-col items-center justify-center py-12 md:py-20 opacity-40">
                                    <Receipt className="w-8 h-8 mb-3 text-neutral-200" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 text-center px-6">No active orders<br/>for this table</p>
                                </div>
                            ) : (
                                (() => {
                                    const statusOrder = ['ready', 'received', 'completed'];
                                    const groupedByStatus = bill.items.reduce((acc: any, item: any) => {
                                        let status = item.order_status || 'received';
                                        // Map 'preparing' to the 'received' bucket so it appears in "Pending"
                                        if (status === 'preparing') status = 'received';
                                        
                                        if (!acc[status]) acc[status] = [];
                                        acc[status].push(item);
                                        return acc;
                                    }, {});
                                    
                                    return statusOrder.map(status => {
                                        const statusItems = groupedByStatus[status];
                                        if (!statusItems || statusItems.length === 0) return null;

                                        const isExpanded = expandedStatuses.includes(status);
                                        const label = status === 'ready' ? 'Ready to Serve' : status === 'received' ? 'Pending' : 'Completed';
                                        const statusColor = status === 'ready' ? 'text-emerald-700' : status === 'received' ? 'text-amber-700' : 'text-gray-500';
                                        const borderColor = status === 'ready' ? 'border-emerald-200' : status === 'received' ? 'border-amber-200' : 'border-gray-200';
                                        const icon = status === 'ready' ? <CheckCircle2 className="w-3.5 h-3.5" /> : status === 'received' ? <Clock className="w-3.5 h-3.5" /> : <Receipt className="w-3.5 h-3.5" />;
                                        
                                        // Group items by time WITHIN the status bucket
                                        const timeGroups = statusItems.reduce((acc: any, item: any) => {
                                            const time = item.order_time ? new Date(item.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown';
                                            if (!acc[time]) acc[time] = [];
                                            acc[time].push(item);
                                            return acc;
                                        }, {});

                                        return (
                                            <div key={status} className="space-y-1.5 relative">
                                                <div className="sticky top-0 z-10 bg-white pb-1.5 pt-0">
                                                    <button 
                                                        onClick={() => toggleStatus(status)}
                                                        className={clsx(
                                                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg border bg-white shadow-sm transition-all active:scale-[0.98] group", 
                                                            borderColor
                                                        )}
                                                    >
                                                        <div className={clsx("p-1.5 rounded-md bg-gray-50 group-hover:bg-white transition-colors shadow-inner", statusColor)}>
                                                            {icon}
                                                        </div>
                                                        <span className={clsx("text-[10px] font-black uppercase tracking-wider", statusColor)}>{label}</span>
                                                        <span className="ml-auto bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-md mr-1 border border-gray-200">{statusItems.length}</span>
                                                        <ChevronDown className={clsx("w-3.5 h-3.5 text-gray-500 transition-transform duration-300", isExpanded ? "rotate-180" : "")} />
                                                    </button>
                                                </div>
                                                
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="space-y-4 pl-1.5 border-l-2 border-gray-100 ml-2 py-2">
                                                                {Object.entries(timeGroups).reverse().map(([time, items]: [string, any]) => (
                                                                    <div key={time} className="space-y-2 relative">
                                                                        {/* Time Marker */}
                                                                        <div className="flex items-center gap-2 -ml-5">
                                                                            <div className="w-2 h-2 rounded-full bg-gray-400 border border-white shadow-sm" />
                                                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{time}</span>
                                                                        </div>
                                                                        
                                                                        <div className="space-y-2">
                                                                            {items.map((item: any, idx: number) => (
                                                                                <div key={idx} className={clsx(
                                                                                    "group flex flex-col gap-2 p-3 rounded-xl transition-all border",
                                                                                    item.order_status === 'ready' ? "bg-white border-emerald-300 shadow-sm ring-1 ring-emerald-500/10" : 
                                                                                    item.order_status === 'completed' ? "bg-gray-50/20 border-gray-100 opacity-80" :
                                                                                    "bg-white border-gray-200 hover:border-gray-300"
                                                                                )}>
                                                                                    <div className="flex items-start justify-between gap-3">
                                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                                            <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center">
                                                                                                {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <Utensils className="w-4 h-4 text-gray-300" />}
                                                                                            </div>
                                                                                            <div className="min-w-0">
                                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                                    <span className="text-xs font-black text-emerald-700 italic">x{item.quantity}</span>
                                                                                                    <p className="text-xs font-black text-neutral-900 uppercase tracking-tight leading-none">{item.name}</p>
                                                                                                </div>
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <span className={clsx(
                                                                                                        "text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-sm tracking-[0.15em] border", 
                                                                                                        item.order_status === 'ready' ? "bg-emerald-600 text-white border-emerald-500" : 
                                                                                                        item.order_status === 'completed' ? "text-neutral-400 border-neutral-200" : 
                                                                                                        item.order_status === 'cancelled' ? "bg-rose-600 text-white border-rose-500" : 
                                                                                                        "bg-amber-100 text-amber-800 border-amber-300"
                                                                                                    )}>
                                                                                                        {item.order_status}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <span className="text-xs font-black text-black leading-none">₹{item.price * item.quantity}</span>
                                                                                            {item.order_status === 'ready' && (
                                                                                                <button 
                                                                                                    onClick={(e) => { e.stopPropagation(); handleServeItem(item.order_id); }} 
                                                                                                    className="mt-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase rounded shadow-sm active:scale-95 transition-all"
                                                                                                >
                                                                                                    Serve
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    {item.customizations?.length > 0 && (
                                                                                        <div className="pl-[52px]">
                                                                                            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter bg-gray-50 px-2 py-1 rounded border border-gray-200 inline-block">
                                                                                                {item.customizations.map((c: any) => c.name).join(' • ')}
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    });
                                })()
                            )}
                        </div>

                        {bill && bill.items && bill.items.length > 0 && (
                            <div className="mt-auto p-4 pb-10 md:p-5 md:pb-5 border-t border-neutral-100 bg-white shrink-0 z-20">
                                <div className="space-y-1 md:space-y-2 mb-3 md:mb-4 px-1">
                                    <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-widest"><span>Subtotal</span><span>₹{bill?.subtotal || 0}</span></div>
                                    <div className="flex justify-between items-center pt-2 md:pt-3 border-t border-neutral-100"><span className="text-xs md:text-sm font-bold text-neutral-900 uppercase tracking-wider">Total Bill</span><span className="text-2xl md:text-3xl font-black text-emerald-600 tracking-tight">₹{bill?.subtotal || 0}</span></div>
                                </div>
                                <button 
                                    onClick={() => setIsSettleModalOpen(true)} 
                                    className="w-full py-3.5 md:py-4 bg-neutral-900 hover:bg-black text-white font-black rounded-xl text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] italic"
                                >
                                    <Wallet className="w-4 h-4 md:w-5 md:h-5" /> Settle Table
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Settlement Modal */}
            <AnimatePresence>
                {isSettleModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
                            onClick={() => !isSettling && setIsSettleModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
                                <h3 className="text-sm font-black italic text-neutral-900 uppercase tracking-tighter">Settle Table {tableNumber}</h3>
                                <button 
                                    onClick={() => setIsSettleModalOpen(false)} 
                                    className="w-10 h-10 flex items-center justify-center hover:bg-neutral-50 rounded-full transition-colors text-neutral-400"
                                >
                                    <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-white">
                                {/* Info Bar - Responsive Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 px-1">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Customer</span>
                                        <span className="text-sm font-black text-neutral-900 uppercase truncate block">{customerName || 'Walk-in Guest'}</span>
                                    </div>
                                    <div className="space-y-1 sm:text-right">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Billing Date</span>
                                        <span className="text-sm font-black text-neutral-900 uppercase block">{new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Receipt Items */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-2">
                                        <span className="text-[10px] font-black text-neutral-900 uppercase tracking-widest">Item Description</span>
                                        <span className="text-[10px] font-black text-neutral-900 uppercase tracking-widest">Amount</span>
                                    </div>
                                    <div className="divide-y divide-neutral-50">
                                        {aggregatedBillItems.map((item: any, idx: number) => (
                                            <div key={idx} className="py-4 flex justify-between items-start">
                                                <div className="flex gap-4">
                                                    <span className="text-sm font-black text-emerald-600 w-8 italic">x{item.quantity}</span>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black text-neutral-900 uppercase leading-none">{item.name}</p>
                                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">₹{item.price} per unit</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-black text-neutral-900 tracking-tighter italic">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total Section - Responsive */}
                                <div className="mt-auto space-y-4 pt-6 border-t-2 border-neutral-100">
                                    <div className="bg-neutral-50 rounded-[2rem] p-6 sm:p-8 border border-neutral-100">
                                        <div className="flex justify-between items-center mb-4 text-neutral-400 font-bold uppercase text-[10px] tracking-widest">
                                            <span>Subtotal</span>
                                            <span className="text-neutral-900 font-black italic">₹{bill?.subtotal || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-8 text-neutral-400 font-bold uppercase text-[10px] tracking-widest">
                                            <span>Tax & Surcharges</span>
                                            <span className="text-neutral-900 font-black italic">Included</span>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pt-6 border-t border-neutral-200">
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Payable</p>
                                                <p className="text-4xl sm:text-5xl font-black text-neutral-900 tracking-tighter italic">₹{bill?.subtotal || 0}</p>
                                            </div>
                                            <div className="flex flex-col items-start sm:items-end gap-2">
                                                <div className="bg-amber-400 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-100 italic">
                                                    Awaiting Collection
                                                </div>
                                                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Payment Status</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white border-t border-neutral-100 shrink-0">
                                <button 
                                    onClick={handleSettle}
                                    disabled={isSettling}
                                    className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-[12px] uppercase tracking-widest shadow-2xl shadow-emerald-100 transition-all flex items-center justify-center active:scale-[0.98] disabled:opacity-50 italic"
                                >
                                    {isSettling ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "CONFIRM SETTLEMENT"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Customer Edit Modal */}
            <AnimatePresence>
                {isEditingCustomer && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isUpdatingCustomer && setIsEditingCustomer(false)}
                            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative z-10"
                        >
                            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.15em] text-neutral-900">Edit Guest Info</h3>
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Table #{tableNumber}</p>
                                </div>
                                <button 
                                    onClick={() => setIsEditingCustomer(false)}
                                    disabled={isUpdatingCustomer}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors text-neutral-400 hover:text-neutral-900"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-500 ml-1">Guest Name</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <UserIcon className="w-4 h-4 text-neutral-300" />
                                        </div>
                                        <input 
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            placeholder="Enter guest name..."
                                            className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-500 ml-1">Mobile Number</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <PhoneIcon className="w-4 h-4 text-neutral-300" />
                                        </div>
                                        <input 
                                            type="tel"
                                            value={tempMobile}
                                            onChange={(e) => setTempMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            placeholder="10-digit number..."
                                            className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {tempMobile && tempMobile.length > 0 && tempMobile.length < 10 && (
                                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                        <p className="text-[10px] font-bold text-amber-700 uppercase leading-tight">Mobile number should be 10 digits</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-neutral-50/80 border-t border-neutral-100 flex gap-3">
                                <button 
                                    onClick={() => setIsEditingCustomer(false)}
                                    disabled={isUpdatingCustomer}
                                    className="flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-neutral-500 hover:text-neutral-900 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={async () => {
                                        if (tempMobile && tempMobile.length > 0 && tempMobile.length < 10) {
                                            toast.error("Please enter a valid 10-digit mobile number");
                                            return;
                                        }
                                        setIsUpdatingCustomer(true);
                                        try {
                                            const res = await updateTableSessionCustomer(
                                                tenantId, 
                                                tableNumber, 
                                                bill?.session_id || '', 
                                                tempName, 
                                                tempMobile
                                            );
                                            if (res.success) {
                                                toast.success("Guest info updated");
                                                setIsEditingCustomer(false);
                                                // Bill will auto-refresh via Supabase listener
                                            } else {
                                                toast.error(res.error || "Failed to update");
                                            }
                                        } catch (err) {
                                            toast.error("An unexpected error occurred");
                                        } finally {
                                            setIsUpdatingCustomer(false);
                                        }
                                    }}
                                    disabled={isUpdatingCustomer}
                                    className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isUpdatingCustomer ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Update Info
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
