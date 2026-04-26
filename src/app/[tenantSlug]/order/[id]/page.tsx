'use client';

import { useStore } from '@/context/StoreContext';
import { useOrders } from '@/context/OrderContext';
import { useCart } from '@/context/CartContext';
import { useAdmin } from '@/context/AdminContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Order } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle2, ShoppingBag, UtensilsCrossed, Receipt, ChevronRight, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QRCode } from 'react-qrcode-logo';
import ResilientImage from "@/components/ResilientImage";

export default function OrderStatusPage() {
    const params = useParams();
    const router = useRouter();
    const { tenant } = useStore();
    const { orders, fetchCustomerOrders } = useOrders();
    const { reorderPastOrder } = useCart();
    const { menuItems } = useAdmin();
    const [order, setOrder] = useState<Order | null>(null);
    const [hasSynced, setHasSynced] = useState(false);

    useEffect(() => {
        const foundOrder = orders.find(o => o.order_id === params.id);
        if (foundOrder) {
            setOrder(foundOrder);

            // If order found but has no items, and we haven't tried syncing yet, try to fetch again
            if (foundOrder.items.length === 0 && !hasSynced && tenant) {
                setHasSynced(true);
                fetchCustomerOrders(tenant.id, foundOrder.customer_mobile);
            }
        }
    }, [params.id, orders, hasSynced, tenant, fetchCustomerOrders]);

    const handleReorder = async () => {
        if (!order) return;
        await reorderPastOrder(order.items);
        setTimeout(() => {
            router.push(`/${params.tenantSlug}/cart`);
        }, 500);
    };

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
                        <p className="text-[14px] text-neutral-900 font-bold uppercase tracking-[0.2em] mt-0.5">#{order.short_id}</p>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <div className="flex-1 px-5 py-6 flex flex-col items-center overflow-y-auto pb-32">
                {/* Status Icon */}
                <div className="relative mb-10 mt-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 15 }}
                        className={`w-44 h-44 rounded-[3.5rem] ${visuals.bgColor} flex items-center justify-center relative z-10 shadow-2xl shadow-black/5 overflow-hidden`}
                    >
                        {/* Dynamic Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-current via-transparent to-transparent" />
                        </div>

                        <motion.div
                            key={order.order_status}
                            initial={{ y: 20, opacity: 0, scale: 0.5 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className={visuals.color}
                        >
                            {order.order_status === 'completed' ? (
                                <div className="relative">
                                    <CheckCircle2 className="w-16 h-16 text-emerald-500" strokeWidth={2.5} />
                                    <motion.div
                                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="absolute inset-0 bg-emerald-500 rounded-full -z-10"
                                    />
                                </div>
                            ) : visuals.icon}
                        </motion.div>

                        {order.order_status === 'completed' && (
                            <div className="absolute inset-0 pointer-events-none">
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{
                                            opacity: [0, 1, 0],
                                            scale: [0, 1, 0.5],
                                            x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 10)],
                                            y: [0, -(40 + i * 15)]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.3
                                        }}
                                        className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-emerald-400"
                                    />
                                ))}
                            </div>
                        )}

                        {order.order_status === 'preparing' && (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-2 border-[2px] border-dashed border-amber-500/20 rounded-[3rem]"
                            />
                        )}
                    </motion.div>

                    {/* Multi-layered Glow */}
                    <div className={`absolute inset-0 rounded-[3.5rem] ${order.order_status === 'completed' ? 'bg-emerald-500/10' : visuals.ringColor} blur-3xl opacity-30 scale-125 -z-10`} />
                    <motion.div
                        animate={{
                            scale: order.order_status === 'completed' ? [1, 1.1, 1] : [1, 1.15, 1],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className={`absolute inset-0 rounded-[3.5rem] ${order.order_status === 'completed' ? 'border-emerald-500/20' : visuals.ringColor + ' border-current'} border-2 opacity-20 -z-10`}
                    />
                </div>

                <div className="text-center mb-8 max-w-xs">
                    <motion.h2
                        key={visuals.label}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-[28px] font-bold text-neutral-900 tracking-tight mb-2"
                    >
                        {order.order_status === 'completed' ? "Order Picked Up!" : visuals.label}
                    </motion.h2>
                    <motion.p
                        key={visuals.subLabel}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-[14px] text-neutral-400 font-medium leading-relaxed px-4"
                    >
                        {order.order_status === 'completed' ? "We hope you enjoyed your legendary meal. See you again soon!" : visuals.subLabel}
                    </motion.p>
                </div>

                {/* QR Code Validation */}
                {['received', 'preparing', 'ready'].includes(order.order_status) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-full bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-xl shadow-black/[0.02] mb-6 flex flex-col items-center text-center"
                    >
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.1em] mb-4">
                            {order.order_status === 'ready' ? "Scan at counter to collect" : "Your Pickup Code"}
                        </p>
                        <div className="p-4 bg-white rounded-3xl border-2 border-dashed border-emerald-100">
                            <QRCode
                                value={order.order_id}
                                size={180}
                                qrStyle="dots"
                                eyeRadius={8}
                                fgColor="#059669"
                            />
                        </div>
                        {order.order_status === 'ready' && (
                            <div className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold animate-pulse">
                                READY FOR HANDOVER
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Details Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-xl shadow-black/[0.02] mb-6"
                >
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-50">
                        <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.1em]">Item Details</h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100/50">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>

                    <div className="space-y-5 mb-6">
                        {order.items.map((item, i) => {
                            const menuItem = menuItems.find(m => m.name === item.name);
                            const displayImage = item.image_url || menuItem?.image_url;

                            return (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-neutral-50 rounded-2xl overflow-hidden flex-shrink-0 border border-neutral-100 shadow-sm flex items-center justify-center">
                                        {displayImage ? (
                                            <ResilientImage
                                                src={displayImage}
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-cover"
                                                alt={item.name}
                                                fallbackEmoji={getFoodEmoji(item.name)}
                                            />
                                        ) : (
                                            <span className="text-[28px]">{getFoodEmoji(item.name)}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[14px] font-bold text-neutral-900 truncate tracking-tight">{item.name}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[12px] text-neutral-400 font-medium">Qty: {item.quantity}</span>
                                            <div className="w-1 h-1 bg-neutral-200 rounded-full" />
                                            <span className="text-[12px] text-neutral-400 font-medium">₹{item.price}</span>
                                        </div>
                                    </div>
                                    <span className="text-[15px] font-bold text-neutral-900 tracking-tight">₹{item.price * item.quantity}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-5 pb-5 border-t border-dashed border-neutral-100">
                        <div className="flex justify-between items-center px-1 border-b border-neutral-50 pb-4 mb-4">
                            <span className="text-[14px] font-bold text-neutral-400">Payment Status</span>
                            {order.payment_status === 'paid' ? (
                                <span className="px-3 py-1 rounded text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase tracking-widest shadow-sm">Paid Online</span>
                            ) : order.payment_id ? (
                                <span className="px-3 py-1 rounded text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-200 uppercase tracking-widest shadow-sm">Payment Pending</span>
                            ) : (
                                <span className="px-3 py-1 rounded text-[11px] font-bold bg-neutral-50 text-neutral-600 border border-neutral-200 uppercase tracking-widest shadow-sm">
                                    {order.order_type === 'DINE_IN' ? 'Pay at Counter' : 'Cash on Pickup'}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[14px] font-bold text-neutral-400">Total Amount</span>
                            <span className="text-[24px] font-bold text-neutral-900 tracking-tighter">₹{order.total_amount}</span>
                        </div>
                    </div>

                    {order.order_status === 'ready' && (
                        <div className="mt-2">
                            <div className="bg-emerald-600 text-white text-center py-4 rounded-2xl font-bold text-[12px] uppercase tracking-[0.1em] shadow-lg shadow-emerald-600/20">
                                Hot & Ready for Pickup
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[520px] z-50 px-5 pb-8 pt-4 bg-gradient-to-t from-[#FAFAF8] via-[#FAFAF8] to-transparent">
                <div className="flex gap-3">
                    <button
                        onClick={handleReorder}
                        className="flex-[2] h-14 bg-emerald-600 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                        <RotateCcw className="w-4 h-4" strokeWidth={3} />
                        Reorder Meal
                    </button>

                    <Link href={`/${params.tenantSlug}`} className="flex-1">
                        <button className="w-full h-14 bg-white border border-neutral-200/50 text-neutral-900 rounded-2xl font-bold text-[15px] shadow-sm hover:bg-neutral-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                            Menu
                            <ChevronRight className="w-4 h-4 text-neutral-400" />
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
