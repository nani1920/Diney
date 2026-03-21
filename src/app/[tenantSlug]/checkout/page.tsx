'use client';

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrderContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Phone, StickyNote, CreditCard, ChevronRight, MapPin } from 'lucide-react';

export default function CheckoutPage() {
    const { customer, updateCustomer } = useStore();
    const { cart, clearCart } = useCart();
    const { placeOrder } = useOrders();
    const router = useRouter();
    const params = useParams();
    const tenantSlug = params.tenantSlug as string;

    const [formData, setFormData] = useState({
        name: customer?.name || '',
        mobile: customer?.mobile || '',
        note: ''
    });

    const [isPlacing, setIsPlacing] = useState(false);

    const totalAmount = cart.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        const customizationTotal = (item.customizations || [])
            .filter(c => c.price)
            .reduce((cSum, c) => cSum + (c.price || 0) * item.quantity, 0);
        return sum + itemTotal + customizationTotal;
    }, 0);

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isPlacing) return;
        if (cart.length === 0) { toast.error('Your cart is empty'); return; }
        if (!formData.name.trim()) { toast.error('Please enter your name'); return; }
        if (!formData.mobile || formData.mobile.length < 10) { toast.error('Please enter a valid 10-digit mobile number'); return; }
        
        try {
            setIsPlacing(true);
            updateCustomer(formData.name, formData.mobile);
            
            const newOrder = await placeOrder(formData);
            if (newOrder) { 
                toast.success('Order placed successfully!');
                // Navigate first
                router.push(`/${tenantSlug}/order/${newOrder.order_id}`);
                // Clear cart after a small delay to ensure navigation starts
                setTimeout(() => {
                    clearCart();
                }, 500);
            }
        } catch (error) {
            console.error('Order placement error:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsPlacing(false);
        }
    };

    return (
        <>
            <Toaster />
            <main className="min-h-screen bg-[#FAFAF8] max-w-[520px] mx-auto flex flex-col">
                { }
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
                        { }
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
                            { }
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

                            { }
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

                            { }
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

                            { }
                            <motion.button
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                whileTap={{ scale: 0.97 }}
                                type="submit"
                                disabled={isPlacing || cart.length === 0}
                                className={`w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all
                                    ${isPlacing || cart.length === 0 
                                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' 
                                        : 'bg-emerald-600 text-white shadow-[0_8px_30px_-4px_rgba(22,163,74,0.35)] hover:bg-emerald-700 active:bg-emerald-800'
                                    }`}
                            >
                                {isPlacing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Placing Order...
                                    </>
                                ) : (
                                    <>
                                        Place Order
                                        <div className="bg-white w-8 h-8 rounded-lg flex items-center justify-center">
                                            <ChevronRight className={`w-4 h-4 ${cart.length === 0 ? 'text-neutral-300' : 'text-emerald-600'}`} />
                                        </div>
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </div>
                </div>

                {/* Full page loading overlay */}
                {isPlacing && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center"
                    >
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
                            <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                    <div className="w-1.5 h-6 bg-white rounded-full animate-pulse" />
                                </div>
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900 mb-2">Placing your order...</h2>
                        <p className="text-neutral-500 font-medium">Please don't close this page</p>
                    </motion.div>
                )}
            </main>
        </>
    );
}
