'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getTenantRatings } from '@/app/actions/orders';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Calendar, User } from 'lucide-react';
import clsx from 'clsx';

interface Rating {
    id: string;
    order_id: string;
    rating: number;
    tags: string[];
    feedback: string | null;
    created_at: string;
    orders: {
        customer_name: string;
        short_id: string;
    };
}

export function RatingsView({ tenantId }: { tenantId: string }) {
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStar, setFilterStar] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadRatings = async () => {
            const res = await getTenantRatings(tenantId);
            if (res.success && res.data) {
                setRatings(res.data as Rating[]);
            }
            setIsLoading(false);
        };
        loadRatings();
    }, [tenantId]);

    const filteredRatings = useMemo(() => {
        return ratings.filter(r => {
            const matchesStar = filterStar === 0 || r.rating === filterStar;
            const matchesSearch = searchQuery === '' || 
                (r.orders?.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.orders?.short_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.feedback || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStar && matchesSearch;
        });
    }, [ratings, filterStar, searchQuery]);

    const averageRating = ratings.length > 0 
        ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1)
        : '0.0';

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 p-4 animate-pulse">
                <div className="h-32 bg-neutral-100 rounded-3xl w-full" />
                <div className="h-24 bg-neutral-50 rounded-2xl w-full" />
                <div className="h-24 bg-neutral-50 rounded-2xl w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Overview Stats */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-neutral-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Customer Satisfaction</h2>
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-bold tracking-tighter">{averageRating}</span>
                            <div className="flex flex-col">
                                <div className="flex gap-0.5 mb-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star 
                                            key={s} 
                                            className={clsx(
                                                "w-4 h-4",
                                                s <= Math.round(Number(averageRating)) ? "text-emerald-400 fill-emerald-400" : "text-neutral-700"
                                            )} 
                                        />
                                    ))}
                                </div>
                                <span className="text-neutral-400 text-xs font-bold font-mono uppercase tracking-widest">
                                    Based on {ratings.length} reviews
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-1">
                <div className="flex bg-neutral-100 p-1 rounded-2xl w-full md:w-auto overflow-x-auto scrollbar-hide">
                    {[0, 5, 4, 3, 2, 1].map((star) => (
                        <button
                            key={star}
                            onClick={() => setFilterStar(star)}
                            className={clsx(
                                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shrink-0",
                                filterStar === star 
                                    ? "bg-white text-neutral-900 shadow-sm" 
                                    : "text-neutral-400 hover:text-neutral-600"
                            )}
                        >
                            {star === 0 ? 'All Reviews' : (
                                <div className="flex items-center gap-1">
                                    {star} <Star className={clsx("w-3 h-3", filterStar === star ? "fill-amber-400 text-amber-400" : "fill-neutral-300 text-neutral-300")} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <input 
                        type="text"
                        placeholder="Search name, order, feedback..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl px-5 py-3 text-[12px] font-bold text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-200 transition-all"
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="space-y-4">
                <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2 mb-3 px-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    Recent Feedback
                </h3>

                {filteredRatings.length === 0 ? (
                    <div className="text-center py-20 bg-neutral-50 rounded-[2rem] border-2 border-dashed border-neutral-200">
                        <Star className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                        <p className="text-neutral-400 font-bold text-sm">No reviews found matching your filters.</p>
                    </div>
                ) : (
                    filteredRatings.map((rating, idx) => (
                        <motion.div
                            key={rating.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white p-5 rounded-[1.5rem] border border-neutral-100 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="md:w-32 shrink-0">
                                    <div className="flex gap-0.5 mb-2">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star 
                                                key={s} 
                                                className={clsx(
                                                    "w-3.5 h-3.5",
                                                    s <= rating.rating ? "text-emerald-500 fill-emerald-500" : "text-neutral-100"
                                                )} 
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(rating.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-200/50">
                                                <User className="w-4 h-4 text-neutral-400" />
                                            </div>
                                            <div>
                                                <span className="text-[13px] font-bold text-neutral-900 leading-none block">
                                                    {rating.orders?.customer_name || 'Anonymous'}
                                                </span>
                                                <span className="text-[10px] font-bold text-neutral-400 font-mono uppercase">
                                                    Order #{rating.orders?.short_id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {rating.tags && rating.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {rating.tags.map((tag, i) => (
                                                <span 
                                                    key={i} 
                                                    className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {rating.feedback && (
                                        <div className="bg-neutral-50/50 rounded-2xl p-4 text-[13px] font-bold text-neutral-600 leading-relaxed border border-neutral-100">
                                            {rating.feedback}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
