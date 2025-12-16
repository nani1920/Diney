'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    ClipboardList,
    UtensilsCrossed,
    Store,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const MENU_ITEMS = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Live Orders', href: '/admin/orders', icon: ClipboardList },
    { name: 'Menu', href: '/admin/menu', icon: UtensilsCrossed },
    { name: 'Settings', href: '/admin/settings', icon: Store },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-black text-white sticky top-0 z-30 w-full shrink-0">
                <div className="flex items-center gap-2">
                    <Store className="w-6 h-6 text-green-400" />
                    <span className="font-bold text-lg">Nani Chef</span>
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="p-2">
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar Container */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 bg-neutral-900 text-white w-64 transform transition-transform duration-300 ease-in-out z-40 md:translate-x-0 md:static md:h-screen shrink-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Brand */}
                    <div className="p-8 border-b border-neutral-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                                <Store className="w-6 h-6 text-black" />
                            </div>
                            <div>
                                <h1 className="font-bold text-xl tracking-wide">Nani Chef</h1>
                                <p className="text-xs text-neutral-400">Admin Portal</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 mt-4">
                        {MENU_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className="relative block"
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-green-500/10 border-r-4 border-green-500 rounded-lg"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <div className={clsx(
                                        "relative flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200",
                                        isActive ? "text-green-400 font-medium" : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                                    )}>
                                        <Icon className="w-5 h-5" />
                                        <span>{item.name}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-neutral-800">
                        <Link href="/" className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all border border-dashed border-neutral-700 hover:border-neutral-500">
                            <LogOut className="w-5 h-5" />
                            <span>Customer View</span>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
