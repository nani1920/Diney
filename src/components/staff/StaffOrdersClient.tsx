'use client';

import { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types';
import {
    Search,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronDown,
    MoreVertical,
    Printer,
    History,
    UtensilsCrossed,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { updateOrderStatusServer } from '@/app/actions/orders';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

interface StaffOrdersClientProps {
    initialOrders: Order[];
    hasMore: boolean;
    currentPage: number;
    tenantId: string;
}

export default function StaffOrdersClient({
    initialOrders,
    hasMore,
    currentPage,
    tenantId
}: StaffOrdersClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState(initialOrders);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // Sync state when props change (pagination)
    useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);

    // 1. Real-time Updates
    useEffect(() => {
        const channel = supabase
            .channel('orders-full-list')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        window.location.reload();
                    } else if (payload.eventType === 'UPDATE') {
                        setOrders(current => current.map(o => o.order_id === payload.new.id ? { ...o, order_status: payload.new.status, payment_status: payload.new.payment_status } : o));
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [tenantId]);

    const handleUpdateStatus = async (orderId: string, status: string) => {
        try {
            const res = await updateOrderStatusServer(orderId, status, tenantId);
            if (res.success) {
                toast.success(`Order ${status}`);
            }
        } catch (err) {
            toast.error("Failed to update");
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.short_id.toLowerCase().includes(search.toLowerCase()) ||
            o.customer_name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: OrderStatus) => {
        switch (status) {
            case 'received': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'ready': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters (Admin Style) */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by ID or Customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {['all', 'received', 'preparing', 'ready', 'completed'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={clsx(
                                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                                statusFilter === s
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                                    : "bg-white border-gray-100 text-gray-500 hover:text-gray-900"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Feed */}
            <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map((order) => (
                    <div key={order.order_id} className="bg-white border border-neutral-100 rounded-3xl md:rounded-[2.5rem] p-5 md:p-6 hover:shadow-xl hover:shadow-black/5 transition-all duration-500 relative group overflow-hidden">
                        
                        {/* ID & Table - Mobile Only (Absolute) */}
                        <div className="lg:hidden absolute top-4 right-5 flex flex-col items-end shrink-0 z-10 gap-1">
                            <div className="text-[7px] font-black text-neutral-300 uppercase tracking-[0.2em] leading-none mb-0.5">ID</div>
                            <div className="text-[10px] font-black text-neutral-400 leading-none mb-1.5">#{order.short_id}</div>
                            <div className="text-[7px] font-black text-neutral-300 uppercase tracking-[0.2em] leading-none mb-0.5">Table</div>
                            <div className="text-[10px] font-black text-neutral-900 leading-none">#{order.table_number || '??'}</div>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
                            
                            {/* 1. Identity Section (Left Side) */}
                            <div className="flex flex-col shrink-0 lg:w-[240px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-black text-neutral-900 text-xl leading-none tracking-tight truncate">{order.customer_name}</h4>
                                    <span className={clsx(
                                        "text-[7px] font-black uppercase px-2 py-1 rounded-lg border tracking-widest shrink-0 leading-none",
                                        getStatusStyle(order.order_status)
                                    )}>{order.order_status}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none">
                                    <Clock className="w-3 h-3 text-neutral-300" />
                                    <span>{new Date(order.order_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                </div>
                            </div>

                            {/* 2. Items Section (Compact grid with overflow) */}
                            <div 
                                onClick={() => setSelectedOrder(order)}
                                className="flex-1 min-w-0 pr-12 lg:pr-0 cursor-pointer group/items-container"
                            >
                                <div className="flex flex-wrap gap-2 py-1">
                                    {order.items.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-neutral-50/60 px-2.5 py-1.5 rounded-xl border border-neutral-100 shrink-0 hover:bg-neutral-100 transition-colors group/item max-w-[140px]">
                                            <div className="w-7 h-7 rounded-lg bg-white border border-neutral-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm group-hover/item:scale-105 transition-transform">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UtensilsCrossed className="w-3.5 h-3.5 text-neutral-200" />
                                                )}
                                            </div>
                                            <div className="min-w-0 pr-1">
                                                <p className="text-[10px] font-bold text-neutral-700 truncate leading-none mb-1">{item.name}</p>
                                                <p className="text-[9px] font-black text-emerald-600 leading-none uppercase tracking-tighter">{item.quantity}x</p>
                                            </div>
                                        </div>
                                    ))}
                                    {order.items.length > 3 && (
                                        <div className="flex items-center justify-center bg-neutral-50/60 px-3 py-1.5 rounded-xl border border-neutral-100 shrink-0 group-hover/items-container:bg-neutral-100 transition-colors">
                                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none">+{order.items.length - 3} More</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3. Actions Section */}
                            <div className="flex flex-col lg:items-end gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-neutral-50 mt-1 lg:mt-0 lg:w-[180px]">
                                {/* ID & Table - Desktop Only (Integrated) */}
                                <div className="hidden lg:flex items-center gap-6 mb-1 text-right">
                                    <div className="flex flex-col items-end">
                                        <div className="text-[7px] font-black text-neutral-300 uppercase tracking-[0.2em] leading-none mb-1">Order ID</div>
                                        <div className="text-[11px] font-black text-neutral-400 leading-none">#{order.short_id}</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-[7px] font-black text-neutral-300 uppercase tracking-[0.2em] leading-none mb-1">Table</div>
                                        <div className="text-xs font-black text-neutral-900 leading-none uppercase tracking-tighter">#{order.table_number || '??'}</div>
                                    </div>
                                </div>

                                <div className="w-full">
                                    {order.order_status === 'received' && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.order_id, 'preparing')}
                                            className="w-full h-11 bg-neutral-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-xl shadow-black/10 active:scale-95"
                                        >
                                            Start Cooking
                                        </button>
                                    )}
                                    {order.order_status === 'preparing' && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.order_id, 'ready')}
                                            className="w-full h-11 bg-blue-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                                        >
                                            Ready to Serve
                                        </button>
                                    )}
                                    {order.order_status === 'ready' && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.order_id, 'completed')}
                                            className="w-full h-11 bg-emerald-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                                        >
                                            Mark Served
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Detailed Order Modal */}
                {selectedOrder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div 
                            className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button - Standard Position */}
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center hover:bg-neutral-100 transition-colors z-20 group"
                            >
                                <XCircle className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900" />
                            </button>

                            {/* Modal Header */}
                            <div className="px-8 pt-10 pb-8 border-b border-neutral-100">
                                <h3 className="text-3xl font-black text-neutral-900 tracking-tight mb-4">{selectedOrder.customer_name}</h3>
                                <div className="flex flex-wrap items-center gap-y-3 gap-x-6">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-1">Time</span>
                                        <div className="flex items-center gap-1.5 text-xs font-black text-neutral-600">
                                            <Clock className="w-3.5 h-3.5 text-neutral-300" />
                                            <span>{new Date(selectedOrder.order_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-neutral-100 hidden sm:block" />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-1">Table</span>
                                        <div className="text-xs font-black text-neutral-900">Table #{selectedOrder.table_number || '??'}</div>
                                    </div>
                                    <div className="w-px h-8 bg-neutral-100 hidden sm:block" />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-1">Order ID</span>
                                        <div className="text-xs font-black text-neutral-400 tracking-wider">#{selectedOrder.short_id}</div>
                                    </div>
                                    <div className="w-px h-8 bg-neutral-100 hidden sm:block" />
                                    <div>
                                        <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-1 block">Status</span>
                                        <span className={clsx(
                                            "text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border tracking-widest inline-block",
                                            getStatusStyle(selectedOrder.order_status)
                                        )}>{selectedOrder.order_status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body - Full Items List */}
                            <div className="px-8 py-8 max-h-[50vh] overflow-y-auto no-scrollbar bg-neutral-50/30">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Items Breakdown</span>
                                        <span className="text-[10px] font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md">{selectedOrder.items.length} Total</span>
                                    </div>
                                    {selectedOrder.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-neutral-100 shadow-sm hover:border-neutral-200 transition-all group/item">
                                            <div className="w-14 h-14 rounded-2xl bg-neutral-50 overflow-hidden flex items-center justify-center shrink-0 border border-neutral-100 group-hover/item:scale-105 transition-transform">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UtensilsCrossed className="w-5 h-5 text-neutral-200" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-neutral-800 leading-none mb-1.5">{item.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md leading-none uppercase tracking-tighter">{item.quantity}x</span>
                                                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">Quantity</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Footer - Simplified Actions */}
                            <div className="px-8 py-8 border-t border-neutral-100 flex items-center justify-center">
                                <button 
                                    onClick={() => setSelectedOrder(null)}
                                    className="w-full h-14 bg-neutral-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-xl shadow-black/10 active:scale-95"
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {filteredOrders.length === 0 && (
                    <div className="py-32 text-center space-y-6 bg-white rounded-[2.5rem] border-2 border-dashed border-neutral-50 shadow-sm">
                        <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto">
                            <History className="w-10 h-10 text-neutral-200" />
                        </div>
                        <div>
                            <p className="text-neutral-900 font-black uppercase tracking-[0.2em] text-sm">No orders found</p>
                            <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mt-1">Try adjusting your filters or search</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination (Admin Style) */}
            <div className="flex items-center justify-between pt-8">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Page <span className="text-gray-900">{currentPage}</span>
                </p>
                <div className="flex gap-2">
                    <button
                        disabled={currentPage <= 1}
                        onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('page', (currentPage - 1).toString());
                            router.push(`?${params.toString()}`);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Prev
                    </button>
                    <button
                        disabled={!hasMore}
                        onClick={() => {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('page', (currentPage + 1).toString());
                            router.push(`?${params.toString()}`);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
