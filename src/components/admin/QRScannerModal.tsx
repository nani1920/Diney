'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, ShoppingBag, Clock } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useOrders } from '@/context/OrderContext';
import { Order } from '@/types';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
    const { orders, updateOrderStatus } = useOrders();
    const [scannedOrderId, setScannedOrderId] = useState<string | null>(null);
    const [scannedOrder, setScannedOrder] = useState<Order | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setScannedOrderId(null);
            setScannedOrder(null);
            setErrorMsg(null);
            setIsVerifying(false);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }, [isOpen]);

    const handleScan = (result: unknown[] | unknown) => {
        if (!result || (Array.isArray(result) && result.length === 0)) return;
        
        const rawValue = Array.isArray(result) 
            ? (result[0] as { rawValue?: string })?.rawValue 
            : (result as { text?: string })?.text || (result as string);
        if (!rawValue || typeof rawValue !== 'string') return;
        
        // We only want to handle a scan once until it's reset
        if (scannedOrderId) return;
        
        setIsVerifying(true);
        setScannedOrderId(rawValue);

        // Find the order in the active orders list
        const foundOrder = orders.find(o => o.order_id === rawValue || o.short_id === rawValue);

        if (foundOrder) {
            if (foundOrder.order_status === 'completed') {
                setErrorMsg('This order has already been completed.');
            } else if (foundOrder.order_status !== 'ready' && foundOrder.order_status !== 'preparing') {
                setScannedOrder(foundOrder);
                setErrorMsg(`Order is currently '${foundOrder.order_status}'. Are you sure you want to complete it?`);
            } else {
                setScannedOrder(foundOrder);
                setErrorMsg(null);
            }
        } else {
            setErrorMsg('Order not found on the active board. It might be an old or invalid QR code.');
        }
        
        setIsVerifying(false);
    };

    const handleComplete = async () => {
        if (!scannedOrder) return;
        try {
            await updateOrderStatus(scannedOrder.order_id, 'completed');
            toast.success('Order completed successfully!');
            onClose();
        } catch {
            toast.error('Failed to update order status');
        }
    };

    const handleBackToScanner = () => {
        setScannedOrderId(null);
        setScannedOrder(null);
        setErrorMsg(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl w-full max-w-md relative flex flex-col max-h-[90vh]"
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/10 hover:bg-black/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
                >
                    <X className="w-5 h-5 text-gray-800" />
                </button>

                {!scannedOrderId ? (
                    // SCANNER VIEW
                    <div className="flex flex-col h-full">
                        <div className="p-6 pb-4 text-center">
                            <h2 className="text-2xl font-black tracking-tight text-neutral-900 mb-1">Scan Target</h2>
                            <p className="text-sm font-medium text-neutral-500">Position the customer&apos;s QR code in the frame</p>
                        </div>
                        
                        <div className="relative flex-1 bg-black min-h-[350px]">
                            <Scanner 
                                onScan={handleScan}
                                onError={(error: unknown) => {
                                    const e = error as Error;
                                    if (e?.message?.toLowerCase().includes('secure')) {
                                        setErrorMsg('Camera access requires HTTPS or localhost. Please use http://localhost:3000 for local testing.');
                                    } else if (e?.name === 'NotAllowedError') {
                                        setErrorMsg('Camera permission denied! Please click the camera icon in your URL address bar (or site settings) and choose "Allow".');
                                    } else if (e?.name === 'NotFoundError') {
                                        setErrorMsg('No camera hardware found on this device.');
                                    } else {
                                        setErrorMsg(e?.message || 'Camera access error.');
                                    }
                                    setScannedOrderId('error');
                                }}
                                formats={['qr_code']}
                                components={{
                                    onOff: false,
                                    finder: true
                                }}
                            />
                            <div className="absolute inset-0 border-[6px] border-emerald-500/30 pointer-events-none rounded-3xl m-4" />
                        </div>
                    </div>
                ) : (
                    // VERIFICATION CARD VIEW
                    <div className="flex flex-col h-full bg-[#FAFAF8] overflow-y-auto scrollbar-hide">
                        <div className="p-6 pt-10 text-center relative overflow-hidden bg-white border-b border-neutral-100">
                            {scannedOrder && !errorMsg ? (
                                <>
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50 shadow-lg shadow-emerald-500/20">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-600" strokeWidth={3} />
                                    </div>
                                    <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Order Verified</h2>
                                    <p className="text-sm font-medium text-neutral-500 mt-1">Ready for Handover</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50 shadow-lg shadow-red-500/20">
                                        <AlertCircle className="w-10 h-10 text-red-600" strokeWidth={3} />
                                    </div>
                                    <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Attention Needed</h2>
                                </>
                            )}
                        </div>

                        <div className="p-6 space-y-6">
                            {errorMsg && (
                                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                                    <p className="text-red-600 text-[13px] font-bold text-center leading-relaxed">
                                        {errorMsg}
                                    </p>
                                </div>
                            )}

                            {scannedOrder && (
                                <div className="bg-white rounded-3xl p-5 border border-neutral-100/80 shadow-sm">
                                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-100 border-dashed">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Customer</p>
                                            <h3 className="text-lg font-black tracking-tight text-neutral-900 leading-none">{scannedOrder.customer_name}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Order #</p>
                                            <span className="text-lg font-black tracking-widest text-emerald-600 leading-none">{scannedOrder.short_id}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {scannedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-3 items-start">
                                                <div className="w-7 h-7 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[12px] font-black text-neutral-700">{item.quantity}</span>
                                                </div>
                                                <div className="pt-0.5">
                                                    <p className="text-[14px] font-bold text-neutral-800 leading-tight">{item.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 pt-4">
                                {scannedOrder && (
                                    <button 
                                        onClick={handleComplete}
                                        className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBag className="w-5 h-5" />
                                        Handover & Complete
                                    </button>
                                )}
                                
                                <button 
                                    onClick={handleBackToScanner}
                                    className={clsx(
                                        "w-full h-14 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 active:scale-[0.98]",
                                        scannedOrder ? "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50" : "bg-neutral-900 text-white shadow-lg"
                                    )}
                                >
                                    Scan Another Code
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
