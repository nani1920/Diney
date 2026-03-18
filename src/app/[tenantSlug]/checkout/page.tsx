'use client';

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, StickyNote, CreditCard, ChevronRight, MapPin } from 'lucide-react';

export default function CheckoutPage() {
    const { cart, placeOrder, customer, updateCustomer } = useStore();
    const router = useRouter();
    const params = useParams();
    const tenantSlug = params.tenantSlug as string;

    const [formData, setFormData] = useState({
        name: customer?.name || '',
        mobile: customer?.mobile || '',
        note: ''
    });

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) { toast.error('Please enter your name'); return; }
        if (!formData.mobile || formData.mobile.length < 10) { toast.error('Please enter a valid 10-digit mobile number'); return; }
        updateCustomer(formData.name, formData.mobile);
        toast.success('Order placed successfully!');
        const newOrder = await placeOrder(formData);
        if (newOrder) { router.push(`/${tenantSlug}/order/${newOrder.order_id}`); }
    };

    return (
        <>
            <Toaster />
            <main className="min-h-screen bg-[#FAFAF8] max-w-[520px] mx-auto flex flex-col">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-neutral-100/60">
                    <div className="px-5 py-3.5 flex items-center justify-between">
                        <Link href={`/${tenantSlug}/cart`}>
                            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200/50 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors shadow-sm">
                                <ArrowLeft className="w-[18px] h-[18px]" />
                            </div>
                        </Link>
                        <h1 className="text-[16px] font-bold text-neutral-900 tracking-[-0.01em]">Checkout</h1>
                        <div className="w-10" />
                    </div>
                </header>

                <div className="flex-1 px-5 py-6">
                    <div className="space-y-6">
                        {/* Collection Point */}
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                            <h2 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3 ml-1">Collection</h2>
                            <div className="bg-white p-5 rounded-2xl border border-neutral-200/30 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[15px] font-bold text-neutral-900 tracking-[-0.01em]">Counter Pickup</h3>
                                    <p className="text-[12px] text-neutral-400 font-medium mt-0.5">Visit our counter when order is ready</p>
                                </div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                            </div>
                        </motion.div>

                        <form onSubmit={handlePlaceOrder} className="space-y-6">
                            {/* Personal Details */}
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <h2 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3 ml-1">Your Details</h2>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-300" />
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            className="w-full h-12 pl-12 pr-5 bg-white rounded-2xl outline-none text-[15px] font-medium text-neutral-800 placeholder:text-neutral-300 border border-neutral-200/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-300" />
                                        <input
                                            type="tel"
                                            placeholder="Mobile Number"
                                            className="w-full h-12 pl-12 pr-5 bg-white rounded-2xl outline-none text-[15px] font-medium text-neutral-800 tracking-wide placeholder:text-neutral-300 placeholder:tracking-normal border border-neutral-200/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm"
                                            value={formData.mobile}
                                            onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Special Notes */}
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <h2 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3 ml-1">Special Instructions</h2>
                                <div className="relative">
                                    <StickyNote className="absolute left-4 top-4 w-[18px] h-[18px] text-neutral-300" />
                                    <textarea
                                        placeholder="E.g. less spicy, extra sauce..."
                                        className="w-full p-4 pl-12 bg-white rounded-2xl outline-none text-[15px] font-medium text-neutral-800 placeholder:text-neutral-300 border border-neutral-200/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all resize-none h-28 shadow-sm"
                                        value={formData.note}
                                        onChange={e => setFormData({ ...formData, note: e.target.value })}
                                    />
                                </div>
                            </motion.div>

                            {/* Payment Summary */}
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                className="bg-white p-6 rounded-3xl border border-neutral-200/30 shadow-sm"
                            >
                                <div className="flex justify-between items-center mb-5">
                                    <span className="text-[14px] text-neutral-500 font-medium">Total Payable</span>
                                    <div className="flex items-center gap-2 text-[12px] font-medium text-neutral-400 bg-neutral-50 px-3 py-1.5 rounded-lg">
                                        <CreditCard className="w-3.5 h-3.5" />
                                        Pay at counter
                                    </div>
                                </div>
                                <span className="text-[28px] font-extrabold text-neutral-900 tracking-tight block">₹{totalAmount}</span>
                            </motion.div>

                            {/* Place Order CTA */}
                            <motion.button
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                whileTap={{ scale: 0.97 }}
                                type="submit"
                                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-[15px] shadow-[0_8px_30px_-4px_rgba(22,163,74,0.35)] flex items-center justify-center gap-2.5 hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                            >
                                Place Order
                                <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4 text-emerald-600" />
                                </div>
                            </motion.button>
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
}
