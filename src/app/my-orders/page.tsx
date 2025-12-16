'use client';

import { useStore } from '@/context/StoreContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function MyOrdersPage() {
    const { orders, addToCart } = useStore();
    const [mobileFilter, setMobileFilter] = useState('');

    // Auto-load saved mobile number from localStorage
    useEffect(() => {
        const savedMobile = localStorage.getItem('customerMobile');
        if (savedMobile) {
            setMobileFilter(savedMobile);
        }
    }, []);

    const handleReorder = (order: any) => {
        order.items.forEach((item: any) => {
            for (let i = 0; i < item.quantity; i++) {
                addToCart(item, item.customizations);
            }
        });
        // Redirect to cart
        window.location.href = '/cart';
    };

    // Filter orders by mobile number
    const filteredOrders = mobileFilter.trim() === ''
        ? []
        : orders.filter(order => order.customer_mobile.includes(mobileFilter));

    const activeOrders = filteredOrders.filter(o =>
        o.order_status === 'received' || o.order_status === 'preparing' || o.order_status === 'ready'
    );

    const completedOrders = filteredOrders.filter(o =>
        o.order_status === 'completed' || o.order_status === 'cancelled'
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'received': return 'bg-blue-100 text-blue-600';
            case 'preparing': return 'bg-orange-100 text-orange-600';
            case 'ready': return 'bg-green-100 text-green-600';
            case 'completed': return 'bg-gray-100 text-gray-600';
            default: return 'bg-red-100 text-red-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'received': return 'Order Received';
            case 'preparing': return 'Cooking';
            case 'ready': return 'Ready to Serve';
            case 'completed': return 'Completed';
            default: return 'Cancelled';
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-8">
            <header className="px-4 py-4 flex items-center gap-3 glass sticky top-0 z-10 border-b border-gray-100">
                <Link href="/" className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center active:scale-95 transition-all">
                    <span className="text-base">←</span>
                </Link>
                <h1 className="text-lg font-bold">My Orders</h1>
            </header>

            <div className="container mt-6 animate-enter">
                {/* Mobile Number Input */}
                <div className="mb-6">
                    <label className="block text-sm font-bold mb-3 ml-1 text-gray-700">Enter Your Mobile Number</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <span className="text-xl">📱</span>
                        </div>
                        <input
                            type="tel"
                            placeholder="Enter mobile number"
                            value={mobileFilter}
                            onChange={(e) => setMobileFilter(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="w-full h-14 pl-14 pr-4 bg-white rounded-2xl shadow-sm border border-gray-100 outline-none text-base focus:border-red-200 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400"
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 ml-1">We'll show all orders placed with this number</p>
                </div>

                {mobileFilter.length >= 10 && (
                    <>
                        {/* Active Orders */}
                        {activeOrders.length > 0 && (
                            <div className="mb-8 animate-enter delay-1">
                                <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                                    <span className="text-xl">🔥</span>
                                    Active Orders
                                </h2>
                                <div className="space-y-3">
                                    {activeOrders.map((order, index) => (
                                        <Link
                                            key={order.order_id}
                                            href={`/order/${order.order_id}`}
                                            className="block animate-scale"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <div className="bg-white p-5 rounded-3xl shadow-sm hover:shadow-md transition-all border border-gray-50">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-base mb-1">Order #{order.order_id}</h3>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(order.order_time).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(order.order_status)}`}>
                                                        {getStatusLabel(order.order_status)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200">
                                                    <span className="text-sm text-gray-500">{order.items.length} items</span>
                                                    <span className="font-bold text-lg text-red-500">₹{order.total_amount}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Completed Orders */}
                        {completedOrders.length > 0 && (
                            <div className="animate-enter delay-2">
                                <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                                    <span className="text-xl">✅</span>
                                    Past Orders
                                </h2>
                                <div className="space-y-3">
                                    {completedOrders.map((order, index) => (
                                        <div
                                            key={order.order_id}
                                            className="bg-white p-5 rounded-3xl shadow-sm hover:shadow-md transition-all border border-gray-50 animate-scale"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <Link href={`/order/${order.order_id}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-base mb-1">Order #{order.order_id}</h3>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(order.order_time).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(order.order_status)}`}>
                                                        {getStatusLabel(order.order_status)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200 mb-3">
                                                    <span className="text-sm text-gray-500">{order.items.length} items</span>
                                                    <span className="font-bold text-lg text-gray-600">₹{order.total_amount}</span>
                                                </div>
                                            </Link>
                                            <button
                                                onClick={() => handleReorder(order)}
                                                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <span>🔄</span>
                                                Order Again
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No Orders Found */}
                        {activeOrders.length === 0 && completedOrders.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center animate-enter delay-1">
                                <div className="text-6xl mb-4 opacity-20">📦</div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">No orders found</h3>
                                <p className="text-sm text-gray-400 mb-6">
                                    No orders found for this mobile number
                                </p>
                                <Link href="/" className="btn btn-primary">
                                    Browse Menu
                                </Link>
                            </div>
                        )}
                    </>
                )}

                {/* Initial State */}
                {mobileFilter.length < 10 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-6xl mb-4 opacity-20">📱</div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Track Your Orders</h3>
                        <p className="text-sm text-gray-400">
                            Enter your mobile number to view your orders
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
