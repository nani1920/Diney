'use client';

import { useStore } from '@/context/StoreContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    CheckCircle2,
    ChefHat,
    AlertCircle,
    ArrowRight,
    X,
    User,
    ListFilter
} from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

type TabStatus = 'received' | 'preparing' | 'ready';

export default function AdminOrdersPage() {
    const { orders } = useStore();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState<TabStatus>('received');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Function to calculate time elapsed
    const getTimeElapsed = (startTime: string) => {
        const start = new Date(startTime).getTime();
        const now = currentTime.getTime();
        const diffInMinutes = Math.floor((now - start) / 60000);

        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const hours = Math.floor(diffInMinutes / 60);
        return `${hours}h ${diffInMinutes % 60}m ago`;
    };

    const activeOrders = orders.filter(o => ['received', 'preparing', 'ready'].includes(o.order_status));
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
            </header>

            {/* Mobile Tabs */}
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

            {/* Content Render */}
            <div className="flex-1 overflow-hidden min-h-[600px] md:grid md:grid-cols-3 gap-6">

                {/* Desktop: Show all columns. Mobile: Show only active tab */}

                <div className={clsx("h-full", activeTab === 'received' ? 'block' : 'hidden md:block')}>
                    <KanbanColumn
                        title="Received"
                        count={receivedCount}
                        color="yellow"
                        icon={AlertCircle}
                    >
                        {activeOrders.filter(o => o.order_status === 'received').map(order => (
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

                <div className={clsx("h-full", activeTab === 'preparing' ? 'block' : 'hidden md:block')}>
                    <KanbanColumn
                        title="Preparing"
                        count={preparingCount}
                        color="orange"
                        icon={ChefHat}
                    >
                        {activeOrders.filter(o => o.order_status === 'preparing').map(order => (
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

                <div className={clsx("h-full", activeTab === 'ready' ? 'block' : 'hidden md:block')}>
                    <KanbanColumn
                        title="Ready to Serve"
                        count={readyCount}
                        color="green"
                        icon={CheckCircle2}
                    >
                        {activeOrders.filter(o => o.order_status === 'ready').map(order => (
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
            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                <AnimatePresence mode='popLayout'>
                    {children}
                </AnimatePresence>
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
    const { updateOrderStatus } = useStore();

    const colors = {
        yellow: 'border-yellow-200 hover:border-yellow-300',
        orange: 'border-orange-200 hover:border-orange-300',
        green: 'border-green-200 hover:border-green-300',
    } as any;

    // Determine button text and style
    let buttonText = `Move to ${nextStatus}`;
    let buttonClass = 'bg-black text-white hover:bg-neutral-800';
    if (nextStatus === 'completed') {
        buttonText = 'Mark Completed';
        buttonClass = 'bg-green-600 text-white hover:bg-green-700';
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white p-4 rounded-xl shadow-sm border ${colors[accentColor]} flex flex-col gap-3 group transition-all`}
        >
            <div className="flex justify-between items-start">
                <span className="font-mono font-bold text-lg bg-gray-50 px-2 py-0.5 rounded text-gray-700">
                    #{order.order_id}
                </span>
                <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeElapsed}
                </span>
            </div>

            <div className="py-2 border-b border-gray-50">
                <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{order.customer_name}</span>
                </div>
            </div>

            <div className="space-y-2">
                {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm items-start">
                        <span className="text-gray-700">
                            <span className="font-bold text-gray-900 mr-2">{item.quantity}x</span>
                            {item.name}
                        </span>
                    </div>
                ))}
            </div>

            {order.order_note && (
                <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded-lg mt-1 font-medium border border-yellow-100">
                    "{order.order_note}"
                </div>
            )}

            <div className="pt-3 mt-1 flex gap-2">
                <button
                    onClick={() => updateOrderStatus(order.order_id, nextStatus)}
                    className={`flex-1 ${buttonClass} text-sm py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
                >
                    {buttonText} {nextStatus !== 'completed' && <ArrowRight className="w-4 h-4" />}
                </button>

                {order.order_status === 'received' && (
                    <button
                        onClick={() => {
                            if (confirm('Cancel this order?')) updateOrderStatus(order.order_id, 'cancelled');
                        }}
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Cancel Order"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
