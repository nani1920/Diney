'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { getStoreAnalytics } from '@/app/actions/analytics';
import { 
    TrendingUp, 
    ShoppingBag, 
    IndianRupee, 
    BarChart3, 
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function AnalyticsPage() {
    const { tenant } = useStore();
    const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'specific'>('today');
    const [specificDate, setSpecificDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!tenant) return;
            setIsLoading(true);
            const result = await getStoreAnalytics(
                tenant.id, 
                timeframe, 
                timeframe === 'specific' ? specificDate : undefined
            );
            if (result.success) {
                setData(result.data);
                setError(null);
            } else {
                setError(result.error || 'Failed to fetch analytics data');
            }
            setIsLoading(false);
        }
        fetchData();
    }, [tenant, timeframe, specificDate]);

    if (isLoading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const { 
        totalRevenue = 0, 
        totalOrders = 0, 
        avgOrderValue = 0, 
        topItems = [], 
        chartData = [] 
    } = data || {};

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics Insights</h1>
                    <p className="text-gray-500 mt-1">Deep dive into your store's performance metrics.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-100/50 p-2 rounded-[2rem] border border-gray-200/50 shadow-sm backdrop-blur-sm">
                    <div className="flex bg-gray-200/50 p-1 rounded-2xl items-center">
                        {(['today', 'week', 'month', 'specific'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={clsx(
                                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    timeframe === t 
                                        ? "bg-white text-black shadow-md border border-gray-100" 
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {timeframe === 'specific' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
                            <Calendar size={14} className="text-gray-400" />
                            <input 
                                type="date" 
                                value={specificDate}
                                onChange={(e) => setSpecificDate(e.target.value)}
                                className="text-xs font-bold uppercase tracking-wider focus:outline-none bg-transparent"
                            />
                        </div>
                    )}
                </div>
            </header>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <MetricCard 
                    label="Volume" 
                    value={totalOrders} 
                    icon={ShoppingBag} 
                    description="Total orders received"
                    trend="+0%"
                    trendColor="green"
                />
                <MetricCard 
                    label="Revenue" 
                    value={`₹${(totalRevenue || 0).toLocaleString()}`} 
                    icon={IndianRupee} 
                    description="Gross sales across timeframe"
                    trend="+0%"
                    trendColor="green"
                />
                <MetricCard 
                    label="Avg. Value" 
                    value={`₹${(avgOrderValue || 0).toLocaleString()}`} 
                    icon={TrendingUp} 
                    description="Average transaction size"
                    trend="0%"
                    trendColor="red"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Chart Placeholder */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            Revenue Distribution
                        </h3>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-black rounded-full" />
                                Orders
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-64 flex items-end gap-2 md:gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {chartData?.map((d: any, i: number) => {
                            const maxVal = Math.max(...chartData.map((x: any) => x.value));
                            const height = maxVal > 0 ? `${(d.value / maxVal) * 100}%` : '4px';
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group min-w-[20px] md:min-w-[40px]">
                                    <div className="w-full flex justify-center h-full items-end relative">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height }}
                                            className="w-full bg-neutral-900 rounded-t-lg group-hover:bg-red-500 transition-colors relative"
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-2 py-1 rounded-md font-bold z-10">
                                                {d.value}
                                            </div>
                                        </motion.div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-300 mt-4 whitespace-nowrap rotate-45 sm:rotate-0 origin-left">
                                        {d.label}
                                    </span>
                                </div>
                            );
                        })}
                        {(!chartData || chartData.length === 0) && (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 italic text-sm">
                                Not enough data to generate distribution
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Items List */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
                    <h3 className="font-bold text-lg mb-8 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Signature Dishes
                    </h3>
                    <div className="space-y-6">
                        {topItems?.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-bold text-gray-300 group-hover:bg-black group-hover:text-white transition-all">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{item.name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.count} Sold</p>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-gray-900">
                                    ₹{item.revenue}
                                </div>
                            </div>
                        ))}
                        {(!topItems || topItems.length === 0) && (
                            <div className="text-center py-10 text-gray-300 italic text-sm">
                                No sales recorded yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, description, trend, trendColor }: any) {
    return (
        <div className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/30 hover:shadow-gray-200/50 transition-all hover:scale-[1.02] duration-300">
            <div className="flex justify-between items-start mb-6">
                <div className="p-3.5 bg-neutral-50 rounded-2xl group-hover:bg-black transition-colors">
                    <Icon className="w-6 h-6 text-gray-400 group-hover:text-white" />
                </div>
                <div className={clsx(
                    "flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-full ring-1 ring-inset",
                    trendColor === 'green' ? "text-green-600 bg-green-50 ring-green-100" : "text-red-600 bg-red-50 ring-red-100"
                )}>
                    {trendColor === 'green' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {trend}
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</p>
                <p className="text-3xl font-black tracking-tighter">{value}</p>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 font-bold">{description}</p>
        </div>
    );
}
