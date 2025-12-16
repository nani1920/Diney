'use client';

import { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

export default function CheckoutPage() {
    const { cart, placeOrder } = useStore();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        note: ''
    });

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handlePlaceOrder = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation with toast notifications
        if (!formData.name.trim()) {
            toast.error('Please enter your name', {
                duration: 3000,
                position: 'top-center',
            });
            return;
        }

        if (!formData.mobile || formData.mobile.length < 10) {
            toast.error('Please enter a valid 10-digit mobile number', {
                duration: 3000,
                position: 'top-center',
            });
            return;
        }

        // Save mobile number to localStorage for order tracking
        localStorage.setItem('customerMobile', formData.mobile);

        toast.success('Order placed successfully!', {
            duration: 2000,
            position: 'top-center',
        });

        const newOrder = placeOrder(formData);
        setTimeout(() => {
            router.push(`/order/${newOrder.order_id}`);
        }, 500);
    }

    return (
        <>
            <Toaster />
            <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-8 flex flex-col">
                <header className="px-4 py-4 flex items-center gap-3 glass sticky top-0 z-10 border-b border-gray-100">
                    <Link href="/cart" className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center active:scale-95 transition-all">
                        <span className="text-base">←</span>
                    </Link>
                    <h1 className="text-lg font-bold">Checkout</h1>
                </header>

                <div className="container flex-1 animate-enter">
                    <h2 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4 mt-5">Delivery Details</h2>

                    {/* Enhanced Address Card */}
                    <div className="bg-white p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 mb-8 border-l-4 border-red-500 animate-scale">
                        <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center text-red-500 text-2xl">
                            🏠
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-base mb-1">Food Truck Pickup</h3>
                            <p className="text-sm text-gray-500">Collect at counter</p>
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        </div>
                    </div>

                    <form onSubmit={handlePlaceOrder} className="flex flex-col gap-6">
                        <div className="animate-enter delay-1">
                            <label className="block text-sm font-bold mb-4 ml-1 text-gray-700">Personal Information</label>
                            <div className="space-y-4">
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl">👤</span>
                                    <input
                                        type="text"
                                        placeholder="Your Name"
                                        className="w-full bg-white h-16 pl-16 pr-6 rounded-2xl shadow-sm border border-gray-100 outline-none text-base placeholder:text-gray-400 focus:border-red-500 focus:shadow-md transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl">📱</span>
                                    <input
                                        type="tel"
                                        placeholder="Mobile Number"
                                        className="w-full bg-white h-16 pl-16 pr-6 rounded-2xl shadow-sm border border-gray-100 outline-none text-base placeholder:text-gray-400 focus:border-red-500 focus:shadow-md transition-all"
                                        value={formData.mobile}
                                        onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="animate-enter delay-2">
                            <label className="block text-sm font-bold mb-4 ml-1 text-gray-700">Special Instructions (Optional)</label>
                            <div className="relative">
                                <span className="absolute left-5 top-5 text-xl">📝</span>
                                <textarea
                                    placeholder="Any special requests? (e.g., less spicy)"
                                    className="w-full bg-white p-5 pl-16 rounded-2xl shadow-sm border border-gray-100 outline-none text-base placeholder:text-gray-400 focus:border-red-500 focus:shadow-md transition-all resize-none h-32"
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Enhanced Payment Summary */}
                        <div className="mt-6 bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-3xl border border-red-100 animate-enter delay-3">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600 font-medium">Total Amount</span>
                                <span className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                                    ₹{totalAmount}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-2 mt-3">
                                <span>💳</span>
                                Pay with Cash/UPI at counter
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-5 rounded-3xl font-bold text-base shadow-xl shadow-red-500/30 tracking-wide hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98] mt-4 animate-enter delay-4"
                        >
                            Place Order • ₹{totalAmount}
                        </button>
                    </form>
                </div>
            </main>
        </>
    );
}
