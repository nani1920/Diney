'use client';

import { useState, Suspense } from 'react';
import { useStore } from '@/context/StoreContext';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrderContext';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Phone, StickyNote, CreditCard, ChevronRight, MapPin, Smartphone, AlertCircle, Check } from 'lucide-react';
import Script from 'next/script';
import { createRazorpayOrder, createOrder } from '@/app/actions/orders';

function CheckoutContent() {
    const { customer, tenant, updateCustomer } = useStore();
    const { cart, clearCart } = useCart();
    const { placeOrder } = useOrders();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const tenantSlug = params.tenantSlug as string;
    const isOnlineMode = searchParams.get('type') === 'online';

    const [formData, setFormData] = useState({
        name: customer?.name || '',
        mobile: customer?.mobile || '',
        note: ''
    });

    const [isPlacing, setIsPlacing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const totalAmount = cart.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        const customizationTotal = (item.customizations || [])
            .filter(c => c.price)
            .reduce((cSum, c) => cSum + (c.price || 0) * item.quantity, 0);
        return sum + itemTotal + customizationTotal;
    }, 0);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isPlacing) return;
        if (cart.length === 0) { toast.error('Your cart is empty'); return; }
        if (!formData.name.trim()) { toast.error('Please enter your name'); return; }
        if (!formData.mobile || formData.mobile.length < 10) { toast.error('Please enter a valid 10-digit mobile number'); return; }
        
        setIsPlacing(true);
        setPaymentError(null);
        updateCustomer(formData.name, formData.mobile);

        if (isOnlineMode) {
            await handleOnlinePayment();
        } else {
            await handleCashOrder();
        }
    };

    const handleCashOrder = async () => {
        try {
            const newOrder = await placeOrder(formData);
            if (newOrder) { 
                toast.success('Order placed successfully!');
                router.push(`/${tenantSlug}/order/${newOrder.order_id}`);
                setTimeout(() => clearCart(), 500);
            }
        } catch (error) {
            console.error('Order placement error:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsPlacing(false);
        }
    };

    const handleOnlinePayment = async () => {
        try {
            const rzpRes = await createRazorpayOrder(
                totalAmount, 
                tenant?.id || '',
                { name: formData.name, mobile: formData.mobile },
                cart
            );
            if (!rzpRes.success || !rzpRes.data) {
                setPaymentError(rzpRes.error || "Payment initiation failed. Please try again.");
                return;
            }

            const orderOptions = rzpRes.data as any;
            const options = {
                key: tenant?.config?.razorpay_key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderOptions.amount,
                currency: orderOptions.currency,
                name: tenant?.name || "Diney",
                description: `Payment for ${tenant?.name || tenantSlug}`,
                order_id: orderOptions.id,
                handler: async function (response: any) {
                    toast.loading('Verifying secure payment...', { id: 'payment' });
                    const result = await createOrder(
                        tenant?.id || '',
                        formData.name,
                        formData.mobile,
                        cart,
                        totalAmount,
                        response.razorpay_payment_id,
                        response.razorpay_order_id,
                        response.razorpay_signature
                    );
                    
                    if (result.success) {
                        toast.success('Payment beautiful & Order placed!', { id: 'payment' });
                        setIsPlacing(false);
                        setPaymentSuccess(true);
                        // PhonePe style success screen delay
                        setTimeout(() => {
                            router.push(`/${tenantSlug}/my-orders`);
                            setTimeout(() => clearCart(), 100);
                        }, 2200);
                    } else {
                        setIsPlacing(false);
                        toast.error(result.error || 'Payment succeeded but order failed.', { id: 'payment' });
                    }
                },
                prefill: { name: formData.name, contact: formData.mobile },
                theme: { color: "#059669" },
                modal: {
                    ondismiss: function() {
                        setIsPlacing(false);
                        setPaymentError("Payment was cancelled. You can try again or use Cash on Pickup.");
                    }
                }
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.on('payment.failed', function (response: any){
                setPaymentError(`Payment Failed: ${response.error.description}`);
                setIsPlacing(false);
            });
            rzp1.open();
        } catch (error: any) {
            console.error("Payment error", error);
            setPaymentError("Unexpected error during payment initialization.");
            setIsPlacing(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#FAFAF8] max-w-[520px] mx-auto flex flex-col relative">
            <Toaster />
            <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
            
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
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3 ml-1">Order Method</h2>
                        <div className="bg-white p-5 rounded-2xl border border-neutral-200/30 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                {isOnlineMode ? <CreditCard className="w-5 h-5 text-emerald-600" /> : <MapPin className="w-5 h-5 text-emerald-600" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-[15px] font-bold text-neutral-900 tracking-[-0.01em] flex items-center gap-2">
                                    {isOnlineMode ? "Secure Online Payment" : "Counter Pickup"}
                                    {isOnlineMode && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full">Secure</span>}
                                </h3>
                                <p className="text-[12px] text-neutral-400 font-medium mt-0.5">
                                    {isOnlineMode ? "Enter details to continue to Razorpay" : "Visit our counter when order is ready"}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <h2 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3 ml-1">Confirm Identity</h2>
                            <div className="space-y-3">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-300" />
                                    <input
                                        type="text" required
                                        placeholder="Full Name"
                                        className="w-full h-12 pl-12 pr-5 bg-white rounded-2xl outline-none text-[15px] font-medium text-neutral-800 placeholder:text-neutral-300 border border-neutral-200/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-300" />
                                    <input
                                        type="tel" required
                                        placeholder="Mobile Number"
                                        className="w-full h-12 pl-12 pr-5 bg-white rounded-2xl outline-none text-[15px] font-medium text-neutral-800 tracking-wide placeholder:text-neutral-300 border border-neutral-200/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm"
                                        value={formData.mobile}
                                        onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        <div className="bg-white p-6 rounded-3xl border border-neutral-200/30 shadow-sm">
                            <div className="flex justify-between items-center mb-5">
                                <span className="text-[14px] text-neutral-500 font-medium">Order Total</span>
                                <div className="flex items-center gap-2 text-[12px] font-medium text-neutral-400 bg-neutral-50 px-3 py-1.5 rounded-lg">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    {isOnlineMode ? "Razorpay" : "Cash on Pickup"}
                                </div>
                            </div>
                            <span className="text-[28px] font-extrabold text-neutral-900 tracking-tight block">₹{totalAmount}</span>
                        </div>

                        <motion.button
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            whileTap={{ scale: 0.97 }}
                            type="submit"
                            disabled={isPlacing || cart.length === 0}
                            className={`w-full py-4 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all
                                ${isPlacing || cart.length === 0 
                                    ? 'bg-neutral-200 text-neutral-400' 
                                    : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:bg-emerald-800'
                                }`}
                        >
                            {isPlacing ? "Processing..." : (isOnlineMode ? "Pay Online" : "Place Order")}
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </motion.button>
                    </form>
                </div>
            </div>

            <AnimatePresence>
                {isPlacing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
                        {!paymentError ? (
                            <div className="relative w-32 h-32 mb-10 mx-auto">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-4 border-emerald-100 rounded-[2rem]" />
                                <motion.div animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-t-4 border-emerald-600 rounded-[2rem]" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Smartphone className="w-8 h-8 text-emerald-600 animate-pulse" />
                                </div>
                                <h2 className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 text-[18px] font-black text-neutral-900 tracking-tight uppercase italic whitespace-nowrap">
                                    Securing <span className="text-emerald-600">Transaction</span>
                                </h2>
                            </div>
                        ) : (
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="space-y-6">
                                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto shadow-sm"><AlertCircle className="w-10 h-10 text-red-500" /></div>
                                <h2 className="text-[20px] font-black text-neutral-900 italic uppercase">Payment <span className="text-red-500">Failed</span></h2>
                                <p className="text-[13px] text-neutral-500 font-bold max-w-xs mx-auto">{paymentError}</p>
                                <button onClick={() => { setIsPlacing(false); setPaymentError(null); }} className="px-10 h-14 bg-neutral-900 text-white rounded-2xl font-black uppercase tracking-widest text-[12px]">Back to Checkout</button>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {paymentSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-emerald-600 flex flex-col items-center justify-center p-6 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 12, stiffness: 200 }}
                            className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl"
                        >
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                                <Check size={64} className="text-emerald-600 stroke-[4px]" />
                            </motion.div>
                        </motion.div>
                        
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-2">
                            <h2 className="text-white text-[28px] font-black tracking-tight leading-none uppercase">PAYMENT SUCCESSFUL</h2>
                            <p className="text-emerald-100 text-[15px] font-bold tracking-widest uppercase opacity-80">Order sent to kitchen instantly</p>
                        </motion.div>

                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} className="mt-12 bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                            <span className="text-white font-black text-[24px]">₹{totalAmount}</span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center font-bold text-neutral-400 uppercase tracking-widest">Waking up secure pipeline...</div>}>
            <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
            <CheckoutContent />
        </Suspense>
    );
}
