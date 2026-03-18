'use client';

import { getGlobalStats, getAllTenants } from '@/app/actions/super-admin';
import { 
    Users, 
    ShoppingBag, 
    IndianRupee, 
    TrendingUp, 
    Store as StoreIcon,
    ArrowUpRight,
    ArrowDownRight,
    Trophy,
    ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [tenants, setTenants] = useState<any>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const statsResult = await getGlobalStats();
            const tenantsResult = await getAllTenants();

            if (statsResult.success && statsResult.data) {
                const d = statsResult.data;
                setStats({
                    totalTenants: d.totalTenants ?? 0,
                    totalOrders: d.totalOrders ?? 0,
                    totalRevenue: d.totalRevenue ?? 0,
                    revenueGrowth: d.revenueGrowth ?? 0,
                    trendData: d.trendData || [],
                    topPerformers: d.topPerformers || []
                });
            } else {
                setStats({
                    totalTenants: 0,
                    totalOrders: 0,
                    totalRevenue: 0,
                    revenueGrowth: 0,
                    trendData: [],
                    topPerformers: []
                });
            }

            if (tenantsResult.success) {
                setTenants(tenantsResult.data || []);
            }
            setLoading(false);
        }
        loadData();
    }, []);

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Loading Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24 font-inter">
            { }
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-full">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">System Overview</span>
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                        Platform <span className="text-neutral-500">Pulse</span>
                    </h1>
                    <p className="text-neutral-500 font-medium text-lg max-w-lg">Live intelligence and global health of the food merchant ecosystem.</p>
                </div>
                <div className="bg-neutral-900/40 border border-white/[0.03] px-6 py-4 rounded-[1.5rem] backdrop-blur-xl">
                    <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase text-neutral-400">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping absolute" />
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full relative" />
                        </div>
                        Health: <span className="text-white">Full Operational</span>
                    </div>
                </div>
            </header>

            { }
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    label="Platform Tenants" 
                    value={stats.totalTenants.toString()} 
                    icon={StoreIcon}
                    subtitle="Registered food merchants"
                />
                <MetricCard 
                    label="30D Transactions" 
                    value={stats.totalOrders.toLocaleString()} 
                    icon={ShoppingBag}
                    subtitle="+12% volume velocity"
                    trend="+8% growth"
                />
                <MetricCard 
                    label="Global Revenue" 
                    value={`₹${stats.totalRevenue.toLocaleString()}`} 
                    icon={IndianRupee}
                    subtitle="Aggregated platform net"
                    growth={stats.revenueGrowth}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                { }
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/[0.03] rounded-[2rem] p-8 flex flex-col space-y-8 relative overflow-hidden group shadow-2xl">
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Revenue Velocity</h3>
                            <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-[0.2em] font-black">Live Transaction Flow Analytics</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                            <Link href="/super-admin/analytics" className="hover:text-red-500 transition-colors">Detailed View</Link>
                        </div>
                    </div>
                    
                    { }
                    <div className="flex-1 h-72 w-full relative">
                        {stats.trendData.every((d: any) => d.amount === 0) ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-700 space-y-2 translate-y-[-20px]">
                                <TrendingUp className="w-12 h-12 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No activity in last 24h</p>
                            </div>
                        ) : null}
                        
                        <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGradientSuperAdmin" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            { }
                            {(() => {
                                const maxVal = Math.max(...stats.trendData.map((t: any) => t.amount)) || 1;
                                const labels = [
                                    { y: 75, val: `₹${maxVal.toLocaleString()}` },
                                    { y: 150, val: `₹${Math.round(maxVal / 2).toLocaleString()}` },
                                    { y: 225, val: `₹0` }
                                ];
                                
                                return (
                                    <>
                                        {labels.map((l: any, i: number) => (
                                            <g key={i}>
                                                <line x1="0" y1={l.y} x2="1000" y2={l.y} stroke="white" strokeOpacity="0.03" strokeWidth="1" strokeDasharray="4 4" />
                                                <text x="1000" y={l.y - 12} textAnchor="end" className="fill-neutral-600 text-[16px] font-black uppercase tracking-widest">{l.val}</text>
                                            </g>
                                        ))}

                                        { }
                                        <text x="0" y="295" className="fill-neutral-600 text-[16px] font-black uppercase tracking-widest">24h ago</text>
                                        <text x="500" y="295" textAnchor="middle" className="fill-neutral-600 text-[16px] font-black uppercase tracking-widest">12h ago</text>
                                        <text x="1000" y="295" textAnchor="end" className="fill-neutral-600 text-[16px] font-black uppercase tracking-widest">Now</text>
                                    </>
                                );
                            })()}
                            
                            { }
                            {(() => {
                                const data = stats.trendData;
                                if (data.length < 2) return null;
                                
                                const maxVal = Math.max(...data.map((t: any) => t.amount)) || 1;
                                const getY = (val: number) => 300 - (Math.min(val / maxVal, 1) * 220) - 20;  
                                
                                 
                                const points = data.map((d: any, i: number) => ({
                                    x: (i / (data.length - 1)) * 1000,
                                    y: getY(d.amount)
                                }));

                                 
                                let pathData = `M ${points[0].x} ${points[0].y}`;
                                for (let i = 0; i < points.length - 1; i++) {
                                    const curr = points[i];
                                    const next = points[i + 1];
                                    const cp1x = curr.x + (next.x - curr.x) / 2;
                                    const cp2x = curr.x + (next.x - curr.x) / 2;
                                    pathData += ` C ${cp1x} ${curr.y}, ${cp2x} ${next.y}, ${next.x} ${next.y}`;
                                }

                                const areaData = `${pathData} L 1000 300 L 0 300 Z`;

                                return (
                                    <>
                                        <path d={areaData} fill="url(#chartGradientSuperAdmin)" className="transition-all duration-1000" />
                                        <path 
                                            d={pathData}
                                            fill="none"
                                            stroke="#ef4444"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="drop-shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all duration-1000"
                                        />
                                    </>
                                );
                            })()}
                        </svg>
                    </div>

                    <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <TrendingUp className="w-80 h-80 text-white" />
                    </div>
                </div>

                { }
                <div className="space-y-8">
                    { }
                    <div className="bg-[#0a0a0a] border border-white/[0.03] rounded-[2rem] p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                Growth Leaders
                            </h3>
                        </div>
                        <div className="space-y-6">
                            {stats.topPerformers.map((t: any, i: number) => (
                                <div key={i} className="flex items-center justify-between group cursor-default">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/[0.05] flex items-center justify-center text-xs font-black text-neutral-500 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all duration-300">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-white group-hover:translate-x-1 transition-transform">{t.name}</p>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">{t.orders} Successful Orders</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[14px] font-black text-white italic group-hover:text-red-500 transition-colors">₹{t.revenue.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    { }
                    <div className="bg-neutral-900/40 p-8 rounded-[2rem] border border-white/[0.03] relative overflow-hidden group transition-all hover:bg-neutral-900/60">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 text-neutral-500 italic">Network Capacity</h3>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
                                    <span>Cloud Utilization</span>
                                    <span className="text-red-500 font-black">84%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: "84%" }}
                                        className="h-full bg-red-600 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                                    />
                                </div>
                            </div>
                        </div>
                        <TrendingUp className="absolute -right-8 -bottom-8 w-32 h-32 opacity-[0.02] group-hover:scale-125 transition-transform duration-700" />
                    </div>
                </div>
            </div>

            { }
            <div className="bg-[#0a0a0a] border border-white/[0.03] rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/[0.03] flex justify-between items-center bg-white/[0.01]">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-white uppercase">Latest Registry</h2>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Tenant Onboarding History</p>
                    </div>
                    <Link href="/super-admin/tenants" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-red-500 hover:text-white transition-all group">
                        Manage Registry <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                </div>
                <div className="divide-y divide-white/[0.03]">
                    {tenants.slice(0, 5).map((t: any) => (
                        <div key={t.id} className="flex px-10 py-5 justify-between items-center hover:bg-white/[0.02] transition-all group">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/[0.05] flex items-center justify-center font-bold text-neutral-400 group-hover:bg-red-600/10 group-hover:text-red-500 transition-all duration-500 scale-95 group-hover:scale-100 uppercase">
                                    {t.name.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[15px] font-bold text-white tracking-tight">{t.name}</p>
                                    <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase flex items-center gap-2">
                                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                                        {t.slug}.qrsaas.com
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[11px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-900 px-3 py-1.5 rounded-full border border-white/[0.03]">
                                    {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, subtitle, growth, trend }: any) {
    return (
        <div className="bg-[#0a0a0a] border border-white/[0.03] p-8 rounded-[2rem] hover:border-red-600/30 transition-all duration-500 group relative overflow-hidden shadow-lg hover:shadow-red-600/5">
            <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-neutral-900 rounded-2xl border border-white/[0.05] flex items-center justify-center group-hover:bg-red-600 group-hover:rotate-6 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-red-600/40">
                    <Icon className="w-7 h-7 text-neutral-400 group-hover:text-white transition-colors duration-500" />
                </div>
                {growth !== undefined && (
                    <div className={clsx(
                        "flex items-center gap-1.5 font-bold text-[12px] px-3.5 py-2 rounded-full border shadow-sm",
                        growth >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                    )}>
                        {growth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(growth)}%
                    </div>
                )}
                {trend && (
                    <div className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-500 bg-neutral-900 px-3 py-2 rounded-full border border-white/[0.05] shadow-sm">
                        {trend}
                    </div>
                )}
            </div>
            <div className="space-y-1.5 relative z-10">
                <p className="text-neutral-500 font-extrabold uppercase tracking-[0.2em] text-[10px]">{label}</p>
                <p className="text-4xl font-black tracking-tighter text-white group-hover:translate-y-[-2px] transition-transform duration-500">{value}</p>
            </div>
            <p className="text-neutral-600 text-xs mt-6 font-bold tracking-tight uppercase group-hover:text-neutral-400 transition-colors">{subtitle}</p>
            
            { }
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-red-600/5 blur-[50px] rounded-full group-hover:bg-red-600/10 transition-all duration-700" />
        </div>
    );
}
