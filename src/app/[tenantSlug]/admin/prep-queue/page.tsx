'use client';

import { useOrders } from '@/context/OrderContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChefHat, 
    Layers, 
    Clock, 
    ArrowRight, 
    PackageOpen,
    Search,
    X,
    ClipboardList
} from 'lucide-react';
import { useState, useMemo } from 'react';
import clsx from 'clsx';

export default function PrepQueuePage() {
    const { orders } = useOrders();
    const [searchQuery, setSearchQuery] = useState('');

    // Filter for active items only (Received or Preparing)
    const activeOrders = useMemo(() => 
        orders.filter(o => ['received', 'preparing'].includes(o.order_status)),
    [orders]);

    // Aggregate items across all active orders
    const prepItems = useMemo(() => {
        const aggregation: Record<string, any> = {};

        activeOrders.forEach(order => {
            order.items.forEach(item => {
                const customizationKey = JSON.stringify(item.customizations || []);
                const key = `${item.name}-${customizationKey}`;

                if (!aggregation[key]) {
                    aggregation[key] = {
                        name: item.name,
                        image_url: item.image_url,
                        customizations: item.customizations || [],
                        totalQuantity: 0,
                        orders: []
                    };
                }
                aggregation[key].totalQuantity += item.quantity;
                aggregation[key].orders.push({
                    shortId: order.short_id,
                    orderId: order.order_id,
                    status: order.order_status
                });
            });
        });

        return Object.values(aggregation).sort((a, b) => b.totalQuantity - a.totalQuantity);
    }, [activeOrders]);

    const filteredItems = prepItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 h-full flex flex-col bg-[#FAFAF8] min-h-screen">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 tracking-[-0.03em] flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                            <Layers className="w-6 h-6 text-white" />
                        </div>
                        Prep Queue
                    </h1>
                    <p className="text-neutral-400 font-medium mt-1">Consolidated item summary for the kitchen</p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search items to prepare..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-10 py-4 bg-white border border-neutral-200/50 rounded-2xl outline-none focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-50 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3 text-neutral-400" />
                        </button>
                    )}
                </div>
            </header>

            {/* Statistics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard 
                    label="Total Items to Prep" 
                    value={prepItems.reduce((acc, item) => acc + item.totalQuantity, 0)} 
                    icon={ChefHat}
                    color="emerald"
                />
                <StatCard 
                    label="Unique Items" 
                    value={prepItems.length} 
                    icon={Layers}
                    color="blue"
                />
                <StatCard 
                    label="Active Orders" 
                    value={activeOrders.length} 
                    icon={ClipboardList}
                    color="orange"
                />
                <StatCard 
                    label="Pending Received" 
                    value={activeOrders.filter(o => o.order_status === 'received').length} 
                    icon={Clock}
                    color="amber"
                />
            </div>

            {/* Aggregated List */}
            <div className="flex-1 flex flex-col">
                {filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item, idx) => (
                                <motion.div
                                    key={`${item.name}-${idx}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white p-5 rounded-3xl border border-neutral-200/50 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col gap-4"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4 flex-1">
                                            {/* Compact Image */}
                                            <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 overflow-hidden flex-shrink-0 shadow-sm">
                                                {item.image_url ? (
                                                    <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-2xl">
                                                        🍜
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-[17px] font-black text-neutral-900 tracking-tight leading-tight truncate">
                                                    {item.name}
                                                </h3>
                                                {item.customizations?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {item.customizations.map((c: any, i: number) => (
                                                            <span key={i} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/50">
                                                                {c.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Refined Quantity Badge */}
                                        <div className="flex flex-col items-center justify-center p-2 bg-neutral-900 text-white rounded-2xl min-w-[56px] shadow-lg shadow-black/10">
                                            <span className="text-[18px] font-black leading-none">{item.totalQuantity}</span>
                                            <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5 opacity-60">QTY</span>
                                        </div>
                                    </div>

                                    {/* Order IDs Row - More Compact */}
                                    <div className="pt-3 border-t border-neutral-50 flex items-center justify-between">
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            <div className="flex items-center gap-1.5 mr-1">
                                                <PackageOpen className="w-3.5 h-3.5 text-neutral-400" />
                                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Waiting Orders:</span>
                                            </div>
                                            {item.orders.slice(0, 5).map((o: any, i: number) => (
                                                <span key={i} className="text-[10px] font-bold text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-lg border border-neutral-100/50">
                                                    #{o.shortId}
                                                </span>
                                            ))}
                                            {item.orders.length > 5 && (
                                                <span className="text-[9px] font-bold text-neutral-300">+{item.orders.length - 5} more</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="flex flex-col items-center text-center"
                        >
                            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-neutral-200/50 flex items-center justify-center mb-8">
                                <PackageOpen className="w-10 h-10 text-neutral-200" />
                            </div>
                            <h2 className="text-2xl font-black text-neutral-900 tracking-tight mb-2">Queue is Clear!</h2>
                            <p className="text-neutral-400 max-w-sm font-medium leading-relaxed">
                                No items require preparation at the moment. High five to the kitchen team! 👋
                            </p>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    const colorStyles = {
        emerald: "text-emerald-500 bg-emerald-50 border-emerald-100",
        blue: "text-blue-500 bg-blue-50 border-blue-100",
        orange: "text-orange-500 bg-orange-50 border-orange-100",
        amber: "text-amber-500 bg-amber-50 border-amber-100",
    } as any;

    return (
        <div className="bg-white p-5 rounded-[2rem] border border-neutral-200/50 shadow-sm flex items-center gap-4">
            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center border", colorStyles[color])}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-2xl font-black text-neutral-900 tracking-tight">{value}</p>
            </div>
        </div>
    );
}
