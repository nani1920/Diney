'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, CheckSquare, MessageSquare, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { submitOrderRating } from '@/app/actions/orders';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface RatingModalProps {
    isOpen: boolean;
    orderId: string;
    shortId: string;
    tenantId: string;
    onClose: () => void;
}

const POSITIVE_TAGS = [
    { id: 'ux', label: 'Easy to Use', icon: '😊' },
    { id: 'checkout', label: 'Smooth Checkout', icon: '😍' },
    { id: 'speed', label: 'Fast App Performance', icon: '🤩' },
];

const NEGATIVE_TAGS = [
    { id: 'slow', label: 'App Was Slow', icon: '😕' },
    { id: 'payment', label: 'Payment Issues', icon: '😠' },
    { id: 'bugs', label: 'App Bugs / Crashes', icon: '🤯' },
];

export function RatingModal({ isOpen, orderId, shortId, tenantId, onClose }: RatingModalProps) {
    const [rating, setRating] = useState<number>(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);

    const handleRatingSelect = (val: number) => {
        setRating(val);
        setStep(2);
    };

    const toggleTag = (tagLabel: string) => {
        setSelectedTags(prev => 
            prev.includes(tagLabel) 
                ? prev.filter(t => t !== tagLabel) 
                : [...prev, tagLabel]
        );
    };

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            const res = await submitOrderRating(orderId, tenantId, rating, selectedTags, feedback);
            if (res.success) {
                toast.success('Thank you! Feedback received. 💖');
                onClose();
            } else {
                toast.error(res.error || 'Failed to submit rating');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const currentTags = rating >= 4 ? POSITIVE_TAGS : NEGATIVE_TAGS;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-white rounded-[2.5rem] w-full max-w-[400px] max-h-[90vh] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20 flex flex-col"
            >
                {/* Visual Banner - Compacted */}
                <div className="h-24 shrink-0 bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.1),transparent)]" />
                    <Star className={clsx("w-10 h-10 transition-all", rating > 0 ? "text-amber-400 fill-amber-400 scale-110" : "text-white/20")} strokeWidth={1} />
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 pt-6 custom-scrollbar">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-black text-neutral-900 tracking-tight leading-tight">
                            {rating === 0 ? "How was your experience?" : rating >= 4 ? "Excellent! What did you like?" : "We're sorry! What went wrong?"}
                        </h2>
                        <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
                            Order #{shortId}
                        </p>
                    </div>

                    {/* Step 1: Star Rating - Compacted */}
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => handleRatingSelect(star)}
                                className="relative group p-0"
                            >
                                <Star 
                                    className={clsx(
                                        "w-8 h-8 transition-all duration-300",
                                        rating >= star ? "text-amber-400 fill-amber-400 scale-125" : "text-neutral-300 group-hover:text-amber-400 group-hover:fill-amber-100"
                                    )}
                                    strokeWidth={rating >= star ? 0.5 : 1.5}
                                />
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {rating > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Step 2: Adaptive Tags */}
                                <div>
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                                            Select Feedback
                                        </h3>
                                        {rating >= 4 ? <ThumbsUp className="w-4 h-4 text-emerald-500" /> : <ThumbsDown className="w-4 h-4 text-rose-500" />}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {currentTags.map((tag) => (
                                            <button
                                                key={tag.id}
                                                onClick={() => toggleTag(tag.label)}
                                                className={clsx(
                                                    "px-4 py-2.5 rounded-full text-[12px] font-bold transition-all border-2 flex items-center gap-2",
                                                    selectedTags.includes(tag.label)
                                                        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                                                        : "bg-neutral-50 border-transparent text-neutral-600 hover:bg-neutral-100"
                                                )}
                                            >
                                                <span className="text-base">{tag.icon}</span>
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Step 3: Optional Comment */}
                                <div className="bg-neutral-50 rounded-[1.25rem] p-3 border border-neutral-100 focus-within:border-neutral-300 transition-all">
                                    <textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Add a comment... (optional)"
                                        className="w-full h-16 bg-transparent text-[13px] font-semibold text-neutral-900 outline-none placeholder:text-neutral-300 resize-none"
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full h-14 bg-neutral-900 text-white rounded-[1.25rem] font-black text-[14px] shadow-2xl shadow-neutral-900/40 hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Securely
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Close link */}
                    {rating === 0 && (
                        <button 
                            onClick={onClose}
                            className="w-full text-center text-neutral-400 text-[10px] font-black uppercase tracking-widest mt-4 hover:text-neutral-600 transition-colors"
                        >
                            Skip Feedback
                        </button>
                    )}
                </div>
                
                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #eee;
                        border-radius: 10px;
                    }
                `}</style>
            </motion.div>
        </div>
    );
}
