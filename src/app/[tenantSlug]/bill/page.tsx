'use client';

import { useStore } from '@/context/StoreContext';
import { useOrderStore } from '@/store/useOrderStore';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Receipt, Utensils, AlertCircle, Bell } from 'lucide-react';
import { getTableBill, requestTableCheckout, callWaiter } from '@/app/actions/orders';
import ResilientImage from "@/components/ResilientImage";
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import clsx from 'clsx';

function getFoodEmoji(name: string) {
    const emojis: Record<string, string> = {
        'pizza': '🍕', 'burger': '🍔', 'pasta': '🍝', 'sandwich': '🥪', 'salad': '🥗', 'sushi': '🍣', 'taco': '🌮', 'cake': '🍰', 'coffee': '☕', 'juice': '🍹', 'beer': '🍺', 'chicken': '🍗', 'fries': '🍟', 'ice cream': '🍦', 'donut': '🍩', 'cookie': '🍪', 'wrap': '🌯', 'soup': '🥣', 'noodles': '🍜', 'rice': '🍚', 'curry': '🍛', 'momos': '🥟', 'paneer': '🧀', 'dessert': '🍮', 'shake': '🥤', 'tea': '🍵'
    };
    const lowerName = name.toLowerCase();
    for (const [key, emoji] of Object.entries(emojis)) {
        if (lowerName.includes(key)) return emoji;
    }
    return '🍱';
}

export default function LiveBillPage() {
    const [isLoading, setIsLoading] = useState(true);
    const { tenant, customer } = useStore();
    const { tableNumber, orderType } = useOrderStore();
    const [billData, setBillData] = useState<any>(null);
    const [hasMounted, setHasMounted] = useState(false);
    const params = useParams();
    const router = useRouter();
    const tenantSlug = params.tenantSlug as string;
    const [isRequesting, setIsRequesting] = useState(false);

    const [hadSession, setHadSession] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        if (!hasMounted || !tenant || !tableNumber) return;

        if (orderType !== 'DINE_IN') {
            router.replace('/');
            return;
        }

        const fetchBill = async () => {
            try {
                const res = await getTableBill(tenant.id, tableNumber, customer?.mobile);
                if (res?.success && res.data) {
                    setBillData(res.data);
                    setHadSession(true);
                } else {
                    // If no data returned (unauthorized or session cleared)
                    setBillData(null);
                    if (hadSession) {
                        router.push(`/${tenantSlug}/success`);
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchBill();

        // INSTANT SYNC: Listen for table clearing via Supabase Realtime
        const channel = supabase.channel(`table_sync_${tableNumber}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'tables',
                filter: `tenant_id=eq.${tenant.id}`
            }, (payload) => {
                const updatedTable = payload.new;
                if (updatedTable.table_number === tableNumber) {
                    // If session is cleared, it means staff settled the bill
                    if (!updatedTable.active_session_id) {
                        router.push(`/${tenantSlug}/success`);
                    } else {
                        // Sync table status (e.g. for Notify Waiter button)
                        setBillData((prev: any) => prev ? { ...prev, table_status: updatedTable.status } : null);
                    }
                }
            })
            .subscribe();

        // Keep a slower backup poll just in case of network websocket drops
        const interval = setInterval(fetchBill, 15000); 
        
        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [tenant, tableNumber, orderType, tenantSlug, router, hasMounted, hadSession]);

    const handleRequestCheckout = async () => {
        if (!tenant || !tableNumber || isRequesting) return;
        
        setIsRequesting(true);
        try {
            const res = await requestTableCheckout(tenant.id, tableNumber);
            if (res?.success) {
                toast.success("Waiter notified! A staff member is on the way.", { icon: "🧑‍🍳" });
                // Re-fetch bill to update status immediately
                const freshBill = await getTableBill(tenant.id, tableNumber, customer?.mobile);
                if (freshBill?.success && freshBill.data) {
                    setBillData(freshBill.data);
                }
            } else {
                toast.error(res?.error || "Could not request checkout.");
            }
        } catch (err) {
            toast.error("An error occurred.");
        } finally {
            setIsRequesting(false);
        }
    };

    const handleCallWaiter = async () => {
        if (!tenant || !tableNumber) return;
        
        if (isRequesting) {
            toast("Our waiter is on the way! 🏃‍♂️ If not, please try again in a moment.", { 
                icon: "⏳",
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
            return;
        }

        setIsRequesting(true);
        try {
            const res = await callWaiter(tenant.id, tableNumber);
            if (res?.success) {
                toast.success("Waiter notified!", { icon: "🔔" });
                const freshBill = await getTableBill(tenant.id, tableNumber, customer?.mobile);
                if (freshBill?.success && freshBill.data) {
                    setBillData(freshBill.data);
                }
            } else {
                toast.error(res?.error || "Could not call waiter.");
            }
        } catch (err) {
            toast.error("An error occurred.");
        } finally {
            // Cooldown for 60 seconds
            setTimeout(() => setIsRequesting(false), 60000);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'received': return 'text-blue-600 bg-blue-50';
            case 'preparing': return 'text-amber-600 bg-amber-50';
            case 'ready': return 'text-emerald-600 bg-emerald-50';
            case 'served': return 'text-purple-600 bg-purple-50';
            case 'completed': return 'text-neutral-500 bg-neutral-100';
            default: return 'text-neutral-500 bg-neutral-100';
        }
    };

    return (
        <main className="min-h-screen bg-[#FAFAF8] max-w-[520px] mx-auto pb-24">
            <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-neutral-100/60">
                <div className="px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={tableNumber ? `/?table=${tableNumber}` : '/'}>
                            <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200/50 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors shadow-sm">
                                <ArrowLeft className="w-[18px] h-[18px]" />
                            </div>
                        </Link>
                        <div>
                            <h1 className="text-[16px] font-bold text-neutral-900 tracking-[-0.01em]">Table {tableNumber}</h1>
                            <p className="text-[12px] text-orange-600 font-bold">Live Bill</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-5 py-6">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <div className="h-32 w-full bg-neutral-100 rounded-2xl animate-pulse" />
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 w-full bg-white rounded-2xl border border-neutral-100 shadow-sm animate-pulse" />
                            ))}
                        </motion.div>
                    ) : !billData || !billData.items || billData.items.length === 0 ? (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-5">
                                <Receipt className="w-8 h-8 text-orange-300" />
                            </div>
                            <h3 className="text-[18px] font-bold text-neutral-900 tracking-[-0.01em] mb-2">No active orders</h3>
                            <p className="text-[14px] text-neutral-400 font-medium mb-6 max-w-xs leading-relaxed">
                                Items you order will appear here until the table is cleared.
                            </p>
                            <Link href={tableNumber ? `/?table=${tableNumber}` : '/'}>
                                <button className="h-11 px-6 bg-orange-600 text-white rounded-xl font-bold text-[13px] hover:bg-orange-700 transition-colors shadow-sm shadow-orange-600/15">
                                    Browse Menu
                                </button>
                            </Link>
                        </motion.div>
                    ) : (
                        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            {/* Summary Card */}
                            <div className="bg-white rounded-3xl p-6 border border-neutral-200/50 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                                <div className="relative z-10 flex justify-between items-end">
                                    <div>
                                        <h2 className="text-[13px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Total Bill</h2>
                                        <div className="text-[32px] font-bold text-neutral-900 tracking-tight leading-none text-orange-600">
                                            ₹{billData.subtotal}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <h3 className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider mb-3 ml-1">Ordered Items</h3>
                                <div className="space-y-3">
                                    {billData.items.map((item: any, idx: number) => (
                                        <div key={item.id || idx} className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-neutral-50 overflow-hidden shrink-0 flex items-center justify-center text-lg border border-neutral-100 relative">
                                                    {item.image_url ? (
                                                        <ResilientImage 
                                                            src={item.image_url} 
                                                            alt={item.name} 
                                                            fill
                                                            sizes="48px"
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        getFoodEmoji(item.name)
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-[15px] font-bold text-neutral-900">{item.name}</h4>
                                                        <span className="text-[13px] font-bold text-neutral-400">x{item.quantity}</span>
                                                    </div>
                                                    <p className="text-[12px] text-neutral-400 font-medium pt-0.5">₹{item.price * item.quantity}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(item.order_status)} border`}>
                                                {item.order_status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Fixed Bottom Action */}
            {billData && billData.items.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-neutral-100 max-w-[520px] mx-auto z-50 space-y-3">
                    <div className="flex gap-3">
                        <button 
                            onClick={handleCallWaiter}
                            disabled={isRequesting || billData.table_status === 'service_requested'}
                            className="flex-1 h-14 rounded-2xl font-bold text-[14px] border-2 border-neutral-100 flex items-center justify-center gap-2 active:scale-95 transition-all text-neutral-600 disabled:opacity-50"
                        >
                            <Bell className={clsx("w-4 h-4", billData.table_status === 'service_requested' && "animate-bounce text-blue-500")} />
                            {billData.table_status === 'service_requested' ? "Waiter Notified" : "Notify Waiter"}
                        </button>
                        <button 
                            onClick={handleRequestCheckout}
                            disabled={isRequesting || billData.table_status === 'paying'}
                            className={`flex-[1.5] h-14 rounded-2xl font-bold text-[14px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2
                                ${billData.table_status === 'paying' 
                                    ? 'bg-orange-500 text-white shadow-orange-500/20 cursor-default' 
                                    : 'bg-neutral-900 text-white shadow-neutral-900/20 active:scale-95'
                                }
                                ${isRequesting ? 'opacity-70 pointer-events-none' : ''}
                            `}
                        >
                            {billData.table_status === 'paying' ? (
                                <>
                                    <Clock className="w-5 h-5" />
                                    Bill Requested
                                </>
                            ) : (
                                <>
                                    <Utensils className="w-4 h-4" />
                                    Request Checkout
                                </>
                            )}
                        </button>
                    </div>
                    {(billData.table_status === 'paying' || billData.table_status === 'service_requested') && (
                        <p className="text-[11px] text-center text-orange-600 font-bold animate-pulse">
                            {billData.table_status === 'paying' 
                                ? "Wait for staff to arrive with your bill"
                                : "A staff member is on the way to your table"}
                        </p>
                    )}
                </div>
            )}
        </main>
    );
}
