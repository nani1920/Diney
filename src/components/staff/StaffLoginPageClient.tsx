'use client';

import { useState } from 'react';
import { StaffMember } from '@/types';
import { loginStaff } from '@/app/actions/staff-auth';
import { 
    ChevronRight, 
    Lock, 
    Delete, 
    ArrowLeft, 
    Store, 
    Clock,
    UserCircle,
    Utensils
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

interface StaffLoginPageClientProps {
    staff: StaffMember[];
    tenantSlug: string;
    tenantId: string;
    tenantName: string;
}

export default function StaffLoginPageClient({ 
    staff, 
    tenantSlug, 
    tenantId, 
    tenantName 
}: StaffLoginPageClientProps) {
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [pin, setPin] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const router = useRouter();

    const handlePinPress = (digit: string) => {
        if (pin.length < 4) {
            const newPin = pin + digit;
            setPin(newPin);
            if (newPin.length === 4) {
                handleLogin(newPin);
            }
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleLogin = async (finalPin: string) => {
        if (!selectedStaff || isLoggingIn) return;

        setIsLoggingIn(true);
        try {
            const res = await loginStaff(tenantId, selectedStaff.id, finalPin);
            if (res.success) {
                toast.success(`Welcome back, ${selectedStaff.name}!`, { icon: '👋' });
                router.push(`/${tenantSlug}/staff/dashboard`);
            } else {
                toast.error(res.error || "Incorrect PIN");
                setPin(''); // Reset on failure
            }
        } catch (err) {
            toast.error("An error occurred during login.");
            setPin('');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleBack = () => {
        if (selectedStaff) {
            setSelectedStaff(null);
            setPin('');
        } else {
            router.push(`/${tenantSlug}`);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden font-inter">
            {/* Background Accents (Admin Style) */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/[0.03] blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-amber-500/[0.03] blur-[100px] rounded-full" />
            </div>

            <div className="w-full max-w-sm relative z-10">
                <AnimatePresence mode="wait">
                    {!selectedStaff ? (
                        <motion.div
                            key="select-staff"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-3">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2 shadow-sm">
                                    <Store className="w-3.5 h-3.5" />
                                    {tenantName}
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight text-gray-900 leading-none">
                                    Staff <span className="text-emerald-600">Portal</span>
                                </h1>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Select your profile to begin</p>
                            </div>

                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
                                {staff.map((member) => (
                                    <button
                                        key={member.id}
                                        onClick={() => setSelectedStaff(member)}
                                        className="w-full flex items-center justify-between p-5 rounded-2xl bg-white border border-gray-100 hover:border-emerald-500/30 hover:shadow-lg transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-emerald-600 text-lg group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900 text-[15px]">{member.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {member.waiter_id}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all relative z-10" />
                                    </button>
                                ))}
                                {staff.length === 0 && (
                                    <div className="py-12 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100">
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No profiles found</p>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleBack}
                                className="w-full py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
                            >
                                Back to Restaurant View
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="pin-entry"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <button 
                                    onClick={handleBack}
                                    className="p-3 rounded-full bg-white border border-gray-100 hover:bg-gray-50 transition-colors mb-2 shadow-sm"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <div className="w-20 h-20 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-emerald-600/20">
                                    {selectedStaff.name.charAt(0)}
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">{selectedStaff.name}</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Enter 4-Digit Security PIN</p>
                                </div>
                            </div>

                            {/* PIN Display (Admin Style) */}
                            <div className="flex justify-center gap-5">
                                {[...Array(4)].map((_, i) => (
                                    <div 
                                        key={i}
                                        className={clsx(
                                            "w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 shadow-sm",
                                            pin.length > i 
                                                ? "bg-emerald-600 border-emerald-600 scale-125" 
                                                : "border-gray-200 bg-white"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Keypad (Admin Style) */}
                            <div className="grid grid-cols-3 gap-5 max-w-[280px] mx-auto">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handlePinPress(num.toString())}
                                        className="w-16 h-16 rounded-2xl bg-white border border-gray-100 font-bold text-xl text-gray-900 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all active:scale-95 flex items-center justify-center shadow-sm"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <div />
                                <button
                                    onClick={() => handlePinPress('0')}
                                    className="w-16 h-16 rounded-2xl bg-white border border-gray-100 font-bold text-xl text-gray-900 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all active:scale-95 flex items-center justify-center shadow-sm"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-16 h-16 rounded-2xl bg-white border border-gray-100 font-bold text-xl text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95 flex items-center justify-center shadow-sm"
                                >
                                    <Delete className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {isLoggingIn && (
                <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin shadow-sm" />
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest animate-pulse">Establishing Session...</p>
                </div>
            )}
        </main>
    );
}
