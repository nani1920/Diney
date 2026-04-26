'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { StaffMember, Order, Table, TableOccupancyStatus, TableAlertStatus } from '@/types';
import {
    UtensilsCrossed,
    Bell,
    Clock,
    CheckCircle2,
    AlertCircle,
    Receipt,
    ChefHat,
    Check,
    Zap,
    LayoutGrid,
    User,
    UserCheck,
    Loader2,
    Users,
    XCircle,
    Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    acknowledgeTableAlert,
    markTableOrdersAsServed,
    claimTable,
    releaseTable
} from '@/app/actions/orders';
import { toast } from 'react-hot-toast';
import { playAlertChime, playNotificationChime } from '@/lib/sounds';

interface StaffDashboardClientProps {
    staff: StaffMember;
    tenantId: string;
    tenantSlug: string;
    initialTables: Table[];
    initialOrders: Order[];
    staffList: StaffMember[];
}

export default function StaffDashboardClient({
    staff,
    tenantId,
    tenantSlug,
    initialTables,
    initialOrders,
    staffList
}: StaffDashboardClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [tables, setTables] = useState<Table[]>(initialTables);
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const isManager = staff.role === 'admin' || staff.role === 'manager';
    const prevTablesRef = useRef(initialTables);

    // Helper for staff names
    const getStaffName = (staffId?: string | null) => {
        if (!staffId) return null;
        return staffList.find(s => s.id === staffId)?.name || "Staff";
    };

    // Audio Notifications Logic
    useEffect(() => {
        tables.forEach(table => {
            const prevTable = prevTablesRef.current.find(t => t.id === table.id);
            if (!prevTable) return;

            // 1. New Alert (Service/Bill)
            if (table.alert_status !== 'none' && prevTable.alert_status === 'none') {
                playAlertChime();
                toast(`Table ${table.table_number} needs attention!`, { icon: '🔔' });
            }

            // 2. New Ready Food
            if ((table.ready_orders_count || 0) > (prevTable.ready_orders_count || 0)) {
                playNotificationChime();
                toast(`Food ready for Table ${table.table_number}`, { icon: '🍳' });
            }
        });
        prevTablesRef.current = tables;
    }, [tables]);

    // 1. Real-time Subscriptions
    useEffect(() => {
        const tableChannel = supabase
            .channel('table-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tables', filter: `tenant_id=eq.${tenantId}` },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        const newTable = payload.new as Table;
                        const oldTable = tables.find(t => t.id === newTable.id);

                        setTables(current => current.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
                    } else if (payload.eventType === 'INSERT') {
                        setTables(current => [...current, payload.new as Table]);
                    } else if (payload.eventType === 'DELETE') {
                        setTables(current => current.filter(t => t.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        const orderChannel = supabase
            .channel('order-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        setOrders(current => current.map(o => o.order_id === payload.new.order_id ? { ...o, ...payload.new } : o));
                    } else if (payload.eventType === 'INSERT') {
                        setOrders(current => [payload.new as Order, ...current]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(tableChannel);
            supabase.removeChannel(orderChannel);
        };
    }, [tenantId, tables, orders]);

    // 2. Section Filtering
    const { myTables, otherTables } = useMemo(() => {
        const sorted = [...tables].sort((a, b) => a.table_number.localeCompare(b.table_number, undefined, { numeric: true }));
        return {
            myTables: sorted.filter(t => t.assigned_staff_id === staff.id),
            otherTables: sorted.filter(t => t.assigned_staff_id !== staff.id)
        };
    }, [tables, staff.id]);

    // 3. Actions
    const handleAcknowledge = async (tableNumber: string) => {
        console.log(`[StaffDashboard] Acknowledge clicked for Table ${tableNumber}`);
        setIsUpdating(tableNumber);
        try {
            const res = await acknowledgeTableAlert(tenantId, tableNumber);
            if (res.success) toast.success(`Alert resolved`);
        } catch (err) {
            console.error('[StaffDashboard] Acknowledge failed:', err);
            toast.error("Failed to clear alert");
        } finally {
            setIsUpdating(null);
        }
    };

    const handleMarkServed = async (tableNumber: string) => {
        setIsUpdating(tableNumber);
        try {
            const res = await markTableOrdersAsServed(tenantId, tableNumber);
            if (res) toast.success("Marked as served");
        } catch (err) {
            toast.error("Failed to update status");
        } finally {
            setIsUpdating(null);
        }
    };

    const handleClaim = async (tableNumber: string) => {
        setIsUpdating(tableNumber);
        try {
            await claimTable(tenantId, tableNumber, staff.id);
            toast.success("Table claimed!");
        } catch (err) {
            toast.error("Failed to claim table");
        } finally {
            setIsUpdating(null);
        }
    };

    const handleRelease = async (tableNumber: string) => {
        setIsUpdating(tableNumber);
        try {
            await releaseTable(tenantId, tableNumber);
            toast.success("Table released");
        } catch (err) {
            toast.error("Failed to release table");
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <div className="space-y-12 pb-20">
            {/* 1. Header Stats */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Overview</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <StatCard
                        icon={LayoutGrid}
                        label="My Tables"
                        value={myTables.length}
                        color="emerald"
                    />
                    <StatCard
                        icon={AlertCircle}
                        label="Active Alerts"
                        value={tables.filter(t => t.alert_status !== 'none').length}
                        color="rose"
                    />
                    <StatCard
                        icon={ChefHat}
                        label="Ready to Serve"
                        value={tables.filter(t => (t.ready_orders_count || 0) > 0).length}
                        color="blue"
                    />
                    <StatCard
                        icon={Clock}
                        label="Live Orders"
                        value={orders.filter(o => o.order_status !== 'completed' && o.order_status !== 'cancelled').length}
                        color="amber"
                    />
                </div>
            </div>

            {/* 2. Priority Alert Banner (Optional but good for real-time focus) */}
            <AnimatePresence>
                {tables.some(t => t.alert_status !== 'none' && !t.handled_by_staff_id) && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-rose-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl shadow-rose-600/20"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm uppercase tracking-wider">Unclaimed Alerts</h3>
                                <p className="text-[10px] opacity-80 font-medium">Attention needed immediately on floor map</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. My Tables Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-neutral-900 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-emerald-600" />
                        My Operations <span className="text-neutral-300">({myTables.length})</span>
                    </h2>
                    <div className="h-px flex-1 bg-neutral-100 ml-6" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {myTables.map((table) => (
                        <TableCard
                            key={table.id}
                            table={table}
                            tenantSlug={tenantSlug}
                            staffName={getStaffName(table.assigned_staff_id)}
                            handledByName={getStaffName(table.handled_by_staff_id)}
                            isMyTable={true}
                            isManager={isManager}
                            onAcknowledge={() => handleAcknowledge(table.table_number)}
                            onServe={() => handleMarkServed(table.table_number)}
                            onClaim={() => handleClaim(table.table_number)}
                            onRelease={() => handleRelease(table.table_number)}
                            isUpdating={isUpdating === table.table_number}
                        />
                    ))}
                    {myTables.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-neutral-100 rounded-[2.5rem]">
                            <p className="text-neutral-300 font-bold uppercase tracking-widest text-[10px]">No tables assigned to you</p>
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Other Tables Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-neutral-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-neutral-400" />
                        Other Tables <span className="text-neutral-300">({otherTables.length})</span>
                    </h2>
                    <div className="h-px flex-1 bg-neutral-100 ml-6" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {otherTables.map((table) => (
                        <TableCard
                            key={table.id}
                            table={table}
                            tenantSlug={tenantSlug}
                            staffName={getStaffName(table.assigned_staff_id)}
                            handledByName={getStaffName(table.handled_by_staff_id)}
                            isMyTable={false}
                            isManager={isManager}
                            onAcknowledge={() => handleAcknowledge(table.table_number)}
                            onServe={() => handleMarkServed(table.table_number)}
                            onClaim={() => handleClaim(table.table_number)}
                            onRelease={() => handleRelease(table.table_number)}
                            isUpdating={isUpdating === table.table_number}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

function TableCard({
    table,
    tenantSlug,
    staffName,
    handledByName,
    isMyTable,
    isManager,
    onAcknowledge,
    onServe,
    onClaim,
    onRelease,
    isUpdating
}: {
    table: Table;
    tenantSlug: string;
    staffName: string | null;
    handledByName: string | null;
    isMyTable: boolean;
    isManager: boolean;
    onAcknowledge: () => void;
    onServe: () => void;
    onClaim: () => void;
    onRelease: () => void;
    isUpdating: boolean;
}) {
    const isOccupied = table.occupancy_status?.toLowerCase() === 'occupied';
    const isDirty = table.occupancy_status?.toLowerCase() === 'dirty';
    const alertType = table.alert_status || 'none';
    const readyCount = table.ready_orders_count || 0;
    const needsAttention = alertType !== 'none';

    const ActionButtons = () => (
        <div className="w-full space-y-2">
            {isUpdating ? (
                <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-5 h-5 text-neutral-300 animate-spin" />
                </div>
            ) : (
                <>
                    {alertType !== 'none' ? (
                        <div className="space-y-1.5">
                            <button
                                onClick={(e) => { e.stopPropagation(); onAcknowledge(); }}
                                className="w-full h-10 md:h-11 bg-neutral-900 text-white rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                            >
                                RESPOND
                            </button>
                        </div>
                    ) : (readyCount > 0 && isOccupied) ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onServe(); }}
                            className="w-full h-10 md:h-11 bg-emerald-600 text-white rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                        >
                            Serve {readyCount} Item{readyCount > 1 ? 's' : ''}
                        </button>
                    ) : isOccupied ? (
                        <div className="space-y-2">
                            <Link
                                href={`/${tenantSlug}/staff/table/${table.table_number}`}
                                className="lg:hidden w-full h-10 bg-neutral-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center shadow-lg shadow-black/10"
                            >
                                View Orders
                            </Link>
                            {(isMyTable || (isManager && table.assigned_staff_id)) && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRelease(); }}
                                    className="w-full h-9 bg-rose-50 text-rose-600 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
                                >
                                    Release Table
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {!isMyTable && !table.assigned_staff_id ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onClaim(); }}
                                    className="w-full h-10 md:h-11 bg-emerald-600 text-white rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                                >
                                    Claim Table
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <p className="lg:hidden text-[7px] font-black text-emerald-600 uppercase tracking-widest text-center">
                                        {isMyTable ? 'Your Table' : `Assigned to ${staffName}`}
                                    </p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onRelease(); }}
                                        className="w-full h-10 bg-neutral-100 text-neutral-400 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:text-rose-500 hover:bg-rose-50 transition-all"
                                    >
                                        Release
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );

    return (
        <motion.div
            layout
            className="relative group flex flex-col items-center"
        >
            {/* The Visual Table Unit (Architectural Style) */}
            <div className="relative w-full aspect-square flex items-center justify-center p-6">
                {/* 🪑 The Chairs - Minimalist capsules */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                    <div className={clsx("absolute top-2 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full transition-all duration-700 shadow-sm", isOccupied ? "bg-emerald-500" : isDirty ? "bg-amber-500" : "bg-neutral-200")} />
                    <div className={clsx("absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full transition-all duration-700 shadow-sm", isOccupied ? "bg-emerald-500" : isDirty ? "bg-amber-500" : "bg-neutral-200")} />
                    <div className={clsx("absolute left-2 top-1/2 -translate-y-1/2 h-8 w-2 rounded-full transition-all duration-700 shadow-sm", isOccupied ? "bg-emerald-500" : isDirty ? "bg-amber-500" : "bg-neutral-200")} />
                    <div className={clsx("absolute right-2 top-1/2 -translate-y-1/2 h-8 w-2 rounded-full transition-all duration-700 shadow-sm", isOccupied ? "bg-emerald-500" : isDirty ? "bg-amber-500" : "bg-neutral-200")} />
                </div>

                {/* 🍽️ Main Table Body - Matte Industrial */}
                <div className={clsx(
                    "relative w-full h-full rounded-[2.25rem] border-[1.5px] flex flex-col items-center justify-center transition-all duration-500 z-10 shadow-xl overflow-hidden",
                    needsAttention ? "animate-border-pulse-amber border-amber-500 bg-white" :
                    (readyCount > 0 && isOccupied) ? "border-emerald-500 bg-white" :
                    isOccupied ? "border-emerald-600 bg-white" : 
                    isDirty ? "border-amber-400 bg-white" :
                    "border-neutral-100 bg-neutral-50/50"
                )}>
                    {/* Status Badge - Pinned to Top */}
                    <div className="absolute top-4 inset-x-0 flex justify-center px-2 z-20 pointer-events-none">
                        {needsAttention ? (
                            <div className={clsx(
                                "px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest shadow-lg animate-pulse border",
                                alertType === 'service' ? "bg-rose-600 border-rose-500 text-white" : "bg-amber-500 border-amber-400 text-white"
                            )}>
                                {alertType === 'service' ? 'Service Needed' : 'Bill Requested'}
                            </div>
                        ) : (readyCount > 0 && isOccupied) ? (
                            <div className="px-2.5 py-1 bg-neutral-900 text-white rounded-lg text-[7px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 border border-black">
                                <Zap className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                                {readyCount} Item{readyCount > 1 ? 's' : ''} Ready
                            </div>
                        ) : null}
                    </div>

                    <Link 
                        href={`/${tenantSlug}/staff/table/${table.table_number}`}
                        className="flex flex-col items-center justify-center w-full h-full p-4 group-hover:bg-neutral-50/50 transition-colors duration-500"
                    >
                        <div className={clsx(
                            "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 mb-2 relative border-[1.5px]",
                            isOccupied ? "bg-white border-emerald-500 text-emerald-600 shadow-sm" : 
                            isDirty ? "bg-white border-amber-400 text-amber-600 shadow-sm" :
                            "bg-white border-neutral-100 text-neutral-300"
                        )}>
                            <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 mb-0.5 leading-none">Table</span>
                            <h4 className="text-xl md:text-2xl font-black leading-none tracking-tight italic">{table.table_number}</h4>
                        </div>

                        <div className="text-center px-2 w-full">
                            <p className={clsx(
                                "text-[9px] font-black uppercase tracking-[0.15em] mb-0.5 truncate", 
                                isOccupied ? "text-emerald-900" : isDirty ? "text-amber-900" : "text-neutral-400"
                            )}>
                                {isOccupied ? (table.customer_name || 'In Use') : isDirty ? 'Cleaning' : 'Free'}
                            </p>
                        </div>
                    </Link>

                    {/* Desktop Hover Overlay - Minimalist Blur */}
                    <div className="hidden lg:flex absolute inset-0 flex-col items-center justify-center bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 p-6 gap-2">
                        <ActionButtons />
                        <Link 
                            href={`/${tenantSlug}/staff/table/${table.table_number}`}
                            className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-black transition-all shadow-md active:scale-95 italic"
                        >
                            Open Details
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Actions - Compact Industrial */}
            <div className="lg:hidden w-full px-2 mt-1">
                <ActionButtons />
            </div>
        </motion.div>
    );
}


function StatCard({ icon: Icon, label, value, color }: any) {
    const colors = {
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
    } as any;

    return (
        <div className="bg-white p-3 md:p-4 rounded-3xl md:rounded-[2.5rem] border border-neutral-100 shadow-sm flex items-center gap-2.5 md:gap-4 transition-all hover:shadow-md">
            <div className={clsx("w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center border shrink-0", colors[color])}>
                <Icon className="w-4.5 h-4.5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-wide mb-0.5 md:mb-1 leading-tight">{label}</p>
                <p className="text-lg md:text-2xl font-black text-neutral-900 tracking-tighter leading-none">{value}</p>
            </div>
        </div>
    );
}
