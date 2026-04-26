'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { useOrders } from '@/context/OrderContext';
import Link from 'next/link';
import clsx from 'clsx';
import {
    IndianRupee,
    ShoppingBag,
    ChefHat,
    CheckCircle2,
    TrendingUp,
    Clock,
    ArrowRight,
    Zap,
    Crown,
    Shield,
    QrCode,
    History,
    Calendar
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { getStoreAnalytics } from '@/app/actions/orders';
import { useEffect } from 'react';

export default function AdminDashboard() {
    const { tenant } = useStore();
    const { orders } = useOrders();
    const [analytics, setAnalytics] = useState<any>(null);
    const params = useParams();
    const tenantSlug = params.tenantSlug as string;
    const [timeframe, setTimeframe] = useState('all');

    useEffect(() => {
        if (tenant?.id) {
            console.log("AdminDashboard: Fetching analytics for", tenant.id);
            getStoreAnalytics(tenant.id).then(res => {
                if (res.success) {
                    console.log("AdminDashboard: Analytics loaded", res.data);
                    setAnalytics(res.data);
                } else {
                    console.error("AdminDashboard: Analytics failed", res.error);
                }
            });
        }
    }, [tenant?.id, orders.length]); 

    const tierConfig = {
        free: { name: 'Free Plan', color: 'text-neutral-400 bg-white/5 border-white/5', icon: Zap },
        pro: { name: 'Pro Plan', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: Crown },
        enterprise: { name: 'Enterprise', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: Shield }
    } as any;

    const currentTier = (tenant?.tier || 'free') as keyof typeof tierConfig;
    const TierIcon = tierConfig[currentTier].icon;

     
    const filteredOrders = useMemo(() => {
        if (timeframe === 'all') return orders;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return orders.filter(o => {
            const orderDate = new Date(o.order_time);
            if (timeframe === 'today') {
                return orderDate >= startOfToday;
            }
            if (timeframe === 'yesterday') {
                const yesterday = new Date(startOfToday);
                yesterday.setDate(yesterday.getDate() - 1);
                return orderDate >= yesterday && orderDate < startOfToday;
            }
            if (timeframe === '7d') {
                const sevenDaysAgo = new Date(startOfToday);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return orderDate >= sevenDaysAgo;
            }
            if (timeframe === '30d') {
                const thirtyDaysAgo = new Date(startOfToday);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return orderDate >= thirtyDaysAgo;
            }
            return true;
        });
    }, [orders, timeframe]);

    const totalRevenue = filteredOrders
        .filter(o => o.order_status === 'completed')
        .reduce((sum, o) => sum + o.total_amount, 0);

    const preparingCount = filteredOrders.filter(o => o.order_status === 'preparing').length;
    const completedCount = filteredOrders.filter(o => o.order_status === 'completed').length;
    const averageOrderValue = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;

     
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost:3000';
    const baseHost = baseDomain.split(':')[0];
    const isSubdomain = typeof window !== 'undefined' && 
                       (window.location.hostname.endsWith('.' + baseHost) || 
                        (window.location.hostname !== baseHost && window.location.hostname.includes(baseHost)));

    const getLink = (path: string) => {
        if (isSubdomain) return path;  
        return `/${tenantSlug}${path}`;  
    };

     
    const sortedOrders = useMemo(() => {
        return [...filteredOrders].sort((a, b) => 
            new Date(b.order_time).getTime() - new Date(a.order_time).getTime()
        );
    }, [filteredOrders]);

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    }

    const timeframeOptions = [
        { id: 'all', label: 'All Time' },
        { id: 'today', label: 'Today' },
        { id: 'yesterday', label: 'Yesterday' },
        { id: '7d', label: 'Last 7 Days' },
        { id: '30d', label: 'Last 30 Days' },
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            { }
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border",
                        tierConfig[currentTier].color
                    )}>
                        <TierIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold text-gray-900">{getTimeGreeting()}, Chef!</h1>
                            <span className={clsx(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border",
                                tierConfig[currentTier].color
                            )}>
                                {tierConfig[currentTier].name}
                            </span>
                        </div>
                        <p className="text-gray-500 mt-1">Here's what's happening in your food truck.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-gray-600">Kitchen is Live</span>
                </div>
            </header>

            { }
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
                    {timeframeOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setTimeframe(option.id)}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                timeframe === option.id
                                    ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <div className="ml-auto hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <Calendar size={14} className="text-gray-300" />
                    {timeframe === 'all' ? 'Showing complete records' : `Showing records for: ${timeframe}`}
                </div>
            </div>

            { }
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Total Revenue"
                    value={analytics ? `₹${analytics.totalRevenue.toLocaleString()}` : '...'}
                    icon={IndianRupee}
                    trend={analytics ? "+12% from yesterday" : "Loading..."}
                    color="green"
                />
                <StatCard
                    title="Total Orders"
                    value={analytics ? analytics.totalOrders.toString() : '...'}
                    icon={ShoppingBag}
                    trend={analytics ? `${analytics.completedCount} completed` : "Loading..."}
                    color="blue"
                />
                <StatCard
                    title="In Kitchen"
                    value={analytics ? analytics.preparingCount.toString() : '...'}
                    icon={ChefHat}
                    trend={analytics ? "Requires attention" : "Loading..."}
                    color="orange"
                />
                <StatCard
                    title="Avg. Order Value"
                    value={analytics && analytics.completedCount > 0 ? `₹${Math.round(analytics.totalRevenue / analytics.completedCount)}` : '...'}
                    icon={TrendingUp}
                    trend={analytics ? "Per customer" : "Loading..."}
                    color="purple"
                />
            </div>

            { }
            <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-8">
                { }
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-gray-900">Recent Orders</h2>
                        <Link href={getLink('/admin/all-orders')} className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedOrders.slice(0, 10).map(order => (
                                    <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-sm text-neutral-900 tracking-wider">#{order.short_id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{order.customer_name}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[10px] font-bold text-gray-400 capitalize">
                                                    {order.order_type === 'DINE_IN' ? `Table ${order.table_number}` : 'Takeaway'}
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-xs text-gray-400">{order.items.length} items</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-1.5">
                                                ₹{order.total_amount}
                                            </div>
                                            {order.payment_status === 'paid' ? (
                                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-50 text-green-600 border border-green-200 uppercase tracking-widest whitespace-nowrap">Paid Online</span>
                                            ) : order.payment_id ? (
                                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-200 uppercase tracking-widest whitespace-nowrap">Payment Pending</span>
                                            ) : (
                                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-widest whitespace-nowrap">
                                                    {order.order_type === 'DINE_IN' ? 'Pay at Counter' : 'Cash on Pickup'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={order.order_status} />
                                        </td>
                                    </tr>
                                ))}
                                {sortedOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                            No orders found for this timeframe.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {sortedOrders.length > 10 && (
                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                            <Link href={getLink('/admin/all-orders')} className="text-xs font-bold text-gray-500 hover:text-green-600 transition-colors">
                                + {sortedOrders.length - 10} more orders in this period
                            </Link>
                        </div>
                    )}
                </div>

                { }
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 text-white text-center">
                        <Clock className="w-8 h-8 mx-auto mb-3 text-green-400" />
                        <h3 className="font-bold text-lg mb-1">Peak Hours</h3>
                        <p className="text-neutral-400 text-sm mb-4">Usually 1:00 PM - 2:00 PM</p>
                        <div className="h-1 w-full bg-neutral-700 rounded-full overflow-hidden">
                            <div className="h-full w-3/4 bg-green-500 rounded-full" />
                        </div>
                        <p className="text-xs text-neutral-500 mt-2 text-right">75% Capacity</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:sticky sm:top-8">
                        <h3 className="font-bold text-gray-900 mb-4">Quick Shortcuts</h3>
                        <div className="space-y-2">
                            <Link href={getLink('/admin/menu')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200 group">
                                <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                                    <ShoppingBag className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-600">Add Menu Item</span>
                            </Link>
                            <Link href={getLink('/admin/qr-generator')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200 group">
                                <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                                    <QrCode className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-600">QR Generator</span>
                            </Link>
                            <Link href={getLink('/admin/orders')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200 group">
                                <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                                    <ChefHat className="w-4 h-4 text-orange-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-600">Manage Kitchen</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
    const colors = {
        green: 'text-green-600 bg-green-50',
        blue: 'text-blue-600 bg-blue-50',
        orange: 'text-orange-600 bg-orange-50',
        purple: 'text-purple-600 bg-purple-50',
    } as any;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={clsx("p-3 rounded-xl", colors[color])}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
            <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mb-1">{trend}</p>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        received: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        preparing: 'bg-orange-100 text-orange-800 border-orange-200',
        ready: 'bg-blue-100 text-blue-800 border-blue-200',
        completed: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-red-50 text-red-600 border-red-100',
    } as any;

    return (
        <span className={clsx(
            "px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide",
            styles[status] || styles.received
        )}>
            {status}
        </span>
    );
}
