'use client';

import {
    Search,
    Filter,
    ChevronDown,
    Calendar,
    ArrowLeft,
    Download,
    Clock,
    X,
    ShoppingBag,
    Eye,
    EyeOff,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Order } from '@/types';

interface AdminAllOrdersClientProps {
    tenant: any;
    tenantSlug: string;
    initialOrders: Order[];
    hasMore: boolean;
    currentPage: number;
    totalOrders: number;
}

export default function AdminAllOrdersClient({
    tenant,
    tenantSlug,
    initialOrders,
    hasMore,
    currentPage,
    totalOrders
}: AdminAllOrdersClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showMobile, setShowMobile] = useState(false);

    // Client-side filtering for the current page
    const filteredOrders = useMemo(() => {
        return initialOrders.filter(order => {
            const matchesSearch =
                order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.short_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (order.customer_mobile && order.customer_mobile.includes(searchQuery));

            const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
            const matchesType = typeFilter === 'all' || order.order_type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [initialOrders, searchQuery, statusFilter, typeFilter]);

    const handleExportCSV = () => {
        if (!filteredOrders || filteredOrders.length === 0) return;

        const headers = ['Order ID', 'Date', 'Time', 'Customer Name', 'Customer Mobile', 'Items', 'Total Amount', 'Status', 'Notes'];

        const csvRows = filteredOrders.map(order => {
            const date = new Date(order.order_time).toLocaleDateString();
            const time = new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const itemsStr = order.items && order.items.length > 0
                ? order.items.map((i: any) => `${i.quantity}x ${i.name}`).join('; ')
                : '';

            return [
                order.short_id,
                date,
                time,
                `"${order.customer_name.replace(/"/g, '""')}"`,
                order.customer_mobile || '',
                `"${itemsStr.replace(/"/g, '""')}"`,
                order.total_amount,
                order.order_status,
                `"${(order.order_note || '').replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${tenant?.slug || 'store'}_orders_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            case 'received': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'ready': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handlePageChange = (newPage: number) => {
        router.push(`/${tenantSlug}/admin/all-orders?page=${newPage}`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 min-h-screen bg-neutral-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link
                        href={`/${tenantSlug}/admin`}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm mb-2 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        Order History
                        <span className="text-xs font-bold px-2 py-1 bg-neutral-900 text-white rounded-lg">
                            {totalOrders} Total
                        </span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Full historical log of all transactions for {tenant?.name}.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleExportCSV} disabled={filteredOrders.length === 0} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-xs font-bold text-gray-600 border border-gray-100 shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-green-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search current page..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-neutral-100 rounded-xl h-10 pl-11 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowMobile(!showMobile)}
                        className={clsx(
                            "h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border",
                            showMobile
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-white border-neutral-100 text-neutral-400 hover:text-neutral-600"
                        )}
                    >
                        {showMobile ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showMobile ? "Hide Numbers" : "Show Numbers"}
                    </button>
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none h-10 pl-4 pr-10 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-neutral-100 bg-white text-neutral-600 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm cursor-pointer min-w-[140px]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="received">Received</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="appearance-none h-10 pl-4 pr-10 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-neutral-100 bg-white text-neutral-600 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm cursor-pointer min-w-[140px]"
                        >
                            <option value="all">All Service Types</option>
                            <option value="DINE_IN">Dine In</option>
                            <option value="TAKEAWAY">Takeaway</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="px-8 py-5">Order Details</th>
                            <th className="px-8 py-5">Customer info</th>
                            <th className="px-8 py-5 text-center">Items</th>
                            <th className="px-8 py-5 text-center">Amount</th>
                            <th className="px-8 py-5 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredOrders.map((order) => (
                            <tr key={order.order_id} onClick={() => setSelectedOrder(order)} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                                <td className="px-8 py-6">
                                    <div className="font-bold text-sm text-neutral-900 tracking-wider mb-1">
                                        #{order.short_id}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(order.order_time).toLocaleDateString()}
                                        <Clock className="w-3 h-3 ml-2" />
                                        {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="font-bold text-gray-900 mb-0.5">
                                        {order.customer_name}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-1">
                                        {order.customer_mobile
                                            ? (showMobile ? order.customer_mobile : order.customer_mobile.replace(/.(?=.{4})/g, '*'))
                                            : 'No Mobile'}
                                    </div>
                                    <div className={clsx(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-sm transition-all",
                                        order.order_type === 'DINE_IN'
                                            ? "bg-orange-50 border-orange-100 text-orange-600"
                                            : "bg-blue-50 border-blue-100 text-blue-600"
                                    )}>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                            {order.order_type === 'DINE_IN' ? `Table ${order.table_number || '?'}` : 'Takeaway'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-600">
                                        {order.items?.length || 0}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="font-bold text-xl text-gray-900">₹{order.total_amount}</div>
                                    {order.payment_status === 'paid' ? (
                                        <div className="inline-block mt-1 text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 uppercase tracking-wider font-bold">Paid Online</div>
                                    ) : order.payment_id ? (
                                        <div className="inline-block mt-1 text-[9px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200 uppercase tracking-wider font-bold">Payment Pending</div>
                                    ) : (
                                        <div className="inline-block mt-1 text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wider font-bold">
                                            {order.order_type === 'DINE_IN' ? 'Pay at Counter' : 'Cash on Pickup'}
                                        </div>
                                    )}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <span className={clsx(
                                        "px-3 py-1 rounded-full text-xs font-bold border shadow-sm uppercase tracking-wide",
                                        getStatusStyle(order.order_status)
                                    )}>
                                        {order.order_status}
                                    </span>
                                </td>
                            </tr>
                        ))}

                        {filteredOrders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-8 py-24 text-center">
                                    <div className="text-neutral-600 italic text-sm mb-4">No matching orders found on this page.</div>
                                    <button
                                        onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                                        className="text-xs font-bold uppercase tracking-wider text-green-500 hover:text-green-400 transition-colors underline underline-offset-4"
                                    >
                                        Clear search
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Server-Side Pagination Controls */}
            <div className="flex items-center justify-between text-neutral-500 text-[10px] font-bold uppercase tracking-wider px-4 py-2 bg-white rounded-2xl border border-neutral-100 shadow-sm mt-4">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Viewing Page {currentPage}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={clsx(
                            "flex items-center gap-1 px-4 py-2 rounded-xl border transition-all font-black uppercase tracking-widest text-[9px]",
                            currentPage === 1
                                ? "bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed"
                                : "bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50 active:scale-95 shadow-sm"
                        )}
                    >
                        <ChevronLeft className="w-3 h-3" /> Previous
                    </button>

                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-900 text-white font-mono text-xs shadow-lg shadow-neutral-900/20">
                        {currentPage}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasMore}
                        className={clsx(
                            "flex items-center gap-1 px-4 py-2 rounded-xl border transition-all font-black uppercase tracking-widest text-[9px]",
                            !hasMore
                                ? "bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed"
                                : "bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50 active:scale-95 shadow-sm"
                        )}
                    >
                        Next <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Order Details Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                        onClick={() => setSelectedOrder(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Content - Reusing the same beautiful design */}
                            <div className="flex justify-between items-center p-6 border-b border-neutral-100 bg-white">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2 tracking-tight">
                                            <ShoppingBag className="w-5 h-5 text-neutral-400" />
                                            Order #{selectedOrder.short_id}
                                        </h3>
                                        <span className={clsx(
                                            "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                                            selectedOrder.order_type === 'DINE_IN' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-orange-50 text-orange-600 border-orange-100"
                                        )}>
                                            {selectedOrder.order_type === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-500 mt-1 font-medium italic">
                                        {new Date(selectedOrder.order_time).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-50 text-neutral-500 hover:bg-neutral-100 transition-colors border border-neutral-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 bg-neutral-50/50 space-y-4">
                                {/* Customer & Items section - matching the previous high-end UI */}
                                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                                    <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-4">Customer Info</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 border border-green-100 flex items-center justify-center font-bold text-lg">
                                            {selectedOrder.customer_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-neutral-900 text-base">{selectedOrder.customer_name}</p>
                                            <p className="text-sm text-neutral-500 font-medium">
                                                {selectedOrder.customer_mobile
                                                    ? (showMobile ? selectedOrder.customer_mobile : selectedOrder.customer_mobile.replace(/.(?=.{4})/g, '*'))
                                                    : 'No Mobile'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                                    <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-4">Order Items</h4>
                                    <div className="space-y-4">
                                        {selectedOrder.items && selectedOrder.items.map((item: any, idx: number) => (
                                            <div key={idx} className="py-4 border-b border-neutral-50 last:border-0 last:pb-0">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-start gap-4">
                                                        <span className="mt-1 w-8 h-8 rounded-lg bg-neutral-100 text-xs font-bold flex items-center justify-center text-neutral-600 border border-neutral-200 flex-shrink-0">
                                                            {item.quantity}x
                                                        </span>
                                                        <div className="space-y-1">
                                                            <span className="font-bold text-neutral-800 text-[15px]">{item.name}</span>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-neutral-900 text-[15px] mt-1">₹{item.price * item.quantity}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-neutral-100 bg-white flex justify-between items-center h-28">
                                <div>
                                    <p className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider mb-1">Total Amount</p>
                                    <p className="text-3xl font-bold text-neutral-900 tracking-tighter">₹{selectedOrder.total_amount}</p>
                                </div>
                                <span className={clsx(
                                    "px-6 py-2.5 rounded-xl text-xs font-bold border shadow-sm uppercase tracking-wider",
                                    getStatusStyle(selectedOrder.order_status)
                                )}>
                                    {selectedOrder.order_status}
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
