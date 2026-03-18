'use client';

import { useStore } from '@/context/StoreContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Order } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle2, ShoppingBag, UtensilsCrossed, Receipt, ChevronRight } from 'lucide-react';

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
            <div className="h-screen flex items-center justify-center bg-[#FAFAF8]">
                <div className="animate-spin w-10 h-10 border-[3px] border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const getStatusVisuals = (status: string) => {
        switch (status) {
            case 'received': return { icon: <Receipt className="w-12 h-12" />, label: 'Order Received', subLabel: 'Hang tight, we are confirming your order.', color: 'text-blue-500', bgColor: 'bg-blue-50', ringColor: 'ring-blue-100' };
            case 'preparing': return { icon: <UtensilsCrossed className="w-12 h-12" />, label: 'Preparing', subLabel: 'Our chefs are crafting your legendary meal.', color: 'text-amber-500', bgColor: 'bg-amber-50', ringColor: 'ring-amber-100' };
            case 'ready': return { icon: <CheckCircle2 className="w-12 h-12" />, label: 'Ready to Serve', subLabel: 'Your order is hot and ready at the counter!', color: 'text-emerald-500', bgColor: 'bg-emerald-50', ringColor: 'ring-emerald-100' };
            case 'completed': return { icon: <ShoppingBag className="w-12 h-12" />, label: 'Enjoy Your Meal!', subLabel: 'The journey is complete. See you next time!', color: 'text-neutral-400', bgColor: 'bg-neutral-50', ringColor: 'ring-neutral-100' };
            default: return { icon: <Receipt className="w-12 h-12" />, label: 'Cancelled', subLabel: 'This order has been cancelled.', color: 'text-red-500', bgColor: 'bg-red-50', ringColor: 'ring-red-100' };
        }
    };

    const visuals = getStatusVisuals(order.order_status);

    return (
        <main className="min-h-screen bg-[#FAFAF8] max-w-[520px] mx-auto flex flex-col">
            { }
            <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-neutral-100/60">
                <div className="px-5 py-3.5 flex items-center justify-between">
                    <Link href={`/${params.tenantSlug}`}>
                        <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200/50 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors shadow-sm">
                            <ArrowLeft className="w-[18px] h-[18px]" />
                        </div>
                    </Link>
                    <div className="text-center">
                        <h1 className="text-[14px] font-bold text-neutral-900 tracking-[-0.01em]">Order Status</h1>
                        <p className="text-[14px] text-neutral-900 font-black uppercase tracking-[0.2em] mt-0.5">#{order.short_id}</p>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <div className="flex-1 px-5 py-10 flex flex-col items-center">
                { }
                <div className="relative mb-12">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`w-48 h-48 rounded-[3rem] ${visuals.bgColor} flex items-center justify-center relative z-10 transition-colors duration-700 shadow-xl shadow-black/5`}
                    >
                        <motion.div 
                            key={order.order_status}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className={visuals.color}
                        >
                            {visuals.icon}
                        </motion.div>
                        
                        {order.order_status === 'preparing' && (
                            <div className="absolute inset-4 border-[3px] border-amber-500/10 border-t-amber-500 rounded-[2.2rem] animate-spin" />
                        )}
                    </motion.div>
                    
                    { }
                    <div className={`absolute inset-0 rounded-[3rem] ${visuals.ringColor} blur-2xl opacity-40 scale-110 -z-10`} />
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className={`absolute inset-0 rounded-[3rem] ${visuals.ringColor} opacity-10 -z-10`} 
                    />
                </div>

                <div className="text-center mb-10 max-w-xs">
                    <motion.h2 
                        key={visuals.label}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-[26px] font-extrabold text-neutral-900 tracking-[-0.02em] mb-2"
                    >
                        {visuals.label}
                    </motion.h2>
                    <motion.p 
                        key={visuals.subLabel}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[14px] text-neutral-400 font-medium leading-relaxed"
                    >
                        {visuals.subLabel}
                    </motion.p>
                </div>

                { }
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full bg-white p-6 rounded-3xl border border-neutral-200/30 shadow-sm mb-8"
                >
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-100/60">
                        <h3 className="text-[13px] font-semibold text-neutral-400 uppercase tracking-wider">Item Details</h3>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 bg-neutral-50 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-neutral-50 rounded-xl overflow-hidden flex-shrink-0">
                                    {item.image_url ? (
                                        <img src={item.image_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[24px]">
                                            {getFoodEmoji(item.name)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[14px] font-semibold text-neutral-900 tracking-[-0.01em]">{item.name}</h4>
                                    <span className="text-[12px] text-neutral-400 font-medium tracking-tight">Quantity: {item.quantity}</span>
                                </div>
                                <span className="text-[15px] font-bold text-neutral-900">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-5 border-t border-dashed border-neutral-200">
                        <div className="flex justify-between items-center">
                            <span className="text-[15px] font-bold text-neutral-400">Total</span>
                            <span className="text-[24px] font-extrabold text-neutral-900 tracking-tight">₹{order.total_amount}</span>
                        </div>
                    </div>

                    {order.order_status === 'ready' && (
                        <div className="mt-6">
                            <div className="bg-emerald-600 text-white text-center py-3 rounded-xl font-bold text-[13px] uppercase tracking-wider shadow-lg shadow-emerald-600/20">
                                Hot & Ready for Pickup
                            </div>
                        </div>
                    )}
                </motion.div>

                <div className="w-full">
                    <Link href={`/${params.tenantSlug}`}>
                        <button className="w-full h-14 bg-white border border-neutral-200/50 text-neutral-900 rounded-2xl font-bold text-[15px] shadow-sm hover:bg-neutral-50 active:bg-neutral-100 transition-colors flex items-center justify-center gap-2">
                            Back to Menu
                            <ChevronRight className="w-4 h-4 text-neutral-300" />
                        </button>
                    </Link>
                </div>
            </div>
        </main>
    );
}

function getFoodEmoji(name: string) {
    const n = name.toLowerCase();
    if (n.includes('samosa')) return '🥟';
    if (n.includes('cutlet')) return '🍘';
    if (n.includes('pakora') || n.includes('bread')) return '🥙';
    if (n.includes('burger') || n.includes('wrap')) return '🍔';
    if (n.includes('momos') || n.includes('pizza')) return '🥟';
    if (n.includes('fries')) return '🍟';
    if (n.includes('pav') || n.includes('dosa')) return '🌮';
    if (n.includes('nuggets')) return '🍗';
    if (n.includes('drink') || n.includes('soda')) return '🥤';
    if (n.includes('chai') || n.includes('coffee')) return '☕';
    return '🍱';
}
