'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { playAlertChime, triggerReadyVibration } from '@/lib/sounds';
import { toast } from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import { acknowledgeTableAlert } from '@/app/actions/orders';
import { motion } from 'framer-motion';

export default function StaffNotificationListener({ tenantId }: { tenantId: string }) {
    const lastProcessedAlerts = useRef<Record<string, string>>({});

    useEffect(() => {
        if (!tenantId) return;

        const channel = supabase
            .channel(`staff_alerts_${tenantId}`)
            .on(
                'postgres_changes',
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'tables'
                },
                (payload) => {
                    if (String(payload.new.tenant_id) !== String(tenantId)) return;

                    const tableNumber = payload.new.table_number;
                    const newAlertStatus = payload.new.alert_status;
                    const oldAlertStatus = payload.old?.alert_status;
                    const newAlertTime = payload.new.last_alert_at;
                    const tableId = payload.new.id;
                    const previousAlertTime = lastProcessedAlerts.current[tableId];

                    const isNewAlert = (newAlertStatus === 'bill' && oldAlertStatus !== 'bill') || 
                                     (newAlertStatus === 'service' && oldAlertStatus !== 'service');
                    
                    const isRepeatAlert = (['bill', 'service'].includes(newAlertStatus)) && 
                                         newAlertTime && newAlertTime !== previousAlertTime;
                    
                    // Also check for new food ready or repeated notification
                    const isFoodNowReady = payload.new.ready_orders_count > 0 && 
                                         (payload.old?.ready_orders_count === 0 || !payload.old?.ready_orders_count) &&
                                         payload.new.occupancy_status === 'occupied';
                    
                    const isRepeatFoodAlert = payload.new.ready_orders_count > 0 &&
                                             newAlertTime && newAlertTime !== previousAlertTime &&
                                             payload.new.occupancy_status === 'occupied';

                    if (isNewAlert || isRepeatAlert || isFoodNowReady || isRepeatFoodAlert) {
                        if (newAlertTime) lastProcessedAlerts.current[tableId] = newAlertTime;

                        // Sound & Vibration
                        playAlertChime();
                        triggerReadyVibration();

                        // Notification Content
                        const isBill = newAlertStatus === 'bill';
                        const isService = newAlertStatus === 'service';
                        const isFoodReady = isFoodNowReady || (payload.new.ready_orders_count > 0 && !isBill && !isService);

                        const message = isBill ? 'BILL REQUESTED' : isFoodReady ? 'ORDER READY TO SERVE' : 'SERVICE REQUESTED';
                        const icon = isBill ? '💰' : isFoodReady ? '🍽️' : '🔔';

                        // Premium Toast with Acknowledgment
                        toast.custom((t) => (
                            <motion.div 
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={(_, info) => {
                                    // Swipe to dismiss (visual only, NO database update)
                                    if (Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 500) {
                                        toast.dismiss(t.id);
                                    }
                                }}
                                className={`${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-300 max-w-md w-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-gray-100 cursor-grab active:cursor-grabbing`}
                            >
                                <div className="flex-1 w-0 p-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-0.5 text-3xl">
                                            {icon}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                                                Table {tableNumber}
                                            </p>
                                            <p className="text-sm font-bold text-gray-900 leading-tight">
                                                {message}
                                            </p>
                                            <p className="text-[8px] text-neutral-400 font-bold uppercase mt-1">Swipe to Dismiss</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex border-l border-gray-100 bg-gray-50/30">
                                    <button
                                        onClick={async () => {
                                            toast.dismiss(t.id);
                                            try {
                                                await acknowledgeTableAlert(tenantId, tableNumber);
                                                toast.success(`Table ${tableNumber} Done`, { 
                                                    duration: 2000,
                                                    style: { fontSize: '11px', fontWeight: '800', borderRadius: '12px', textTransform: 'uppercase' }
                                                });
                                            } catch (err) {
                                                console.error('Failed to acknowledge:', err);
                                            }
                                        }}
                                        className="px-6 flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all active:scale-95 gap-1"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span>Ack</span>
                                    </button>
                                </div>
                            </motion.div>
                        ), {
                            id: `table-alert-${tableId}`,
                            duration: 20000,
                            position: 'top-right',
                        });
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('📡 [AlertSystem] Subscribed to alerts');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tenantId]);

    return null;
}
