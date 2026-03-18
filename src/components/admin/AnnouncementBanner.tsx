'use client';

import { useState, useEffect } from 'react';
import { getAnnouncements } from '@/app/actions/super-admin';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, Megaphone } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [visible, setVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const result = await getAnnouncements();
            if (result.success && result.data && result.data.length > 0) {
                setAnnouncements(result.data);
                setVisible(true);
            }
        };
        fetchAnnouncements();
    }, []);

    if (!visible || announcements.length === 0) return null;

    const current = announcements[currentIndex];

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'warning': return {
                bg: 'bg-amber-500',
                icon: <AlertTriangle className="w-4 h-4" />,
                text: 'text-amber-50'
            };
            case 'error': return {
                bg: 'bg-red-600',
                icon: <AlertCircle className="w-4 h-4" />,
                text: 'text-red-50'
            };
            case 'success': return {
                bg: 'bg-green-600',
                icon: <CheckCircle2 className="w-4 h-4" />,
                text: 'text-green-50'
            };
            default: return {
                bg: 'bg-blue-600',
                icon: <Info className="w-4 h-4" />,
                text: 'text-blue-50'
            };
        }
    };

    const styles = getTypeStyles(current.type);

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={clsx("relative w-full overflow-hidden", styles.bg)}
            >
                <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex-1 flex items-center gap-3">
                            <span className={clsx("p-1 rounded-lg bg-white/20", styles.text)}>
                                <Megaphone className="w-4 h-4" />
                            </span>
                            <p className={clsx("font-bold text-xs sm:text-sm tracking-tight", styles.text)}>
                                <span className="uppercase opacity-70 mr-2">{current.title}:</span>
                                {current.message}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {announcements.length > 1 && (
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
                                        className="text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        Prev
                                    </button>
                                    <span className="text-white/30 text-[10px]">{currentIndex + 1}/{announcements.length}</span>
                                    <button 
                                        onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
                                        className="text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => setVisible(false)}
                                className="p-1 rounded-md hover:bg-white/10 transition-colors"
                            >
                                <X className={clsx("w-4 h-4", styles.text)} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
