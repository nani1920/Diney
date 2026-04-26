'use client';

import { useState, useEffect } from 'react';
import { 
    Bell, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    UserCircle,
    MessageSquare,
    Zap
} from 'lucide-react';
import clsx from 'clsx';
import { acknowledgeTableAlert } from '@/app/actions/orders';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface StaffAlertsClientProps {
    initialTables: any[];
    tenantId: string;
}

export default function StaffAlertsClient({ initialTables, tenantId }: StaffAlertsClientProps) {
    const [tables, setTables] = useState(initialTables);

    useEffect(() => {
        const channel = supabase
            .channel('alerts-updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'tables', filter: `tenant_id=eq.${tenantId}` },
                (payload) => {
                    setTables(current => current.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [tenantId]);

    const handleClearTable = async (tableNumber: string) => {
        try {
            const res = await acknowledgeTableAlert(tenantId, tableNumber);
            if (res.success) toast.success(`Alert acknowledged for Table ${tableNumber}`);
        } catch (err) {
            toast.error("Failed to acknowledge alert");
        }
    };

    const alerts = tables.filter(t => t.status === 'paying' || t.status === 'service_requested');

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            <AnimatePresence mode="popLayout">
                {alerts.map((alert) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={alert.id}
                        className={clsx(
                            "bg-white border border-gray-100 rounded-2xl p-6 flex items-center justify-between gap-6 shadow-sm",
                            alert.status === 'paying' ? "border-amber-100 bg-amber-50/20" : "border-blue-100 bg-blue-50/20"
                        )}
                    >
                        <div className="flex items-center gap-6">
                            <div className={clsx(
                                "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-sm border",
                                alert.status === 'paying' ? "bg-amber-600 border-amber-500" : "bg-blue-600 border-blue-500"
                            )}>
                                <span className="text-2xl font-bold tracking-tight">{alert.table_number}</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                    {alert.status === 'paying' ? 'Payment Request' : 'Service Request'}
                                    <Zap className={clsx(
                                        "w-4 h-4 fill-current",
                                        alert.status === 'paying' ? "text-amber-500" : "text-blue-500"
                                    )} />
                                </h3>
                                <p className={clsx(
                                    "text-[10px] font-bold uppercase tracking-widest mt-1",
                                    alert.status === 'paying' ? "text-amber-600/60" : "text-blue-600/60"
                                )}>Priority Notification</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleClearTable(alert.table_number)}
                            className={clsx(
                                "p-4 rounded-xl transition-all hover:scale-105 active:scale-95 group text-white shadow-sm",
                                alert.status === 'paying' ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/10" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/10"
                            )}
                        >
                            <CheckCircle2 className="w-6 h-6" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>

            {alerts.length === 0 && (
                <div className="py-32 text-center space-y-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-100">
                        <Bell className="w-8 h-8 text-gray-200" />
                    </div>
                    <div>
                        <p className="text-gray-900 font-bold text-lg tracking-tight">All clear!</p>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">No active service notifications</p>
                    </div>
                </div>
            )}
        </div>
    );
}
