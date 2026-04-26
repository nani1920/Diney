'use client';

import { useStore } from '@/context/StoreContext';
import { useOrders } from '@/context/OrderContext';
import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Clock, ChevronRight, RotateCcw, Package, Star } from 'lucide-react';
import { RatingModal } from '@/components/customer/RatingModal';
import { Order } from '@/types';
import ResilientImage from "@/components/ResilientImage";
import { useOrderStore } from '@/store/useOrderStore';

function getFoodEmoji(name: string) {
    const emojis: Record<string, string> = {
        'pizza': '🍕', 'burger': '🍔', 'pasta': '🍝', 'sandwich': '🥪', 'salad': '🥗', 'sushi': '🍣', 'taco': '🌮', 'cake': '🍰', 'coffee': '☕', 'juice': '🍹', 'beer': '🍺', 'chicken': '🍗', 'fries': '🍟', 'ice cream': '🍦', 'donut': '🍩', 'cookie': '🍪', 'wrap': '🌯', 'soup': '🥣', 'noodles': '🍜', 'rice': '🍚', 'curry': '🍛', 'momos': '🥟', 'paneer': '🧀', 'dessert': '🍮', 'shake': '🥤', 'tea': '🍵'
    };
    const lowerName = name.toLowerCase();
    for (const [key, emoji] of Object.entries(emojis)) {
        if (lowerName.includes(key)) return emoji;
    }
    return '🍱';
}

export default function MyOrdersPage() {
    const { customer, tenant } = useStore();
    const { orders, fetchCustomerOrders, lastCompletedOrderId } = useOrders();
    const { reorderPastOrder } = useCart();
    const [localOrders, setLocalOrders] = useState<any[]>([]);
    const [mobileFilter, setMobileFilter] = useState(customer?.mobile || '');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
    
    // Rating State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isRatingOpen, setIsRatingOpen] = useState(false);

    const params = useParams();
    const router = useRouter();
    const tenantSlug = params.tenantSlug as string;

    // Initial sync of mobile filter when customer data loads
    useEffect(() => {
        if (customer?.mobile) {
            setMobileFilter(customer.mobile);
        }
    }, [customer?.mobile]);

    useEffect(() => {
        const loadOrders = async () => {
            if (tenant && mobileFilter.length === 10) {
                setIsLoading(true);
                try {
                    await fetchCustomerOrders(tenant.id, mobileFilter);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadOrders();
    }, [tenant, mobileFilter, fetchCustomerOrders]);

    useEffect(() => {
        if (mobileFilter.length === 10) {
            const filtered = orders.filter(o => {
                const orderMobile = String(o.customer_mobile).replace(/\D/g, '');
                const filterMobile = mobileFilter.replace(/\D/g, '');
                return orderMobile === filterMobile;
            });
            setLocalOrders(filtered);
        } else {
            setLocalOrders([]);
        }
    }, [orders, mobileFilter]);

    const handleReorder = async (order: any) => {
        await reorderPastOrder(order.items);
        setTimeout(() => {
            router.push(`/${tenantSlug}/cart`);
        }, 500);
    };

    // Aggressive Eager Trigger for Rating Modal (Like Swiggy/Zomato)
    useEffect(() => {
        if (orders.length > 0) {
            // Find ONLY the single most recently completed order
            const mostRecentCompletedOrder = [...orders]
                .filter(o => o.order_status === 'completed')
                .sort((a, b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime())[0];

            if (mostRecentCompletedOrder && tenant) {
                // Only prompt if it's within the last 24 hours
                const isRecent = (Date.now() - new Date(mostRecentCompletedOrder.order_time).getTime()) < (24 * 60 * 60 * 1000);
                const hasSeen = localStorage.getItem(`rated_tenant_${tenant.id}_mobile_${mostRecentCompletedOrder.customer_mobile}`);

                // If the absolute most recent order hasn't been rated, prompt for it.
                // It will NOT cascade to older orders because we only check index [0].
                if (isRecent && !hasSeen && !isRatingOpen) {
                    const timer = setTimeout(() => {
                        setSelectedOrder(mostRecentCompletedOrder as Order);
                        setIsRatingOpen(true);
                    }, 800);
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [orders, isRatingOpen]);

    const handleRatingClose = () => {
        if (selectedOrder && tenant) {
            localStorage.setItem(`rated_tenant_${tenant.id}_mobile_${selectedOrder.customer_mobile}`, 'true');
        }
        setIsRatingOpen(false);
    };

    const filteredOrders = localOrders;

    const activeOrders = filteredOrders.filter(o =>
        o.order_status === 'received' || o.order_status === 'preparing' || o.order_status === 'ready'
    );

    const completedOrders = filteredOrders.filter(o =>
        o.order_status === 'completed' || o.order_status === 'cancelled'
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'received': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'preparing': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'ready': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'completed': return 'bg-neutral-50 text-neutral-500 border-neutral-100';
            default: return 'bg-red-50 text-red-500 border-red-100';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'received': return 'Received';
            case 'preparing': return 'Preparing';
            case 'ready': return 'Ready';
            case 'completed': return 'Completed';
            default: return 'Cancelled';
        }
    };

    const { tableNumber } = useOrderStore();

    return (
        <main className="min-h-screen bg-[#FAFAF8] max-w-[520px] mx-auto">
            { }
            <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-neutral-100/60">
                <div className="px-5 py-3.5 flex items-center gap-4">
                    <Link href={`/${tenantSlug}${tableNumber ? `?table=${tableNumber}` : ''}`}>
                        <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200/50 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors shadow-sm">
                            <ArrowLeft className="w-[18px] h-[18px]" />
                        </div>
                    </Link>
                    <h1 className="text-[16px] font-bold text-neutral-900 tracking-[-0.01em]">My Orders</h1>
                </div>
            </header>

            <div className="px-5 py-6">
                { }
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <div className="bg-white rounded-[2rem] p-6 border border-neutral-200/50 shadow-sm relative overflow-hidden">
                        { }
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                        
                        <div className="relative z-10">
                            <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-4 ml-1">Identity Verification</h2>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-focus-within:bg-emerald-600 group-focus-within:text-white transition-all duration-300">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <input
                                    type="tel"
                                    placeholder="Enter registered mobile number"
                                    value={mobileFilter}
                                    onChange={(e) => setMobileFilter(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    className="w-full h-14 pl-16 pr-5 bg-neutral-50/50 rounded-2xl outline-none text-[16px] font-bold text-neutral-900 tracking-widest placeholder:text-neutral-300 placeholder:tracking-normal placeholder:font-medium border border-transparent focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                />
                            </div>
                            
                            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-100">
                                <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full shrink-0" />
                                <p className="text-[11px] font-medium text-neutral-400 tracking-tight">
                                    Only orders matching this exact number will be retrieved.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm animate-pulse">
                                    <div className="flex justify-between mb-4">
                                        <div className="space-y-2">
                                            <div className="h-4 w-24 bg-neutral-100 rounded" />
                                            <div className="h-3 w-32 bg-neutral-50 rounded" />
                                        </div>
                                        <div className="h-8 w-16 bg-neutral-100 rounded-lg" />
                                    </div>
                                    <div className="h-10 w-full bg-neutral-50 rounded-xl mt-4" />
                                </div>
                            ))}
                        </motion.div>
                    ) : mobileFilter.length >= 10 && (
                        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            
                            {/* Tabs */}
                            {(activeOrders.length > 0 || completedOrders.length > 0) && (
                                <div className="flex bg-neutral-100 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setActiveTab('active')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                    >
                                        Active ({activeOrders.length})
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('past')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'past' ? 'bg-white text-emerald-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                    >
                                        Past ({completedOrders.length})
                                    </button>
                                </div>
                            )}

                            {/* Active Orders */}
                            {activeTab === 'active' && activeOrders.length > 0 && (
                                <section>
                                    <h2 className="text-[12px] font-semibold text-emerald-600 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                        Active Orders
                                    </h2>
                                    <div className="space-y-3">
                                        {activeOrders.map((order) => (
                                            <Link key={order.order_id} href={`/${tenantSlug}/order/${order.order_id}`}>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="bg-white p-5 rounded-2xl border border-neutral-200/30 shadow-sm hover:shadow-md transition-all mb-3"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="text-[16px] font-bold text-neutral-900 tracking-[-0.01em]">Order #{order.short_id}</h3>
                                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                                                    order.order_type === 'DINE_IN' 
                                                                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                                                                        : 'bg-slate-50 text-slate-600 border-slate-100'
                                                                }`}>
                                                                    {order.order_type === 'DINE_IN' ? 'Dine-in' : 'Takeaway'}
                                                                </span>

                                                                {order.payment_status === 'paid' ? (
                                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase tracking-wider">Paid Online</span>
                                                                ) : order.payment_id ? (
                                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-200 uppercase tracking-wider">Payment Pending</span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
                                                                        {order.order_type === 'DINE_IN' ? 'Pay at Counter' : 'Cash on Pickup'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[12px] text-neutral-400 font-medium mt-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(order.order_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}, {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${getStatusStyle(order.order_status)}`}>
                                                            {getStatusLabel(order.order_status)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
                                                        <div className="flex -space-x-2">
                                                            {order.items.slice(0, 3).map((item: any, i: number) => (
                                                                <div key={i} className="w-8 h-8 rounded-lg border-2 border-white bg-neutral-50 overflow-hidden shadow-sm">
                                                                    {item.image_url ? (
                                                                        <ResilientImage 
                                                                            src={item.image_url} 
                                                                            width={32} 
                                                                            height={32} 
                                                                            className="w-full h-full object-cover" 
                                                                            alt={item.name} 
                                                                            fallbackEmoji={getFoodEmoji(item.name)}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[14px]">
                                                                            {getFoodEmoji(item.name)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {order.items.length > 3 && (
                                                                <div className="w-8 h-8 rounded-lg border-2 border-white bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-500 shadow-sm">
                                                                    +{order.items.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[17px] font-extrabold text-neutral-900 tracking-tight">₹{order.total_amount}</span>
                                                            <ChevronRight className="w-4 h-4 text-neutral-300" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Past Orders */}
                            {activeTab === 'past' && completedOrders.length > 0 && (
                                <section>
                                    <div className="space-y-3">
                                        {completedOrders.map((order) => (
                                            <motion.div
                                                key={order.order_id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white p-5 rounded-2xl border border-neutral-200/30 shadow-sm transition-all"
                                            >
                                                <Link href={`/${tenantSlug}/order/${order.order_id}`}>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="text-[16px] font-bold text-neutral-900 tracking-[-0.01em]">Order #{order.short_id}</h3>
                                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                                                    order.order_type === 'DINE_IN' 
                                                                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                                                                        : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                                                }`}>
                                                                    {order.order_type === 'DINE_IN' ? 'Dine-in' : 'Takeaway'}
                                                                </span>

                                                                {order.payment_status === 'paid' ? (
                                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase tracking-wider">Paid Online</span>
                                                                ) : order.payment_id ? (
                                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-200 uppercase tracking-wider">Payment Pending</span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-50 text-neutral-500 border border-neutral-100 uppercase tracking-wider">
                                                                        {order.order_type === 'DINE_IN' ? 'Pay at Counter' : 'Cash on Pickup'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[12px] text-neutral-400 font-medium mt-1">
                                                                {new Date(order.order_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}, {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${getStatusStyle(order.order_status)}`}>
                                                            {getStatusLabel(order.order_status)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
                                                        <span className="text-[13px] text-neutral-500 font-medium">{order.items.length} items</span>
                                                        <span className="text-[16px] font-extrabold text-neutral-900 tracking-tight">₹{order.total_amount}</span>
                                                    </div>
                                                </Link>
                                                <button
                                                    onClick={() => handleReorder(order)}
                                                    className="w-full mt-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-3 rounded-xl font-bold text-[13px] transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Reorder
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Empty State Route Tabs */}
                            {activeTab === 'active' && activeOrders.length === 0 && completedOrders.length > 0 && (
                                <div className="text-center py-10 text-neutral-400 text-sm font-medium">No active orders</div>
                            )}
                            {activeTab === 'past' && completedOrders.length === 0 && activeOrders.length > 0 && (
                                <div className="text-center py-10 text-neutral-400 text-sm font-medium">No past orders</div>
                            )}

                            {activeOrders.length === 0 && completedOrders.length === 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-5">
                                        <Package className="w-8 h-8 text-emerald-300" />
                                    </div>
                                    <h3 className="text-[18px] font-bold text-neutral-900 tracking-[-0.01em] mb-2">No orders found</h3>
                                    <p className="text-[14px] text-neutral-400 font-medium mb-6 max-w-xs leading-relaxed">
                                        For your privacy, order history is only accessible on the device used to place the orders.
                                    </p>
                                    <Link href={`/${tenantSlug}`}>
                                        <button className="h-11 px-6 bg-emerald-600 text-white rounded-xl font-bold text-[13px] hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/15">
                                            Browse Menu
                                        </button>
                                    </Link>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                { }
                <AnimatePresence>
                    {mobileFilter.length < 10 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-16 text-center"
                        >
                            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-5">
                                <Phone className="w-8 h-8 text-emerald-300" />
                            </div>
                            <h3 className="text-[18px] font-bold text-neutral-900 tracking-[-0.01em] mb-2">Track Your Orders</h3>
                            <p className="text-[14px] text-neutral-400 font-medium max-w-xs leading-relaxed">
                                Enter your mobile number to view your order history
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Rating Modal */}
            <RatingModal 
                isOpen={isRatingOpen}
                onClose={handleRatingClose}
                orderId={selectedOrder?.order_id || ''}
                shortId={selectedOrder?.short_id || ''}
                tenantId={tenant?.id || ''}
            />
        </main>
    );
}
