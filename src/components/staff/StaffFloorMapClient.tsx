'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    Plus, 
    Trash2, 
    LayoutGrid, 
    MousePointer2, 
    MoreHorizontal,
    Utensils,
    AlertCircle,
    Check,
    Bell,
    Receipt,
    ChefHat,
    XCircle,
    Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { addAdminTable, deleteAdminTable, clearTableSession, acknowledgeTableAlert, markTableOrdersAsServed, claimTable, releaseTable } from '@/app/actions/orders';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { playAlertChime, playNotificationChime } from '@/lib/sounds';

interface StaffFloorMapClientProps {
    initialTables: any[];
    staffMembers?: any[];
    tenantId: string;
    tenantSlug: string;
    staff: any;
}

export default function StaffFloorMapClient({ initialTables, staffMembers = [], tenantId, tenantSlug, staff }: StaffFloorMapClientProps) {
    const isManager = staff?.role === 'admin' || staff?.role === 'manager';
    const router = useRouter();
    const [tables, setTables] = useState(initialTables);
    const [isAdding, setIsAdding] = useState(false);
    const [newTableNumber, setNewTableNumber] = useState('');
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const prevTablesRef = useRef(initialTables);

    // helper to get staff name
    const getStaffName = (id: string | null) => {
        if (!id) return null;
        return staffMembers.find(s => s.id === id)?.name || "Staff";
    };

    // Audio Notifications Effect
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

    useEffect(() => {
        const channel = supabase
            .channel('floor-map-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tables', filter: `tenant_id=eq.${tenantId}` },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        setTables(current => current.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
                    } else if (payload.eventType === 'INSERT') {
                        setTables(current => [...current, payload.new].sort((a,b) => a.table_number.localeCompare(b.table_number)));
                    } else if (payload.eventType === 'DELETE') {
                        setTables(current => current.filter(t => t.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [tenantId]);

    const handleAddTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTableNumber) return;
        setIsAdding(true);
        try {
            const res = await addAdminTable(tenantId, newTableNumber);
            if (res) {
                toast.success(`Table ${newTableNumber} added`);
                setNewTableNumber('');
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to add table");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteTable = async (tableId: string, tableNumber: string) => {
        if (!confirm(`Are you sure you want to remove Table ${tableNumber}?`)) return;
        try {
            const res = await deleteAdminTable(tenantId, tableId);
            if (res) toast.success(`Table ${tableNumber} removed`);
        } catch (err: any) {
            toast.error(err.message || "Cannot delete active table");
        }
    };

    const handleClearTable = async (tableNumber: string) => {
        try {
            const res = await clearTableSession(tenantId, tableNumber, true);
            if (res.success) toast.success(`Table ${tableNumber} is now available`);
        } catch (err) {
            toast.error("Failed to clear table");
        }
    };

    const handleAcknowledge = async (tableNumber: string) => {
        setIsUpdating(tableNumber);
        try {
            const res = await acknowledgeTableAlert(tenantId, tableNumber);
            if (res.success) toast.success(`Table ${tableNumber} alert cleared`);
        } catch (err) {
            toast.error("Failed to clear alert");
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

    const handleMarkServed = async (tableNumber: string) => {
        setIsUpdating(tableNumber);
        try {
            const res = await markTableOrdersAsServed(tenantId, tableNumber);
            if (res) toast.success(`Table ${tableNumber} food served!`, { icon: '🍽️' });
        } catch (err) {
            toast.error("Failed to mark as served");
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Quick Add Bar - Manager Only */}
            {isManager && (
                <div className="bg-white border border-neutral-100 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
                    <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-xl w-full md:w-auto justify-center md:justify-start">
                        <LayoutGrid className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Add Table</span>
                    </div>
                    <form onSubmit={handleAddTable} className="flex-1 flex gap-2 w-full">
                        <input 
                            type="text"
                            placeholder="Table Number (e.g. 10)"
                            value={newTableNumber}
                            onChange={(e) => setNewTableNumber(e.target.value)}
                            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 px-4 text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-neutral-400 text-neutral-900 font-medium"
                        />
                        <button 
                            type="submit"
                            disabled={isAdding}
                            className="bg-emerald-600 text-white font-black px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100 shrink-0 italic"
                        >
                            {isAdding ? "..." : <><Plus className="w-4 h-4" /> Add Table</>}
                        </button>
                    </form>
                </div>
            )}

            {/* Grid View — standardized across mobile and desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                <AnimatePresence mode="popLayout">
                    {tables.length === 0 ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                                <LayoutGrid className="w-8 h-8 text-neutral-300" />
                            </div>
                            <h3 className="text-lg font-black italic uppercase tracking-tighter text-neutral-400">No tables configured</h3>
                            <p className="text-xs font-bold text-neutral-300 uppercase tracking-widest mt-2">Start by adding your first table above</p>
                        </div>
                    ) : tables.map((table: any) => {
                        const isOccupied = table.occupancy_status === 'occupied';
                        const isDirty = table.occupancy_status === 'dirty';
                        const isBusy = isOccupied || isDirty;
                        const readyCount = table.ready_orders_count || 0;
                        const alertType = table.alert_status;
                        const needsAttention = alertType && alertType !== 'none';
                        
                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={table.id}
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
                                        <div className="absolute top-4 inset-x-0 flex justify-center px-2 z-20 pointer-events-none text-center">
                                            {needsAttention ? (
                                                <div className={clsx(
                                                    "px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest shadow-lg animate-pulse border",
                                                    alertType === 'service' ? "bg-rose-600 border-rose-500 text-white" : "bg-amber-500 border-amber-400 text-white"
                                                )}>
                                                    {alertType === 'service' ? 'Service Needed' : 'Bill Requested'}
                                                </div>
                                            ) : (readyCount > 0 && isOccupied) ? (
                                                <div className="px-2.5 py-1 bg-neutral-900 text-white rounded-lg text-[7px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 border border-black">
                                                    <ChefHat className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                                                    {readyCount} Ready
                                                </div>
                                            ) : null}
                                        </div>

                                        <div 
                                            onClick={() => router.push(`/${tenantSlug}/staff/table/${table.table_number}`)}
                                            className="flex flex-col items-center justify-center w-full h-full p-4 group-hover:bg-neutral-50/50 transition-colors duration-500 cursor-pointer"
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
                                                {table.assigned_staff_id && (
                                                    <p className="text-[7px] font-bold text-emerald-600 uppercase tracking-tight truncate max-w-full">
                                                        {getStaffName(table.assigned_staff_id)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Hover Overlay — Desktop Only */}
                                        <div className="hidden lg:flex absolute inset-0 flex-col items-center justify-center bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 p-6 gap-2">
                                            {isUpdating === table.table_number ? (
                                                <div className="flex items-center justify-center py-2">
                                                    <Loader2 className="w-5 h-5 text-neutral-300 animate-spin" />
                                                </div>
                                            ) : (
                                                <div className="w-full flex flex-col gap-2">
                                                    {needsAttention ? (
                                                        <button onClick={(e) => { e.stopPropagation(); handleAcknowledge(table.table_number); }}
                                                            className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-black transition-all shadow-md active:scale-95 italic">
                                                            RESPOND
                                                        </button>
                                                    ) : (readyCount > 0 && isOccupied) ? (
                                                        <button onClick={(e) => { e.stopPropagation(); handleMarkServed(table.table_number); }}
                                                            className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-emerald-700 transition-all shadow-md active:scale-95 italic">
                                                            Mark Served
                                                        </button>
                                                    ) : (table.assigned_staff_id === staff.id || (isManager && table.assigned_staff_id)) ? (
                                                        <button onClick={(e) => { e.stopPropagation(); handleRelease(table.table_number); }}
                                                            className="w-full py-2.5 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-rose-100 transition-all shadow-sm active:scale-95 italic">
                                                            RELEASE TABLE
                                                        </button>
                                                    ) : (!table.assigned_staff_id && !isBusy) ? (
                                                        <button onClick={(e) => { e.stopPropagation(); handleClaim(table.table_number); }}
                                                            className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-emerald-700 transition-all shadow-md active:scale-95 italic">
                                                            CLAIM TABLE
                                                        </button>
                                                    ) : (
                                                        <button onClick={(e) => { e.stopPropagation(); router.push(`/${tenantSlug}/staff/table/${table.table_number}`); }}
                                                            className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-black transition-all shadow-md active:scale-95 italic">
                                                            View Table
                                                        </button>
                                                    )}
                                                    
                                                    {isManager && !isBusy && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id, table.table_number); }}
                                                            className="w-full py-2 bg-rose-50 text-rose-600 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-rose-100 transition-colors active:scale-95 italic">
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile/Tablet Actions */}
                                <div className="lg:hidden w-full px-2 mt-1">
                                    <div className="flex flex-col gap-1.5">
                                        {isUpdating === table.table_number ? (
                                            <div className="w-full h-10 flex items-center justify-center bg-neutral-50 rounded-xl border border-neutral-100">
                                                <Loader2 className="w-4 h-4 text-neutral-300 animate-spin" />
                                            </div>
                                        ) : (
                                            <>
                                                {needsAttention ? (
                                                    <button onClick={(e) => { e.stopPropagation(); handleAcknowledge(table.table_number); }}
                                                        className="w-full h-10 bg-neutral-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center shadow-sm italic">
                                                        RESPOND
                                                    </button>
                                                ) : (readyCount > 0 && isOccupied) ? (
                                                    <button onClick={(e) => { e.stopPropagation(); handleMarkServed(table.table_number); }}
                                                        className="w-full h-10 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center shadow-sm italic">
                                                        Served
                                                    </button>
                                                ) : table.assigned_staff_id === staff.id ? (
                                                    <button onClick={(e) => { e.stopPropagation(); handleRelease(table.table_number); }}
                                                        className="w-full h-10 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center shadow-sm italic">
                                                        RELEASE
                                                    </button>
                                                ) : (!table.assigned_staff_id && !isBusy) ? (
                                                    <button onClick={(e) => { e.stopPropagation(); handleClaim(table.table_number); }}
                                                        className="w-full h-10 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center shadow-sm italic">
                                                        CLAIM TABLE
                                                    </button>
                                                ) : (
                                                    <button onClick={(e) => { e.stopPropagation(); router.push(`/${tenantSlug}/staff/table/${table.table_number}`); }}
                                                        className="w-full h-10 bg-neutral-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center shadow-sm italic">
                                                        Open
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        
                                        {isManager && !isBusy && (
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id, table.table_number); }}
                                                className="w-full h-8 text-rose-600 text-[8px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-rose-50 rounded-lg transition-colors italic">
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
