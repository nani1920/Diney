'use client';

import { useStore } from '@/context/StoreContext';
import { useOrderStore } from '@/store/useOrderStore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Home, ArrowRight, Star } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function SuccessPage() {
    const { tenant } = useStore();
    const { setTableNumber, setOrderType } = useOrderStore();
    const params = useParams();
    const tenantSlug = params.tenantSlug as string;
    const [rating, setRating] = useState(0);

    const handleGoHome = () => {
        // Clear table context when explicitly going home after a success
        setTableNumber(null);
    };

    return (
        <main className="min-h-screen bg-white max-w-[520px] mx-auto flex flex-col items-center justify-center px-6 py-12">
            <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-8"
            >
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center space-y-3 mb-12"
            >
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
                    Come Again Soon!
                </h1>
                <p className="text-neutral-500 font-bold leading-relaxed px-4">
                    It was our pleasure serving you at <span className="text-orange-600 font-bold">{tenant?.name || 'our store'}</span>. Your bill is settled and you're all set!
                </p>
            </motion.div>

            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full bg-[#FAFAF8] rounded-3xl p-6 border border-neutral-100 mb-8"
            >
                <h3 className="text-center font-bold text-neutral-800 mb-4">How was your experience today?</h3>
                <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                            key={star}
                            onClick={() => setRating(star)}
                            className="transition-transform active:scale-90"
                        >
                            <Star 
                                className={`w-8 h-8 ${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}`} 
                            />
                        </button>
                    ))}
                </div>
                {rating > 0 && (
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-xs font-bold text-emerald-600 mt-4 animate-pulse"
                    >
                        Thank you for your feedback!
                    </motion.p>
                )}
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full space-y-3"
            >
                <Link href={`/${tenantSlug}`} onClick={handleGoHome}>
                    <button className="w-full h-14 bg-neutral-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-neutral-900/10 flex items-center justify-center gap-2 group transition-all hover:bg-neutral-800">
                        <Home className="w-5 h-5" />
                        Back to Home
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </button>
                </Link>
                <p className="text-center text-[11px] text-neutral-400 font-bold uppercase tracking-widest pt-4">
                    We can't wait to have you back!
                </p>
            </motion.div>
        </main>
    );
}
