'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getAllPlatformRatings, getAllTenants } from '@/app/actions/super-admin';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Calendar, User, Store, ChevronDown, Check } from 'lucide-react';
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
    tenants: {
        name: string;
        slug: string;
    };
}

export function PlatformRatingsView() {
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [allTenants, setAllTenants] = useState<{id: string, name: string}[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStar, setFilterStar] = useState<number>(0);
    const [filterStore, setFilterStore] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [ratingsRes, tenantsRes] = await Promise.all([
                    getAllPlatformRatings(),
                    getAllTenants()
                ]);
                
                if (ratingsRes.success && ratingsRes.data) {
                    setRatings(ratingsRes.data as Rating[]);
                }
                
                if (tenantsRes.success && tenantsRes.data) {
                    setAllTenants(tenantsRes.data);
                }
            } catch (error) {
                console.error("Failed to load global ratings data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);



    const filteredRatings = useMemo(() => {
        return ratings.filter(r => {
            const matchesStar = filterStar === 0 || r.rating === filterStar;
            const matchesStore = filterStore === 'all' || r.tenants?.name === filterStore;
            const matchesSearch = searchQuery === '' || 
                (r.orders?.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.orders?.short_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.feedback || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.tenants?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStar && matchesStore && matchesSearch;
        });
    }, [ratings, filterStar, filterStore, searchQuery]);

    const averageRating = ratings.length > 0 
        ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1)
        : '0.0';

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 p-4 animate-pulse">
                <div className="h-32 bg-neutral-900/50 rounded-3xl w-full" />
                <div className="h-24 bg-neutral-900/30 rounded-2xl w-full" />
                <div className="h-24 bg-neutral-900/30 rounded-2xl w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-red-600 rounded-lg shadow-lg shadow-red-600/20">
                    <Star size={20} className="text-white fill-white" />
                </div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                    Platform Reviews
                </h2>
            </div>

            {/* Overview Stats */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900/40 rounded-[2rem] p-8 text-white relative overflow-hidden border border-white/5"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Global Customer Satisfaction</h2>
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black tracking-tighter text-white">{averageRating}</span>
                            <div className="flex flex-col">
                                <div className="flex gap-0.5 mb-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star 
                                            key={s} 
                                            className={clsx(
                                                "w-4 h-4",
                                                s <= Math.round(Number(averageRating)) ? "text-amber-400 fill-amber-400" : "text-neutral-700"
                                            )} 
                                        />
                                    ))}
                                </div>
                                <span className="text-neutral-500 text-xs font-bold font-mono uppercase tracking-widest">
                                    Derived from {ratings.length} reviews across {allTenants.length} SaaS instances
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Filters Bar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between bg-neutral-900/20 p-2 rounded-3xl border border-white/5">
                <div className="flex flex-wrap gap-2 items-center px-2">
                    <div className="flex bg-neutral-900/50 p-1 rounded-2xl overflow-x-auto scrollbar-hide border border-white/5">
                        {[0, 5, 4, 3, 2, 1].map((star) => (
                            <button
                                key={star}
                                onClick={() => setFilterStar(star)}
                                className={clsx(
                                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0",
                                    filterStar === star 
                                        ? "bg-white text-black shadow-sm" 
                                        : "text-neutral-500 hover:text-white"
                                )}
                            >
                                {star === 0 ? 'All Ratings' : (
                                    <div className="flex items-center gap-1">
                                        {star} <Star className={clsx("w-3 h-3", filterStar === star ? "fill-amber-500 text-amber-500" : "fill-neutral-500 text-neutral-500")} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {allTenants.length > 0 && (
                        <CustomDropdown 
                            value={filterStore}
                            onChange={(val) => setFilterStore(val)}
                            options={[
                                { label: 'All SaaS Tenants', value: 'all' },
                                ...allTenants.map(store => ({ label: store.name, value: store.name }))
                            ]}
                        />
                    )}
                </div>

                <div className="relative w-full xl:w-72">
                    <input 
                        type="text"
                        placeholder="Search name, order, feedback..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-900/50 border border-white/5 rounded-2xl px-5 py-3 text-[12px] font-bold text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Content List */}
            <div className="space-y-4">
                {filteredRatings.length === 0 ? (
                    <div className="text-center py-24 bg-neutral-900/20 rounded-[2rem] border-2 border-dashed border-white/5">
                        <Star className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                        <p className="text-neutral-500 font-bold max-w-sm mx-auto mb-10 text-sm italic uppercase tracking-widest opacity-60">No reviews found matching your filters.</p>
                    </div>
                ) : (
                    filteredRatings.map((rating, idx) => (
                        <motion.div
                            key={rating.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-neutral-900/40 p-6 rounded-[2rem] border border-white/5 shadow-sm hover:border-red-500/20 hover:bg-neutral-900/60 transition-all group"
                        >
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="md:w-32 shrink-0">
                                    <div className="flex gap-0.5 mb-3">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star 
                                                key={s} 
                                                className={clsx(
                                                    "w-4 h-4",
                                                    s <= rating.rating ? "text-emerald-500 fill-emerald-500" : "text-neutral-800"
                                                )} 
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(rating.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4 flex-col sm:flex-row gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-neutral-800 flex items-center justify-center border border-white/5">
                                                <User className="w-5 h-5 text-neutral-400" />
                                            </div>
                                            <div>
                                                <span className="text-[14px] font-black text-white leading-none block mb-1">
                                                    {rating.orders?.customer_name || 'Anonymous'}
                                                </span>
                                                <span className="text-[10px] font-bold text-neutral-500 font-mono uppercase">
                                                    Order #{rating.orders?.short_id}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {rating.tenants && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/10 text-red-500 rounded-lg border border-red-500/20 shrink-0">
                                                <Store className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-wider">{rating.tenants.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {rating.tags && rating.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {rating.tags.map((tag, i) => (
                                                <span 
                                                    key={i} 
                                                    className="px-3 py-1 bg-white/5 text-neutral-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/5"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {rating.feedback && (
                                        <div className="bg-black/40 rounded-2xl p-4 text-[13px] font-medium text-neutral-300 leading-relaxed border border-white/5 italic">
                                            "{rating.feedback}"
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

function CustomDropdown({ value, options, onChange }: { value: string, options: { label: string, value: string }[], onChange: (val: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const currentOption = options.find(o => o.value === value) || options[0];

    return (
        <div className="relative z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-neutral-900/50 text-white border border-white/5 rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-widest outline-none hover:border-white/20 hover:bg-neutral-900/80 transition-all cursor-pointer min-w-[200px] justify-between shadow-sm"
            >
                <span className="truncate">{currentOption.label}</span>
                <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform duration-300 text-neutral-400", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute top-full mt-2 lg:right-0 w-full lg:w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 py-2 shadow-black/50"
                        >
                            <div className="max-h-64 overflow-y-auto scrollbar-hide">
                                {options.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-between",
                                            value === option.value 
                                                ? "bg-red-500/10 text-red-500" 
                                                : "text-neutral-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <span className="truncate">{option.label}</span>
                                        {value === option.value && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
