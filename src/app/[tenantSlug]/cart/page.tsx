'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Ticket, ArrowRight, Trash2, ShoppingCart, CreditCard, Loader2, Smartphone, AlertCircle } from 'lucide-react';
import Script from 'next/script';
import { useState } from 'react';
import { createRazorpayOrder, createOrder } from '@/app/actions/orders';
import { useStore } from '@/context/StoreContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function CartPage() {
    const { cart, updateCartQuantity } = useCart();
    const params = useParams();
    const tenantSlug = params.tenantSlug as string;

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = 20;
    const finalTotal = totalAmount + deliveryFee;

    const { customer, tenant } = useStore();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const handlePayOnline = async () => {
        if (!customer) {
            router.push(`/${tenantSlug}/checkout`);
            return;
        }
        setIsProcessing(true);
        setPaymentError(null);
        try {
            // 1. Create order ID on our server
            const rzpRes = await createRazorpayOrder(finalTotal);
            if (!rzpRes.success || !rzpRes.data) {
                const errorMsg = rzpRes.error || "Could not initiate payment. Are your Razorpay test keys configured?";
                setPaymentError(errorMsg);
                // We keep isProcessing as true to show the error state in the overlay
                return;
            }

            const orderOptions = rzpRes.data as any;

            // 2. Open Razorpay Checkout Modal
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
                amount: orderOptions.amount, 
                currency: orderOptions.currency,
                name: "Diney SaaS",
                description: `Payment for ${tenantSlug}`,
                order_id: orderOptions.id, 
                handler: async function (response: any) {
                    toast.loading('Verifying secure payment...', { id: 'payment' });
                    // 3. Place actual Diney order with signature for server verification
                    const result = await createOrder(
                        tenant?.id || '', // extract tenant ID securely
                        customer.name,
                        customer.mobile,
                        cart,
                        finalTotal,
                        response.razorpay_payment_id,
                        response.razorpay_order_id,
                        response.razorpay_signature
                    );
                    
                    if (result.success) {
                        toast.success('Payment beautiful & Order placed!', { id: 'payment' });
                        router.push(`/${tenantSlug}/my-orders`);
                    } else {
                        toast.error(result.error || 'Payment succeeded but order failed.', { id: 'payment' });
                    }
                },
                prefill: {
                    name: customer.name,
                    contact: customer.mobile
                },
                theme: {
                    color: "#059669" // emerald-600
                },
                modal: {
                    ondismiss: function() {
                        setIsProcessing(false);
                        toast.error("Payment cancelled by you");
                    }
                }
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.on('payment.failed', function (response: any){
                toast.error(`Payment Failed: ${response.error.description}`);
                setIsProcessing(false);
            });
            rzp1.open();
        } catch (error: any) {
            console.error("Payment error", error);
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#FAFAF8] relative max-w-[520px] mx-auto flex flex-col">
            <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
            { }
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
                                    key={item.uniqueId}
                                    className="bg-white p-4 rounded-2xl border border-neutral-200/30 flex items-center gap-4 shadow-sm shadow-neutral-100/40"
                                >
                                    { }
                                    <div className="w-[72px] h-[72px] bg-neutral-50 rounded-2xl overflow-hidden flex-shrink-0">
                                        {item.image_url ? (
                                            <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[36px]">
                                                {getFoodEmoji(item.name)}
                                            </div>
                                        )}
                                    </div>

                                    { }
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[15px] font-semibold text-neutral-900 tracking-[-0.01em] truncate mb-2">{item.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[17px] font-extrabold text-neutral-900 tracking-tight">₹{item.price * item.quantity}</span>

                                            { }
                                            <div className="flex items-center bg-emerald-600 rounded-xl overflow-hidden shadow-sm shadow-emerald-600/20">
                                                <motion.button
                                                    whileTap={{ scale: 0.85 }}
                                                    onClick={() => updateCartQuantity(item.uniqueId, -1)}
                                                    className="w-9 h-9 flex items-center justify-center text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                                                >
                                                    {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-4 h-4" />}
                                                </motion.button>
                                                <span className="text-white text-[14px] font-bold w-7 text-center">{item.quantity}</span>
                                                <motion.button
                                                    whileTap={{ scale: 0.85 }}
                                                    onClick={() => updateCartQuantity(item.uniqueId, 1)}
                                                    className="w-9 h-9 flex items-center justify-center text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            { }
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
                        { }
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

                        { }
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

                        <div className="flex flex-col gap-3 mt-4">
                            <motion.button
                                onClick={handlePayOnline}
                                disabled={isProcessing}
                                whileTap={{ scale: 0.97 }}
                                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-[15px] shadow-[0_8px_30px_-4px_rgba(22,163,74,0.35)] flex items-center justify-center gap-2.5 hover:bg-emerald-700 active:bg-emerald-800 transition-colors disabled:opacity-70"
                            >
                                {isProcessing ? "Processing..." : "Pay Online"}
                                {!isProcessing && <CreditCard className="w-4 h-4 ml-1" />}
                            </motion.button>
                            
                            <Link href={`/${tenantSlug}/checkout`} className="block w-full">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full bg-white text-emerald-600 border border-emerald-600/20 py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 hover:bg-emerald-50 transition-colors"
                                >
                                    Cash on Pickup
                                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                                </motion.button>
                            </Link>
                        </div>
                        <p className="text-center text-[11px] text-neutral-400 font-medium pb-4 max-w-[200px] mx-auto leading-relaxed">
                            Secured by Razorpay. View your receipt instantly in My Orders.
                        </p>
                    </div>
                )}
            </div>

            {/* High-Fidelity Payment Loading & Error Overlay */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="relative w-full max-w-xs"
                        >
                            {!paymentError ? (
                                <>
                                    {/* Animated Rings - Loading State */}
                                    <div className="relative w-32 h-32 mb-10 mx-auto">
                                        <motion.div 
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-4 border-emerald-100 rounded-[2.5rem]"
                                        />
                                        <motion.div 
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-t-4 border-emerald-600 rounded-[2.5rem]"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                                                <CreditCard className="w-8 h-8 text-white animate-pulse" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h2 className="text-[22px] font-black text-neutral-900 tracking-tight uppercase italic">
                                            Securing <span className="text-emerald-600">Transaction</span>
                                        </h2>
                                        <p className="text-[13px] text-neutral-400 font-bold uppercase tracking-[0.2em] max-w-[240px] mx-auto leading-relaxed">
                                            Initializing encrypted payment gateway
                                        </p>
                                    </div>

                                    <div className="mt-12 w-48 h-1.5 bg-neutral-100 rounded-full mx-auto overflow-hidden">
                                        <motion.div 
                                            initial={{ x: "-100%" }}
                                            animate={{ x: "100%" }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                            className="w-full h-full bg-emerald-600 rounded-full"
                                        />
                                    </div>
                                </>
                            ) : (
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                        <AlertCircle className="w-10 h-10 text-red-500" />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h2 className="text-[20px] font-black text-neutral-900 tracking-tight uppercase italic">
                                            Payment <span className="text-red-500">Failed</span>
                                        </h2>
                                        <p className="text-[13px] text-neutral-500 font-bold leading-relaxed px-4">
                                            {paymentError}
                                        </p>
                                    </div>

                                    <div className="pt-6">
                                        <button 
                                            onClick={() => {
                                                setIsProcessing(false);
                                                setPaymentError(null);
                                            }}
                                            className="w-full h-14 bg-neutral-900 text-white rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-xl shadow-neutral-900/10 active:scale-95 transition-all"
                                        >
                                            Return to Cart
                                        </button>
                                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                                            <Smartphone size={12} />
                                            Check your connectivity
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                        
                        {!paymentError && (
                            <p className="absolute bottom-12 text-[10px] font-black text-neutral-300 uppercase tracking-widest">
                                Official Merchant Pipeline • Secured by Razorpay
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
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
