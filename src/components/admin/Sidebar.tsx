'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStore } from '@/context/StoreContext';
import {
    LayoutDashboard,
    ClipboardList,
    UtensilsCrossed,
    Store,
    LogOut,
    Menu,
    X,
    QrCode,
    TrendingUp,
    History,
    Layers,
    ChevronDown,
    Star
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

export default function AdminSidebar() {
    const { tenant } = useStore();
    const pathname = usePathname();
    const params = useParams();
    const tenantSlug = params.tenantSlug as string;
    
    // Dynamic Subdomain Detection
    const isSubdomain = typeof window !== 'undefined' && (() => {
        const hostname = window.location.hostname;
        const baseDomainEnv = (process.env.NEXT_PUBLIC_BASE_DOMAIN || '').split(':')[0];
        
        // 1. Check if it's explicitly a subdomain of the base env
        if (baseDomainEnv && hostname.endsWith('.' + baseDomainEnv)) return true;
        
        // 2. Fallback: If it's a multi-level domain (like mario.diney.tech)
        // and doesn't exactly match the base domain, it's a subdomain
        const parts = hostname.split('.');
        if (parts.length >= 3 && parts[0].toLowerCase() !== 'www') return true;
        
        return false;
    })();

    const getLink = (path: string) => {
        if (isSubdomain) return path; 
        
        // Fallback to tenant.slug from context if params.tenantSlug is missing
        const activeSlug = tenantSlug || tenant?.slug;
        if (activeSlug) return `/${activeSlug}${path}`;
        
        return path;
    };

    const menuSections = [
        {
            title: 'Overview',
            icon: LayoutDashboard,
            items: [
                { name: 'Dashboard', href: getLink('/admin'), icon: LayoutDashboard },
                { name: 'Analytics', href: getLink('/admin/analytics'), icon: TrendingUp },
                { name: 'Customer Ratings', href: getLink('/admin/ratings'), icon: Star },
            ]
        },
        {
            title: 'Order Center',
            icon: ClipboardList,
            items: [
                { name: 'Live Orders', href: getLink('/admin/orders'), icon: ClipboardList },
                { name: 'Prep Queue', href: getLink('/admin/prep-queue'), icon: Layers },
                { name: 'Order History', href: getLink('/admin/all-orders'), icon: History },
            ]
        },
        {
            title: 'Menu Management',
            icon: UtensilsCrossed,
            items: [
                { name: 'Categories', href: getLink('/admin/categories'), icon: Layers },
                { name: 'Menu', href: getLink('/admin/menu'), icon: UtensilsCrossed },
            ]
        },
        {
            title: 'Tools & Settings',
            icon: QrCode,
            items: [
                { name: 'QR Generator', href: getLink('/admin/qr-generator'), icon: QrCode },
                { name: 'Settings', href: getLink('/admin/settings'), icon: Store },
            ]
        }
    ];

    const [isOpen, setIsOpen] = useState(false);
    
     
    const [expandedSection, setExpandedSection] = useState<string | null>(() => {
        const activeSection = menuSections.find(section => 
            section.items.some(item => pathname === item.href)
        );
        return activeSection ? activeSection.title : 'Overview';
    });

    const toggleSection = (title: string) => {
        setExpandedSection(prev => prev === title ? null : title);
    };

    return (
        <>
            { }
            <div className="md:hidden flex items-center justify-between p-4 bg-neutral-900 text-white sticky top-0 z-30 w-full shrink-0 border-b border-neutral-800 shadow-lg">
                <div className="flex items-center gap-2">
                    <Store className="w-6 h-6 text-green-500" />
                    <span className="font-bold text-lg text-white capitalize">
                        {tenant?.name || 'Admin'}
                    </span>
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-neutral-400 hover:text-white transition-colors">
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            { }
            <aside className={clsx(
                "fixed inset-y-0 left-0 bg-neutral-900 text-white w-64 transform transition-transform duration-300 ease-in-out z-40 md:translate-x-0 md:static h-full shrink-0 border-r border-neutral-800 shadow-xl",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    { }
                    <div className="p-8 border-b border-neutral-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                                <Store className="w-6 h-6 text-black" />
                            </div>
                            <div>
                                <h1 className="font-bold text-xl tracking-wide text-white capitalize">
                                    {tenant?.name || 'Admin'}
                                </h1>
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">Admin Portal</p>
                            </div>
                        </div>
                    </div>

                    { }
                    <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
                        {menuSections.map((section) => {
                            const isExpanded = expandedSection === section.title;
                            const hasActiveItem = section.items.some(item => pathname === item.href);

                            return (
                                <div key={section.title} className="space-y-1">
                                    <button 
                                        onClick={() => toggleSection(section.title)}
                                        className={clsx(
                                            "w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all duration-300 group",
                                            isExpanded ? "bg-white/5 shadow-sm" : "hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                                                hasActiveItem ? "bg-green-500 text-black shadow-lg shadow-green-500/20" : 
                                                isExpanded ? "bg-neutral-700 text-neutral-300" : "bg-neutral-800 text-neutral-500 group-hover:text-neutral-300"
                                            )}>
                                                <section.icon className="w-4 h-4" />
                                            </div>
                                            <span className={clsx(
                                                "text-sm font-bold tracking-tight transition-colors duration-300",
                                                hasActiveItem ? "text-white" : 
                                                isExpanded ? "text-neutral-200" : "text-neutral-400 group-hover:text-neutral-200"
                                            )}>
                                                {section.title}
                                            </span>
                                        </div>
                                        <ChevronDown className={clsx(
                                            "w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-all duration-500",
                                            isExpanded && "rotate-180 text-neutral-400"
                                        )} />
                                    </button>

                                    <div className="relative ml-7 overflow-hidden">
                                        {isExpanded && (
                                            <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-800/50" />
                                        )}
                                        
                                        <motion.div
                                            initial={false}
                                            animate={{ 
                                                height: isExpanded ? 'auto' : 0,
                                                opacity: isExpanded ? 1 : 0
                                            }}
                                            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                            className="space-y-1 pt-1"
                                        >
                                            {section.items.map((item) => {
                                                const isActive = pathname === item.href;
                                                const ItemIcon = item.icon;

                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setIsOpen(false)}
                                                        className={clsx(
                                                            "group relative flex items-center gap-3 pl-6 pr-4 py-2.5 rounded-r-xl transition-all duration-300",
                                                            isActive 
                                                                ? "text-green-400 bg-green-500/10" 
                                                                : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
                                                        )}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-green-500 rounded-full" />
                                                        )}
                                                        <ItemIcon className={clsx(
                                                            "w-4 h-4 transition-transform duration-300 group-hover:scale-110",
                                                            isActive ? "text-green-400" : "text-neutral-600 group-hover:text-neutral-400"
                                                        )} />
                                                        <span className={clsx(
                                                            "text-[13px] transition-all duration-300",
                                                            isActive ? "font-bold tracking-tight" : "font-medium"
                                                        )}>
                                                            {item.name}
                                                        </span>
                                                    </Link>
                                                );
                                            })}
                                        </motion.div>
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    { }
                    <div className="p-4 border-t border-neutral-800">
                        <Link href={`/${tenantSlug}`} className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all border border-dashed border-neutral-700 hover:border-neutral-500">
                            <LogOut className="w-5 h-5" />
                            <span>Customer View</span>
                        </Link>
                    </div>
                </div>
            </aside>

            { }
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
