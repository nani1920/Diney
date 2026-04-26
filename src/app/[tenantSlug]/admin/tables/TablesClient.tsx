'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTableBill, clearTableSession, addAdminTable, deleteAdminTable } from "../../../actions/orders";
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Plus, Users, Clock, Receipt, AlertCircle, X, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Table {
    id: string;
    table_number: string;
    occupancy_status: string;
    alert_status: string;
    active_session_id: string | null;
    updated_at: string;
}

export default function TablesClient({ initialTables, tenantId }: { initialTables: any[], tenantId: string }) {
    const [tables, setTables] = useState<Table[]>(initialTables);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [billData, setBillData] = useState<any | null>(null);
    const [isBillLoading, setIsBillLoading] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const router = useRouter();

    const fetchBill = async (tableNumber: string) => {
        try {
            const res = await getTableBill(tenantId, tableNumber);
            if (res?.success && res.data) {
                setBillData(res.data);
            }
        } catch (err) {
            console.error('Error fetching bill:', err);
        }
    };

    useEffect(() => {
        const tableChannel = supabase.channel(`admin_tables_${tenantId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'tables',
                filter: `tenant_id=eq.${tenantId}`
            }, (payload) => {
                if (payload.eventType === 'UPDATE') {
                    const updatedTable = payload.new as Table;
                    setTables(current => current.map(t => t.id === updatedTable.id ? { ...t, ...updatedTable } : t));
                } else if (payload.eventType === 'INSERT') {
                    const newTable = payload.new as Table;
                    setTables(current => {
                        const exists = current.find(t => t.id === newTable.id);
                        if (exists) return current;
                        return [...current, newTable].sort((a, b) => {
                            if (!a?.table_number || !b?.table_number) return 0;
                            const aNum = parseInt(a.table_number.toString().replace(/\D/g, ''));
                            const bNum = parseInt(b.table_number.toString().replace(/\D/g, ''));
                            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                            return a.table_number.toString().localeCompare(b.table_number.toString());
                        });
                    });
                } else if (payload.eventType === 'DELETE') {
                    setTables(current => current.filter(t => t.id !== payload.old.id));
                }
            })
            .subscribe();

        const orderChannel = supabase.channel(`admin_orders_${tenantId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `tenant_id=eq.${tenantId}`
            }, () => {
                if (selectedTable) {
                    fetchBill(selectedTable.table_number);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(tableChannel);
            supabase.removeChannel(orderChannel);
        };
    }, [tenantId, selectedTable]);

    const handleTableClick = async (table: Table) => {
        const occState = table.occupancy_status?.toLowerCase() || 'available';
        const isAlert = table.alert_status && table.alert_status !== 'none';
        
        if (occState !== 'occupied' && !isAlert && !table.active_session_id) {
            toast.success(`Table ${table.table_number} is available. Guests can scan the QR to order.`);
            return;
        }

        setSelectedTable(table);
        setIsBillLoading(true);
        setBillData(null);

        await fetchBill(table.table_number);
        setIsBillLoading(false);
    };

    const handleDeleteTable = async (e: React.MouseEvent, table: Table) => {
        e.stopPropagation(); // Don't open the bill drawer
        
        if (!window.confirm(`Are you sure you want to delete Table ${table.table_number}?`)) return;

        // Optimistic UI
        const tableId = table.id;
        setTables(current => current.filter(t => t.id !== tableId));

        try {
            const res = await deleteAdminTable(tenantId, tableId);
            if (res) {
                toast.success(`Table ${table.table_number} deleted.`);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete table');
            router.refresh(); // Ground truth
        }
    };

    const handleClearSession = async (paymentMode: 'cash' | 'online') => {
        if (!selectedTable) return;
        
        // OPTIMISTIC UPDATE: Instantly show the table as free in the UI
        const tableId = selectedTable.id;
        setTables(current => current.map(t => 
            t.id === tableId 
                ? { ...t, occupancy_status: 'available', alert_status: 'none', active_session_id: null } 
                : t
        ));

        setIsClearing(true);
        try {
           const result = await clearTableSession(tenantId, selectedTable.table_number, true);
           if (result) {
               toast.success(`Table ${selectedTable.table_number} settled!`, { icon: '💰' });
               setSelectedTable(null);
           }
        } catch (error: any) {
           // ROLLBACK on failure
           toast.error(error.message || 'Failed to clear table');
           router.refresh(); // Refresh to get ground truth from server
        } finally {
           setIsClearing(false);
        }
    };

    const handleAddTable = async () => {
        const nextNumber = tables.length + 1;
        setIsAdding(true);
        try {
            const res = await addAdminTable(tenantId, nextNumber.toString());
            if (res && res.success === false) {
                toast.error(res.error || 'Failed to add table');
            } else {
                toast.success(`Table ${nextNumber} added`);
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to add table');
        } finally {
            setIsAdding(false);
        }
    };

    const occupiedCount = tables.filter(t => {
        const s = t.occupancy_status?.toLowerCase() || 'available';
        const a = t.alert_status || 'none';
        return s === 'occupied' || a === 'bill' || a === 'service';
    }).length;

    return (
        <div className="max-w-6xl mx-auto space-y-6 relative pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Floor Map</h1>
                    <p className="text-neutral-500 font-medium mt-1">
                        {occupiedCount} of {tables.length} tables currently occupied
                    </p>
                </div>
                <button 
                  onClick={handleAddTable}
                  disabled={isAdding}
                  className="bg-neutral-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-neutral-800 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Table
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tables.map(table => {
                    const occLower = table.occupancy_status?.toLowerCase() || 'available';
                    const alertStatus = table.alert_status || 'none';
                    const isOccupied = occLower === 'occupied' && table.active_session_id;
                    const isBillRequested = alertStatus === 'bill';
                    const isServiceNeeded = alertStatus === 'service';
                    const isActive = isOccupied || isBillRequested || isServiceNeeded;
                    
                    return (
                        <motion.div
                            key={table.id}
                            className="relative group"
                        >
                            {!isActive && (
                                <button 
                                    onClick={(e) => handleDeleteTable(e, table)}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-red-100 rounded-full flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 transition-all shadow-sm z-20 opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleTableClick(table)}
                                className={`w-full p-5 rounded-3xl border-2 text-left transition-all relative overflow-hidden ${
                                    isBillRequested 
                                        ? 'bg-amber-50 border-amber-400 shadow-lg shadow-amber-100 ring-2 ring-amber-400 ring-opacity-50 animate-pulse' 
                                        : isServiceNeeded
                                            ? 'bg-rose-50 border-rose-200 shadow-sm'
                                            : isOccupied 
                                                ? 'bg-orange-50 border-orange-200 shadow-sm shadow-orange-100/50' 
                                                : 'bg-white border-dashed border-emerald-200 hover:border-emerald-300 shadow-sm'
                                }`}
                            >
                                {isBillRequested && (
                                    <div className="absolute top-0 right-0 p-1 bg-amber-500 text-white rounded-bl-xl z-10">
                                        <Receipt className="w-3.5 h-3.5" />
                                    </div>
                                )}
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        isBillRequested ? 'bg-amber-100 text-amber-600' :
                                        isServiceNeeded ? 'bg-rose-100 text-rose-600' :
                                        isOccupied ? 'bg-orange-100/80 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                        {isBillRequested ? <Receipt className="w-5 h-5" /> : isServiceNeeded ? <AlertCircle className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        isBillRequested ? 'bg-amber-600 text-white' :
                                        isServiceNeeded ? 'bg-rose-600 text-white' :
                                        isOccupied ? 'bg-orange-600 text-white' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {isBillRequested ? 'Bill Requested' : isServiceNeeded ? 'Service Needed' : isOccupied ? 'Occupied' : 'Free'}
                                    </div>
                                </div>
                                <h3 className={`text-xl font-bold tracking-tight ${
                                    isBillRequested ? 'text-amber-900' :
                                    isServiceNeeded ? 'text-rose-900' :
                                    isOccupied ? 'text-orange-900' : 'text-emerald-900'
                                }`}>
                                    Table {table.table_number}
                                </h3>
                                {isActive && (
                                    <div className={`mt-2 text-xs font-bold flex items-center gap-1 uppercase tracking-wider ${
                                        isBillRequested ? 'text-amber-600' : isServiceNeeded ? 'text-rose-600' : 'text-orange-600/70'
                                    }`}>
                                        <Clock className="w-3.5 h-3.5" />
                                        {isBillRequested ? 'Awaiting Payment' : isServiceNeeded ? 'High Priority' : 'Active Session'}
                                    </div>
                                )}
                            </motion.button>
                        </motion.div>
                    )
                })}
            </div>

            <AnimatePresence>
                {selectedTable && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTable(null)}
                            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-[440px] max-w-[calc(100vw-20px)] bg-white z-[110] shadow-2xl flex flex-col border-l border-neutral-100"
                        >
                            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-[#FAFAF8]">
                                <div>
                                    <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Table {selectedTable.table_number}</h2>
                                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mt-1">Live Bill Management</p>
                                </div>
                                <button
                                    onClick={() => setSelectedTable(null)}
                                    className="w-10 h-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors shadow-sm"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAF8]">
                                {isBillLoading ? (
                                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-neutral-400">
                                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                                        <p className="text-sm font-semibold animate-pulse text-orange-600">Syncing with kitchen...</p>
                                    </div>
                                ) : !billData ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
                                        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-sm font-medium">Failed to retrieve items</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        
                                        <div className="space-y-3">
                                            {billData.orders?.map((order: any, idx: number) => (
                                                <div key={order.id} className="bg-white rounded-2xl p-4 border border-neutral-200/50 shadow-sm relative overflow-hidden group">
                                                    <div className="flex items-center justify-between mb-3 border-b border-neutral-100 pb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="px-2 py-0.5 rounded-md bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-500 whitespace-nowrap min-w-[40px]">
                                                                #{order.short_id || '---'}
                                                            </div>
                                                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
                                                        </div>
                                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                                            order.status === 'ready' ? 'bg-orange-100 text-orange-600' :
                                                            'bg-neutral-100 text-neutral-600'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        {order.order_items?.map((item: any, i: number) => (
                                                            <div key={i} className="flex justify-between items-start text-sm">
                                                                <div className="flex gap-2">
                                                                    <span className="font-bold text-neutral-400">{item.quantity}x</span>
                                                                    <div>
                                                                        <span className="font-semibold text-neutral-800">{item.name}</span>
                                                                        {item.customizations?.length > 0 && (
                                                                            <p className="text-[10px] text-neutral-400 mt-0.5">
                                                                                {item.customizations.map((c: any) => c.name).join(', ')}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <span className="font-bold text-neutral-900">₹{item.price * item.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            {(!billData.orders || billData.orders.length === 0) && (
                                                <p className="text-center text-sm font-medium text-neutral-400 py-4">No items ordered yet.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!isBillLoading && billData && (
                                <div className="p-6 bg-white border-t border-neutral-100">
                                    <div className="bg-orange-50 rounded-2xl p-5 mb-5 border border-orange-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-bold text-orange-800/60 uppercase tracking-wider">Grand Total</span>
                                            <span className="text-2xl font-bold text-orange-600 tracking-tight">₹{billData.subtotal || 0}</span>
                                        </div>
                                        {billData.totalPaid > 0 && (
                                            <p className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> ₹{billData.totalPaid} already paid online
                                            </p>
                                        )}
                                        {billData.totalUnpaid > 0 && billData.totalPaid > 0 && (
                                            <p className="text-[11px] font-bold text-orange-600 mt-1">₹{billData.totalUnpaid} remaining balance</p>
                                        )}
                                    </div>
                                    
                                    <button
                                        onClick={() => handleClearSession('cash')}
                                        disabled={isClearing}
                                        className="w-full h-14 bg-neutral-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors disabled:opacity-50"
                                    >
                                        {isClearing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
                                        {isClearing ? 'Clearing Table...' : 'Settle & Clear Table'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
