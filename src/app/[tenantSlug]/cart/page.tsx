'use client';

import { useStore } from '@/context/StoreContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Ticket, ArrowRight, Trash2, ShoppingCart } from 'lucide-react';

export default function CartPage() {
    const { cart, updateCartQuantity } = useStore();
    const params = useParams();
    const tenantSlug = params.tenantSlug as string;

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = 20;

    return (
        <main className="min-h-screen bg-[#FAFAF8] relative max-w-[520px] mx-auto flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-neutral-100/60">
                <div className="px-5 py-3.5 flex items-center justify-between">
                    <Link href={`/${tenantSlug}`}>
                        <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200/50 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors shadow-sm">
                            <ArrowLeft className="w-[18px] h-[18px]" />
                        </div>
                    </Link>
                    <h1 className="text-[16px] font-bold text-neutral-900 tracking-[-0.01em]">My Cart</h1>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <span className="text-[14px] font-bold text-emerald-600">{cart.length}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 pb-40">
                <AnimatePresence mode="popLayout">
                    {cart.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8"
                        >
                            <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6">
                                <ShoppingCart className="w-10 h-10 text-emerald-300" />
                            </div>
                            <h2 className="text-[20px] font-bold text-neutral-900 tracking-[-0.02em] mb-2">Your cart is empty</h2>
                            <p className="text-[14px] text-neutral-400 font-medium mb-8 max-w-xs leading-relaxed">
                                Explore the menu and add your favourite items
                            </p>
                            <Link href={`/${tenantSlug}`}>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className="h-12 px-8 bg-emerald-600 text-white rounded-2xl font-bold text-[14px] shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
                                >
                                    Browse Menu
                                </motion.button>
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="px-5 mt-5 space-y-3">
                            {cart.map((item, index) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ delay: index * 0.04, duration: 0.3 }}
                                    key={item.id}
                                    className="bg-white p-4 rounded-2xl border border-neutral-200/30 flex items-center gap-4 shadow-sm shadow-neutral-100/40"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-[72px] h-[72px] bg-neutral-50 rounded-2xl overflow-hidden flex-shrink-0">
                                        {item.image_url ? (
                                            <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[36px]">
                                                {getFoodEmoji(item.name)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[15px] font-semibold text-neutral-900 tracking-[-0.01em] truncate mb-2">{item.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[17px] font-extrabold text-neutral-900 tracking-tight">₹{item.price * item.quantity}</span>

                                            {/* Stepper */}
                                            <div className="flex items-center bg-emerald-600 rounded-xl overflow-hidden shadow-sm shadow-emerald-600/20">
                                                <motion.button
                                                    whileTap={{ scale: 0.85 }}
                                                    onClick={() => updateCartQuantity(item.id, -1)}
                                                    className="w-9 h-9 flex items-center justify-center text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                                                >
                                                    {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-4 h-4" />}
                                                </motion.button>
                                                <span className="text-white text-[14px] font-bold w-7 text-center">{item.quantity}</span>
                                                <motion.button
                                                    whileTap={{ scale: 0.85 }}
                                                    onClick={() => updateCartQuantity(item.id, 1)}
                                                    className="w-9 h-9 flex items-center justify-center text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Add more items */}
                            <Link href={`/${tenantSlug}`} className="flex items-center gap-3 px-2 pt-3 text-emerald-600 hover:text-emerald-700 transition-colors">
                                <div className="w-9 h-9 rounded-xl border border-dashed border-emerald-300 flex items-center justify-center">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <span className="text-[13px] font-semibold">Add more items</span>
                            </Link>
                        </div>
                    )}
                </AnimatePresence>

                {cart.length > 0 && (
                    <div className="px-5 mt-8 space-y-6">
                        {/* Promo Code */}
                        <div className="flex gap-2.5">
                            <div className="flex-1 bg-white border border-neutral-200/50 h-12 rounded-2xl flex items-center px-4 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-50 transition-all shadow-sm">
                                <Ticket className="w-[18px] h-[18px] text-neutral-300 mr-3" />
                                <input
                                    placeholder="Promo code"
                                    className="w-full outline-none text-[14px] font-medium bg-transparent placeholder:text-neutral-300"
                                />
                            </div>
                            <button className="bg-emerald-600 text-white px-6 rounded-2xl font-bold text-[13px] hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-600/15">
                                Apply
                            </button>
                        </div>

                        {/* Bill Summary */}
                        <div className="bg-white p-6 rounded-3xl border border-neutral-200/30 shadow-sm">
                            <h3 className="text-[13px] font-semibold text-neutral-400 uppercase tracking-wider mb-5">Bill Summary</h3>
                            <div className="space-y-3.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[14px] text-neutral-500 font-medium">Item total</span>
                                    <span className="text-[15px] font-bold text-neutral-900">₹{totalAmount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[14px] text-neutral-500 font-medium">Platform fee</span>
                                    <span className="text-[15px] font-bold text-emerald-600">₹{deliveryFee}</span>
                                </div>
                                <div className="pt-4 mt-2 border-t border-dashed border-neutral-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[16px] font-bold text-neutral-900">Total</span>
                                        <span className="text-[22px] font-extrabold text-neutral-900 tracking-tight">₹{totalAmount + deliveryFee}</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-300 font-medium mt-1.5">Inclusive of all taxes</p>
                                </div>
                            </div>
                        </div>

                        {/* Checkout CTA */}
                        <Link href={`/${tenantSlug}/checkout`}>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-[15px] shadow-[0_8px_30px_-4px_rgba(22,163,74,0.35)] flex items-center justify-center gap-2.5 hover:bg-emerald-700 active:bg-emerald-800 transition-colors mt-2"
                            >
                                Proceed to Checkout
                                <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center">
                                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                                </div>
                            </motion.button>
                        </Link>
                        <p className="text-center text-[11px] text-neutral-300 font-medium pb-4">
                            Secure checkout · Pay at counter
                        </p>
                    </div>
                )}
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
