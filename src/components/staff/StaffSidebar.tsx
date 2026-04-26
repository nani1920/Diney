'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
    LayoutDashboard, 
    UtensilsCrossed, 
    ClipboardList, 
    Bell, 
    LogOut,
    Store,
    ChefHat,
    Package,
    Settings,
    History,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logoutStaff } from '@/app/actions/staff-auth';
import { StaffMember } from '@/types';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

interface StaffSidebarProps {
    staff: StaffMember;
    tenantSlug: string;
    tenantName: string;
}

export default function StaffSidebar({ staff, tenantSlug, tenantName }: StaffSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        const res = await logoutStaff();
        if (res.success) {
            toast.success("Shift ended. Great work today!");
            router.push(`/${tenantSlug}/staff/login`);
        }
    };

    const sections = [
        {
            title: 'Overview',
            items: [
                { name: 'POS Dashboard', href: `/${tenantSlug}/staff/dashboard`, icon: LayoutDashboard },
            ]
        },
        {
            title: 'Floor & Service',
            items: [
                { name: 'Floor Map', href: `/${tenantSlug}/staff/floor-map`, icon: UtensilsCrossed },
                { name: 'Live Orders', href: `/${tenantSlug}/staff/orders`, icon: ClipboardList },
                { name: 'Service Alerts', href: `/${tenantSlug}/staff/alerts`, icon: Bell },
            ]
        },
        {
            title: 'Inventory',
            items: [
                { name: 'Stock Management', href: `/${tenantSlug}/staff/menu`, icon: Package },
            ]
        }
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-neutral-900">
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                        <Store className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight text-white truncate max-w-[120px]">{tenantName}</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-1">Staff Portal</p>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="md:hidden text-neutral-400 hover:text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-8 overflow-y-auto no-scrollbar">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-3">
                        <h3 className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">
                            {section.title}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={clsx(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                                            isActive 
                                                ? "bg-white/5 text-white font-bold border border-white/5" 
                                                : "text-neutral-500 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {/* Active Indicator */}
                                        {isActive && (
                                            <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                        )}

                                        <item.icon className={clsx(
                                            "w-5 h-5 transition-transform group-hover:scale-110",
                                            isActive ? "text-emerald-500" : "text-neutral-600 group-hover:text-emerald-500"
                                        )} />
                                        <span className={clsx(
                                            "text-sm tracking-tight",
                                            isActive ? "font-bold" : "font-medium"
                                        )}>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer / Profile */}
            <div className="p-4 border-t border-white/5 space-y-3">
                <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/5 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-emerald-500 border border-neutral-700 shrink-0 uppercase">
                        {staff.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{staff.name}</p>
                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{staff.role}</p>
                    </div>
                </div>
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/20 group"
                >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    End Shift
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden bg-neutral-900 border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <Store className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-white text-sm tracking-tight">{tenantName}</span>
                </div>
                <button onClick={() => setIsOpen(true)} className="p-2 rounded-lg bg-white/5 text-white">
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Drawer Overlay */}
            <AnimatePresence>
                {isOpen && [
                    <motion.div 
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                    />,
                    <motion.aside
                        key="drawer"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 w-72 z-[60] md:hidden shadow-2xl"
                    >
                        <SidebarContent />
                    </motion.aside>
                ]}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-neutral-900 border-r border-white/5 flex-col shrink-0 font-inter h-screen sticky top-0">
                <SidebarContent />
            </aside>
        </>
    );
}
