'use client';

import { useStore } from '@/context/StoreContext';
import Link from 'next/link';
import {
    IndianRupee,
    ShoppingBag,
    ChefHat,
    CheckCircle2,
    TrendingUp,
    Clock,
    ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
    const { orders } = useStore();

    const today = new Date().toISOString().split('T')[0];
    const todaysOrders = orders.filter(o => o.order_time.startsWith(today));

    const totalRevenue = todaysOrders
        .filter(o => o.order_status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount, 0);

    const preparingCount = todaysOrders.filter(o => o.order_status === 'preparing').length;
    const completedCount = todaysOrders.filter(o => o.order_status === 'completed').length;

    // Calculate Average Order Value
    const activeOrderCount = todaysOrders.filter(o => o.order_status !== 'cancelled').length;
    const averageOrderValue = activeOrderCount > 0 ? Math.round(totalRevenue / activeOrderCount) : 0;

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{getTimeGreeting()}, Chef!</h1>
                    <p className="text-gray-500 mt-1">Here's what's happening in your food truck today.</p>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-gray-600">Kitchen is Live</span>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${totalRevenue.toLocaleString()}`}
                    icon={IndianRupee}
                    trend="+12% from yesterday"
                    color="green"
                />
                <StatCard
                    title="Total Orders"
                    value={todaysOrders.length.toString()}
                    icon={ShoppingBag}
                    trend={`${activeOrderCount} completed`}
                    color="blue"
                />
                <StatCard
                    title="In Kitchen"
                    value={preparingCount.toString()}
                    icon={ChefHat}
                    trend="Requires attention"
                    color="orange"
                />
                <StatCard
                    title="Avg. Order Value"
                    value={`₹${averageOrderValue}`}
                    icon={TrendingUp}
                    trend="Per customer"
                    color="purple"
                />
            </div>

            {/* Recent Orders & Activity Section */}
            <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-8">
                {/* Main Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-gray-900">Recent Orders</h2>
                        <Link href="/admin/orders" className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                            View KDS <ArrowRight className="w-4 h-4" />
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
                                {todaysOrders.slice(0, 5).map(order => (
                                    <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-gray-500">#{order.order_id}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{order.customer_name}</div>
                                            <div className="text-xs text-gray-400">{order.items.length} items</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">₹{order.total_amount}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={order.order_status} />
                                        </td>
                                    </tr>
                                ))}
                                {todaysOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                            No orders yet today. waiting for the first hungry customer!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions / Activity - Moved visually via flex-col on mobile? No, user wants rearranging. I will put this code snippet BEFORE the table for mobile, or use flex-col and order-first. 
                Using flex-col-reverse on the parent `grid` div (which I change to flex on mobile) is a quick win.
                */}
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

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Quick Shortcuts</h3>
                        <div className="space-y-2">
                            <Link href="/admin/menu" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200 group">
                                <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                                    <ShoppingBag className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-600">Add Menu Item</span>
                            </Link>
                            <Link href="/admin/orders" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200 group">
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
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {/* <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+2.5%</span> */}
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
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.received} uppercase tracking-wide`}>
            {status}
        </span>
    );
}
