'use client';

import { useState } from 'react';
import { 
    Search, 
    Filter, 
    Circle, 
    CircleOff, 
    ChefHat,
    Package,
    ChevronRight,
    Zap,
    ZapOff,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import clsx from 'clsx';
import { toggleMenuItemStock } from '@/app/actions/tenant';
import { toast } from 'react-hot-toast';
import { MenuItem } from '@/types';

interface StaffMenuClientProps {
    initialItems: MenuItem[];
    tenantId: string;
    tenantSlug: string;
}

export default function StaffMenuClient({ initialItems, tenantId, tenantSlug }: StaffMenuClientProps) {
    const [items, setItems] = useState(initialItems);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const categories = ['all', ...Array.from(new Set(items.map(i => i.category?.name).filter(Boolean)))];

    const handleToggleStock = async (itemId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        try {
            const res = await toggleMenuItemStock(tenantId, tenantSlug, itemId, newStatus);
            if (res) {
                setItems(curr => curr.map(i => i.id === itemId ? { ...i, availability_status: newStatus } : i));
                toast.success(newStatus ? "Item back in stock!" : "Item marked as Out of Stock", {
                    icon: newStatus ? '✅' : '🚫',
                    style: {
                        borderRadius: '12px',
                        background: '#fff',
                        color: '#111',
                        border: '1px solid #f1f1f1'
                    }
                });
            }
        } catch (err) {
            toast.error("Failed to update stock");
        }
    };

    const filteredItems = items.filter(i => {
        const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'all' || i.category?.name === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-8 font-inter pb-20">
            {/* Header / Search (Admin Style) */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search menu items..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-14 pr-6 text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-gray-400 text-gray-900 font-bold"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat || 'all')}
                            className={clsx(
                                "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border shadow-sm",
                                activeCategory === cat 
                                    ? "bg-emerald-600 border-emerald-600 text-white" 
                                    : "bg-white border-gray-100 text-gray-500 hover:text-gray-900"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                    <div 
                        key={item.id}
                        className={clsx(
                            "group bg-white border rounded-2xl p-6 transition-all duration-300 relative overflow-hidden",
                            item.availability_status ? "border-gray-100 shadow-sm hover:shadow-md" : "border-rose-100 bg-rose-50/30 shadow-sm"
                        )}
                    >
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className={clsx(
                                        "w-2 h-2 rounded-full",
                                        item.veg_or_nonveg === 'veg' ? "bg-green-500" : "bg-red-500"
                                    )} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.category?.name}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight group-hover:text-emerald-600 transition-colors leading-tight">{item.name}</h3>
                                <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                            </div>
                            <div className="w-14 h-14 bg-gray-50 rounded-xl flex flex-col items-center justify-center border border-gray-100 group-hover:border-emerald-100 transition-all shrink-0">
                                <span className="text-[10px] font-bold text-gray-400 leading-none mb-0.5">₹</span>
                                <span className="text-lg font-bold text-gray-900 tracking-tight">{item.price}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                            <div className="flex items-center gap-2">
                                {item.availability_status ? (
                                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                        <Zap className="w-3 h-3 fill-emerald-600" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">In Stock</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                                        <ZapOff className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleToggleStock(item.id, item.availability_status)}
                                className={clsx(
                                    "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm",
                                    item.availability_status 
                                        ? "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white"
                                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                                )}
                            >
                                {item.availability_status ? "Mark Out" : "In Stock"}
                            </button>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                            <ChefHat className="w-24 h-24" />
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="py-32 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100 shadow-sm">
                    <Package className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                    <h3 className="text-gray-900 font-bold text-xl tracking-tight uppercase">No items found</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Try adjusting your filters</p>
                </div>
            )}
        </div>
    );
}
