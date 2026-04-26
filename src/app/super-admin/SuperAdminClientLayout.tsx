'use client';

import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut, ShieldCheck, Megaphone, Package, Star } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function SuperAdminClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const menuItems = [
        { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
        { name: 'Tenants', href: '/super-admin/tenants', icon: Users },
        { name: 'Master Catalog', href: '/super-admin/catalog', icon: Package },
        { name: 'Broadcaster', href: '/super-admin/announcements', icon: Megaphone },
        { name: 'Platform Reviews', href: '/super-admin/reviews', icon: Star },
        { name: 'Platform Settings', href: '/super-admin/settings', icon: Settings },
    ];

    return (
        <div className="flex min-h-screen bg-[#050505] text-white font-inter">
            { }
            <aside className="w-72 border-r border-white-[0.03] bg-[#0a0a0a] flex flex-col sticky top-0 h-screen">
                <div className="p-8 pb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-extrabold tracking-tighter text-xl text-white uppercase letter-spacing-tight">
                            CONTROL <span className="text-red-600">P</span>
                        </span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 mb-4">Main Navigation</p>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative block group"
                            >
                                <div className={clsx(
                                    "relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300",
                                    isActive 
                                        ? "bg-white/5 text-white shadow-sm ring-1 ring-white/10" 
                                        : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.02]"
                                )}>
                                    <Icon className={clsx(
                                        "w-5 h-5 transition-colors duration-300",
                                        isActive ? "text-red-500" : "group-hover:text-neutral-300"
                                    )} />
                                    <span className="font-bold text-[14px]">{item.name}</span>
                                    
                                    {isActive && (
                                        <motion.div
                                            layoutId="navIndicator"
                                            className="absolute left-0 w-1 h-5 bg-red-600 rounded-r-full"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-white/[0.03]">
                    <div className="bg-neutral-900/40 p-4 rounded-2xl border border-white/[0.02] mb-4">
                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Signed in as</p>
                        <p className="text-xs font-bold text-white truncate">Platform Admin</p>
                    </div>
                    
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 text-neutral-500 hover:text-red-400 transition-all group overflow-hidden">
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm tracking-tight text-neutral-600 group-hover:text-red-400">Exit Workspace</span>
                    </Link>
                </div>
            </aside>

            { }
            <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#080808] to-[#050505] p-8 lg:p-12">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
