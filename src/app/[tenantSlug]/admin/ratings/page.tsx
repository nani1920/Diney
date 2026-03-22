'use client';

import { useParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { RatingsView } from '@/components/admin/RatingsView';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export default function AdminRatingsPage() {
    const { tenant } = useStore();
    const params = useParams();

    if (!tenant) return null;

    return (
        <main className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-6xl mx-auto px-6 py-6">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-600 mb-2">
                            <Star className="w-4 h-4 fill-emerald-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Feedback Management</span>
                        </div>
                        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Customer Ratings</h1>
                        <p className="text-neutral-500 text-sm mt-1 font-medium">Monitor customer satisfaction and reviews across your store.</p>
                    </div>
                </header>

                <RatingsView tenantId={tenant.id} />
            </div>
        </main>
    );
}
