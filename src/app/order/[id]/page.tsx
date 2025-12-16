'use client';

import { useStore } from '@/context/StoreContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Order } from '@/types';

export default function OrderStatusPage() {
    const params = useParams();
    const { orders } = useStore();
    const [order, setOrder] = useState<Order | null>(null);

    useEffect(() => {
        const foundOrder = orders.find(o => o.order_id === params.id);
        if (foundOrder) setOrder(foundOrder);
    }, [params.id, orders]);

    if (!order) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const getStatusVisuals = (status: string) => {
        switch (status) {
            case 'received': return { icon: '📋', color: 'from-blue-500 to-blue-600', bg: 'from-blue-50 to-blue-100', label: 'Order Received' };
            case 'preparing': return { icon: '👨‍🍳', color: 'from-orange-500 to-orange-600', bg: 'from-orange-50 to-orange-100', label: 'Cooking Now' };
            case 'ready': return { icon: '✨', color: 'from-green-500 to-green-600', bg: 'from-green-50 to-green-100', label: 'Ready to Serve' };
            case 'completed': return { icon: '😋', color: 'from-gray-500 to-gray-600', bg: 'from-gray-50 to-gray-100', label: 'Completed' };
            default: return { icon: '❌', color: 'from-red-500 to-red-600', bg: 'from-red-50 to-red-100', label: 'Cancelled' };
        }
    };

    const visuals = getStatusVisuals(order.order_status);

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-100 to-orange-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/2"></div>

            <header className="px-6 py-6 flex items-center justify-between relative z-10">
                <Link href="/" className="w-11 h-11 bg-white shadow-md rounded-xl flex items-center justify-center hover:shadow-lg transition-all active:scale-95">
                    <span className="text-lg">←</span>
                </Link>
                <div className="text-sm font-mono text-gray-400">#{order.order_id}</div>
            </header>

            <div className="container text-center relative z-10 pt-8">
                {/* Enhanced Status Icon */}
                <div className="mb-8 relative inline-block animate-scale">
                    <div className={`w-56 h-56 bg-gradient-to-br ${visuals.bg} rounded-full shadow-2xl flex items-center justify-center mx-auto text-8xl relative z-10 border-8 border-white`}>
                        <span className="animate-scale delay-1">{visuals.icon}</span>
                    </div>
                    {order.order_status === 'preparing' && (
                        <div className="absolute inset-0 border-4 border-t-transparent border-orange-500 rounded-full animate-spin"></div>
                    )}
                    <div className={`absolute inset-[-20px] bg-gradient-to-r ${visuals.color} rounded-full opacity-20 blur-xl`}></div>
                </div>

                {/* Status Text */}
                <h1 className="mb-3 text-3xl font-bold animate-enter delay-2">
                    {visuals.label}
                </h1>
                <p className="text-gray-500 text-base max-w-xs mx-auto mb-10 animate-enter delay-3">
                    {order.order_status === 'preparing' ? 'Your delicious food is being prepared with care' :
                        order.order_status === 'ready' ? 'Your order is ready! Please collect at the counter' :
                            order.order_status === 'received' ? 'We have received your order and will start soon' :
                                'Thank you for your order!'}
                </p>

                {/* Enhanced Receipt Card */}
                <div className="bg-white p-7 rounded-3xl shadow-lg text-left mx-4 border border-gray-100 animate-enter delay-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-dashed border-gray-200">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Order Details</h3>
                        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full font-semibold text-gray-600">
                            {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <div className="space-y-4 mb-6">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center text-2xl">
                                    {item.name.includes('Burger') || item.name.includes('Wrap') ? '🍔' :
                                        item.name.includes('Momos') || item.name.includes('Pizza') ? '🍕' :
                                            item.name.includes('Coffee') ? '🥤' : '🍟'}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-base">{item.name}</h4>
                                    <span className="text-sm text-gray-400">Qty: {item.quantity}</span>
                                </div>
                                <span className="font-bold text-base">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-5 flex justify-between items-center">
                        <span className="text-gray-600 font-semibold">Total Paid</span>
                        <span className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                            ₹{order.total_amount}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                {order.order_status === 'ready' && (
                    <div className="mt-8 mx-4 animate-enter delay-5">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-5 rounded-3xl font-bold shadow-xl shadow-green-200 mb-4">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <span className="text-2xl">🎉</span>
                                <span className="text-lg">Your food is ready!</span>
                            </div>
                            <p className="text-sm opacity-90">Show this screen at the counter</p>
                        </div>
                    </div>
                )}

                <Link href="/" className="inline-block mt-8 animate-enter delay-6">
                    <button className="btn btn-secondary px-8">
                        Order Again
                    </button>
                </Link>
            </div>
        </main>
    );
}
