'use client';

import { useStore } from '@/context/StoreContext';
import { useOrders } from '@/context/OrderContext';
import { 
    Search, 
    Filter, 
    ChevronDown, 
    Calendar,
    ArrowLeft,
    Download,
    Clock,
    X,
    User,
    ShoppingBag
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AllOrdersPage() {
    const { tenant } = useStore();
    const { orders } = useOrders();
    const params = useParams();
    const tenantSlug = params.tenantSlug as string;
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const ITEMS_PER_PAGE = 10;

     
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = 
                order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.short_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (order.customer_mobile && order.customer_mobile.includes(searchQuery));
            
            const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
            
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.order_time).getTime() - new Date(a.order_time).getTime());
    }, [orders, searchQuery, statusFilter]);

     
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredOrders, currentPage]);

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

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            { }
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link 
                        href={`/${tenantSlug}/admin`}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm mb-2 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
                    <p className="text-gray-500 text-sm mt-1">Full historical log of all transactions for {tenant?.name}.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleExportCSV} disabled={filteredOrders.length === 0} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-xs font-bold text-gray-600 border border-gray-100 shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            { }
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-green-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search by Name, Order ID, or Phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-neutral-100 rounded-xl h-10 pl-11 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500/10 focus:border-green-500 transition-all shadow-sm"
                    />
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {['all', 'received', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={clsx(
                                "px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all h-10 flex items-center justify-center min-w-[80px]",
                                statusFilter === status 
                                    ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20 scale-105" 
                                    : "bg-white border-neutral-100 text-neutral-400 hover:border-neutral-200 hover:text-neutral-600 shadow-sm hover:translate-y-[-1px]"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            { }
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
                        {paginatedOrders.map((order) => (
                            <tr key={order.order_id} onClick={() => setSelectedOrder(order)} className="hover:bg-gray-50 transition-colors group cursor-pointer">
                                <td className="px-8 py-6">
                                    <div className="font-black text-sm text-neutral-900 tracking-[0.2em] mb-1">
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
                                    <div className="text-xs text-gray-500">
                                        {order.customer_mobile || 'No Mobile'}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-600">
                                        {order.items.length}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center font-bold text-xl text-gray-900">
                                    ₹{order.total_amount}
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
                                    <div className="text-neutral-600 italic text-sm mb-4">No matching orders found in your history.</div>
                                    <button 
                                        onClick={() => {setSearchQuery(''); setStatusFilter('all');}}
                                        className="text-xs font-black uppercase tracking-widest text-green-500 hover:text-green-400 transition-colors underline underline-offset-4"
                                    >
                                        Clear all filters
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            { }
            {filteredOrders.length > 0 && (
                <div className="flex items-center justify-between text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-white rounded-2xl border border-neutral-100 shadow-sm mt-4">
                    <div>
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
                    </div>
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={clsx(
                                "transition-all font-black uppercase tracking-[0.2em]",
                                currentPage === 1 ? "opacity-30 cursor-not-allowed" : "hover:text-black text-neutral-400"
                            )}
                        >
                            Previous
                        </button>
                        <div className="text-neutral-900 font-black">
                            {currentPage} / {totalPages || 1}
                        </div>
                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={clsx(
                                "transition-all font-black uppercase tracking-[0.2em]",
                                (currentPage === totalPages || totalPages === 0) ? "opacity-30 cursor-not-allowed" : "hover:text-black text-neutral-400"
                            )}
                        >
                            Next Page
                        </button>
                    </div>
                </div>
            )}

            { /* Order Details Modal */ }
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
                            <div className="flex justify-between items-center p-6 border-b border-neutral-100 bg-white">
                                <div>
                                    <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2 tracking-tight">
                                        <ShoppingBag className="w-5 h-5 text-neutral-400" />
                                        Order #{selectedOrder.short_id}
                                    </h3>
                                    <p className="text-sm text-neutral-500 mt-1 font-medium">
                                        {new Date(selectedOrder.order_time).toLocaleString()}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setSelectedOrder(null)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-50 text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-colors border border-neutral-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 bg-neutral-50/50 space-y-4">
                                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                                    <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">Customer Info</h4>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 border border-green-100 flex items-center justify-center font-bold text-lg">
                                            {selectedOrder.customer_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-neutral-900 text-base">{selectedOrder.customer_name}</p>
                                            <p className="text-sm text-neutral-500 font-medium">{selectedOrder.customer_mobile || 'No Mobile'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                                    <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">Order Items</h4>
                                    <div className="space-y-4">
                                        {selectedOrder.items && selectedOrder.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center py-3 border-b border-neutral-50 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-7 h-7 rounded-lg bg-neutral-100 text-xs font-bold flex items-center justify-center text-neutral-600 border border-neutral-200">
                                                        {item.quantity}x
                                                    </span>
                                                    <span className="font-bold text-neutral-800 text-[15px]">{item.name}</span>
                                                </div>
                                                <span className="font-black text-neutral-900 text-[15px]">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                        {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                                            <p className="text-sm text-neutral-400 italic font-medium">No items were saved for this older order.</p>
                                        )}
                                    </div>
                                </div>
                                
                                {selectedOrder.order_note && (
                                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
                                        <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-[0.2em] mb-2">Order Note</h4>
                                        <p className="text-sm text-amber-900 font-medium italic">"{selectedOrder.order_note}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-neutral-100 bg-white flex justify-between items-center h-24">
                                <div>
                                    <p className="text-[11px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-1">Total Amount</p>
                                    <p className="text-3xl font-black text-neutral-900 tracking-tighter">₹{selectedOrder.total_amount}</p>
                                </div>
                                <span className={clsx(
                                    "px-6 py-2.5 rounded-xl text-xs font-black border shadow-sm uppercase tracking-widest",
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

 
