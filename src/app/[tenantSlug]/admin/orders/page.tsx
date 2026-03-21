'use client';

import { useStore } from '@/context/StoreContext';
import { useOrders } from '@/context/OrderContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    CheckCircle2,
    ChefHat,
    AlertCircle,
    ArrowRight,
    X,
    User,
    ListFilter,
    Search,
    SearchX,
    ChevronRight,
    Zap
} from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState, useRef } from 'react';
import { QRScannerModal } from '@/components/admin/QRScannerModal';

type TabStatus = 'received' | 'preparing' | 'ready';

export default function AdminOrdersPage() {
    const { orders } = useOrders();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState<TabStatus>('received');
    const [searchQuery, setSearchQuery] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

     
    const getTimeElapsed = (startTime: string) => {
        const start = new Date(startTime).getTime();
        const now = currentTime.getTime();
        const diffInMinutes = Math.floor((now - start) / 60000);

        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours}h ${diffInMinutes % 60}m ago`;
    };

    const activeOrders = orders.filter(o => ['received', 'preparing', 'ready'].includes(o.order_status));
    
    const filteredOrders = activeOrders.filter(o => {
        const query = searchQuery.toLowerCase();
        return (
            o.short_id.toLowerCase().includes(query) ||
            o.customer_name.toLowerCase().includes(query) ||
            o.customer_mobile.toLowerCase().includes(query) ||
            o.items.some(item => item.name.toLowerCase().includes(query))
        );
    });

    const receivedCount = activeOrders.filter(o => o.order_status === 'received').length;
    const preparingCount = activeOrders.filter(o => o.order_status === 'preparing').length;
    const readyCount = activeOrders.filter(o => o.order_status === 'ready').length;

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Kitchen Display</h1>
                    <p className="text-gray-500 text-sm md:text-base">Real-time order management</p>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
                    <input 
                        ref={searchRef}
                        type="text" 
                        placeholder="Search ID or name (Press /)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3 text-gray-400" />
                        </button>
                    )}
                </div>

                <button 
                    onClick={() => setIsScannerOpen(true)}
                    className="h-[50px] px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0 w-full md:w-auto justify-center"
                >
                    <span className="text-lg">📸</span> 
                    Scan & Verify QR
                </button>
            </header>

            { }
            <div className="md:hidden flex bg-gray-100 p-1 rounded-xl mb-4">
                {(['received', 'preparing', 'ready'] as const).map((tab) => {
                    const count = tab === 'received' ? receivedCount : tab === 'preparing' ? preparingCount : readyCount;
                    const isActive = activeTab === tab;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all flex items-center justify-center gap-2",
                                isActive ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {tab}
                            {count > 0 && (
                                <span className={clsx(
                                    "px-1.5 py-0.5 rounded-full text-[10px]",
                                    isActive ? "bg-black text-white" : "bg-gray-200 text-gray-600"
                                )}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            { }
            <div className="flex-1 overflow-hidden min-h-[500px] md:min-h-[600px] md:grid md:grid-cols-3 gap-6">

                { }

                <div className={clsx("h-[calc(100vh-250px)] md:h-[calc(100vh-180px)]", activeTab === 'received' ? 'block' : 'hidden md:block')}>
                    <KanbanColumn
                        title="Received"
                        count={receivedCount}
                        color="yellow"
                        icon={AlertCircle}
                    >
                        {filteredOrders.filter(o => o.order_status === 'received').map(order => (
                            <OrderCard
                                key={order.order_id}
                                order={order}
                                nextStatus="preparing"
                                timeElapsed={getTimeElapsed(order.order_time)}
                                accentColor="yellow"
                            />
                        ))}
                    </KanbanColumn>
                </div>

                <div className={clsx("h-[calc(100vh-250px)] md:h-[calc(100vh-180px)]", activeTab === 'preparing' ? 'block' : 'hidden md:block')}>
                    <KanbanColumn
                        title="Preparing"
                        count={preparingCount}
                        color="orange"
                        icon={ChefHat}
                    >
                        {filteredOrders.filter(o => o.order_status === 'preparing').map(order => (
                            <OrderCard
                                key={order.order_id}
                                order={order}
                                nextStatus="ready"
                                timeElapsed={getTimeElapsed(order.order_time)}
                                accentColor="orange"
                            />
                        ))}
                    </KanbanColumn>
                </div>

                <div className={clsx("h-[calc(100vh-250px)] md:h-[calc(100vh-180px)]", activeTab === 'ready' ? 'block' : 'hidden md:block')}>
                    <KanbanColumn
                        title="Ready to Serve"
                        count={readyCount}
                        color="green"
                        icon={CheckCircle2}
                    >
                        {filteredOrders.filter(o => o.order_status === 'ready').map(order => (
                            <OrderCard
                                key={order.order_id}
                                order={order}
                                nextStatus="completed"
                                timeElapsed={getTimeElapsed(order.order_time)}
                                accentColor="green"
                            />
                        ))}
                    </KanbanColumn>
                </div>

            </div>

            <QRScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
            />
        </div>
    );
}

function KanbanColumn({ title, count, children, color, icon: Icon }: any) {
    const headerColors = {
        yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
        orange: 'bg-orange-50 text-orange-900 border-orange-200',
        green: 'bg-green-50 text-green-900 border-green-200',
    } as any;

    return (
        <div className="flex flex-col h-full bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
            <div className={`p-4 border-b ${headerColors[color]} flex justify-between items-center sticky top-0 bg-opacity-95 backdrop-blur-sm z-10`}>
                <div className="flex items-center gap-2 font-bold">
                    <Icon className="w-5 h-5" />
                    {title}
                </div>
                <span className="bg-white/50 px-2.5 py-0.5 rounded-full text-sm font-bold min-w-[24px] text-center">
                    {count}
                </span>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-hide">
                {children}
                {count === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm italic">
                        No orders in this stage
                    </div>
                )}
            </div>
        </div>
    )
}

function OrderCard({ order, nextStatus, timeElapsed, accentColor }: any) {
    const { updateOrderStatus } = useOrders();

    const colors = "border-neutral-100 hover:border-neutral-200";

    const isDelayed = (() => {
        const start = new Date(order.order_time).getTime();
        const diffInMinutes = Math.floor((new Date().getTime() - start) / 60000);
        return diffInMinutes > 15;
    })();

     
    let buttonText = `Move to ${nextStatus}`;
    let buttonClass = 'bg-black text-white hover:bg-neutral-800';
    if (nextStatus === 'completed') {
        buttonText = 'Mark Completed';
        buttonClass = 'bg-green-600 text-white hover:bg-green-700';
    }

    return (
        <motion.div
            layout
            className={clsx(
                "bg-white p-4 rounded-3xl border border-neutral-100/80 flex flex-col gap-4 group hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] transition-all duration-500 font-inter",
                isDelayed && order.order_status !== 'ready' && "border-amber-200/60 bg-amber-50/10"
            )}
        >
            { }
            <div className="flex justify-between items-center text-[10px] font-bold tracking-tight">
                <span className="text-neutral-300 font-black uppercase tracking-[0.2em]">#{order.short_id}</span>
                <div className="flex items-center gap-1.5 text-neutral-400 bg-neutral-50/50 px-2 py-0.5 rounded-full border border-neutral-100/50">
                    <Clock className="w-3 h-3" />
                    {timeElapsed}
                </div>
            </div>

            { }
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center border border-neutral-100 text-neutral-400">
                    <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h4 className="text-[16px] font-extrabold text-neutral-900 tracking-tight leading-tight">{order.customer_name}</h4>
                    <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mt-0.5">Dine-in</p>
                </div>
                {isDelayed && order.order_status !== 'ready' && (
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 animate-pulse">
                        <Zap className="w-3.5 h-3.5 fill-amber-600" />
                    </div>
                )}
            </div>

            { }
            <div className="space-y-3 py-1">
                <div className="border-t border-dashed border-neutral-100 pt-3" />
                {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex items-start gap-2.5">
                                <div className="w-5 h-5 rounded-md bg-neutral-50 border border-neutral-100 flex items-center justify-center text-[10px] font-black text-neutral-900 flex-shrink-0">
                                    {item.quantity}
                                </div>
                                <span className="text-[14px] font-bold text-neutral-700 leading-snug">{item.name}</span>
                            </div>
                            <span className="text-[14px] font-black text-neutral-900">₹{item.price * item.quantity}</span>
                        </div>
                        { }
                        {item.customizations && item.customizations.length > 0 && (
                            <div className="ml-7.5 flex flex-wrap gap-1.5">
                                {item.customizations.map((c: any, idx: number) => (
                                    <span key={idx} className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                                        • {c.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            { }
            {order.order_note && (
                <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-100/50">
                    <p className="text-[10px] text-neutral-300 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <ArrowRight className="w-2.5 h-2.5" /> Note
                    </p>
                    <p className="text-[12px] text-neutral-600 font-medium italic leading-relaxed">
                        "{order.order_note}"
                    </p>
                </div>
            )}

            { }
            <div className="mt-2 space-y-3">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-neutral-200 uppercase tracking-widest">Total</span>
                    <span className="text-[17px] font-black text-neutral-900 tracking-tighter">₹{order.total_amount}</span>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => updateOrderStatus(order.order_id, nextStatus)}
                        className={clsx(
                            "flex-1 h-11 rounded-2xl font-bold text-[13px] tracking-tight transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/5 active:scale-95",
                            nextStatus === 'completed' 
                                ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                                : "bg-neutral-900 text-white hover:bg-neutral-800"
                        )}
                    >
                        {buttonText}
                        {nextStatus !== 'completed' && <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    {order.order_status === 'received' && (
                        <button
                            onClick={() => {
                                if (confirm('Cancel this order?')) updateOrderStatus(order.order_id, 'cancelled');
                            }}
                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 border border-neutral-100 transition-all active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
