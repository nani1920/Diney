'use client';

import { useStore } from '@/context/StoreContext';
import Link from 'next/link';

export default function CartPage() {
    const { cart, updateCartQuantity, clearCart } = useStore();

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = 20;

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-8 flex flex-col">
            {/* Enhanced Header */}
            <header className="px-4 py-4 flex items-center justify-between glass sticky top-0 z-10 border-b border-gray-100">
                <Link href="/" className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center active:scale-95 transition-all">
                    <span className="text-base">←</span>
                </Link>
                <h1 className="text-lg font-bold">My Cart</h1>
                <div className="w-10"></div>
            </header>

            <div className="container flex-1 animate-enter">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                        <div className="text-6xl mb-6 opacity-20 animate-scale">🛒</div>
                        <h2 className="text-lg font-bold mb-2 text-gray-800">Your cart is empty</h2>
                        <p className="text-gray-400 font-medium mb-8">Add some delicious items!</p>
                        <Link href="/" className="btn btn-primary">
                            Browse Menu
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4 mt-6">
                        {cart.map((item, index) => (
                            <div
                                key={item.id}
                                className="bg-white p-4 rounded-3xl shadow-sm hover:shadow-md flex items-center gap-4 transition-all border border-gray-50 animate-scale"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Enhanced Thumbnail */}
                                <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                                    {item.name.toLowerCase().includes('burger') || item.name.toLowerCase().includes('wrap') ? '🍔' :
                                        item.name.toLowerCase().includes('momos') || item.name.toLowerCase().includes('pizza') ? '🍕' :
                                            item.name.toLowerCase().includes('coffee') ? '🥤' : '🍟'}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-800 text-base truncate mb-1">{item.name}</h3>
                                    <p className="text-red-500 font-bold text-base">₹{item.price}</p>
                                </div>

                                {/* Enhanced Counter */}
                                <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100">
                                    <button
                                        onClick={() => updateCartQuantity(item.id, -1)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-500 font-bold text-lg transition-colors hover:scale-110 active:scale-95"
                                    >
                                        −
                                    </button>
                                    <span className="text-base font-bold w-6 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateCartQuantity(item.id, 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all hover:scale-110 active:scale-95"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Enhanced Promo Code */}
                {cart.length > 0 && (
                    <>
                        <div className="mt-8 flex gap-3 animate-enter delay-1">
                            <div className="flex-1 bg-white h-14 rounded-2xl flex items-center px-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <span className="text-red-500 text-2xl mr-3">🎫</span>
                                <input
                                    placeholder="Have a promo code?"
                                    className="w-full outline-none text-sm bg-transparent placeholder:text-gray-400"
                                />
                            </div>
                            <button className="bg-gradient-to-br from-red-500 to-red-600 text-white px-7 rounded-2xl font-bold text-sm shadow-lg shadow-red-200 hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                                Apply
                            </button>
                        </div>

                        {/* Enhanced Bill Summary */}
                        <div className="mt-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-50 animate-enter delay-2">
                            <h3 className="font-bold text-gray-800 mb-4 text-base">Bill Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-semibold text-gray-800">₹{totalAmount}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Delivery Fee</span>
                                    <span className="font-semibold text-gray-800">₹{deliveryFee}</span>
                                </div>
                                <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
                                    <span className="font-bold text-gray-800">Total</span>
                                    <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                                        ₹{totalAmount + deliveryFee}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Checkout Button */}
                        <Link href="/checkout" className="block mt-6 animate-enter delay-3">
                            <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-5 rounded-3xl font-bold text-base shadow-xl shadow-red-500/30 tracking-wide hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98]">
                                Proceed to Checkout
                            </button>
                        </Link>
                    </>
                )}
            </div>
        </main>
    );
}
