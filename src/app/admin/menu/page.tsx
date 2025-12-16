'use client';

import { useStore } from '@/context/StoreContext';
import { MenuItem } from '@/types';
import { useState } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    Filter,
    MoreHorizontal,
    Check
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function MenuManagementPage() {
    const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'veg' | 'non-veg'>('all');

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterType === 'all' || item.veg_or_nonveg === filterType;
        return matchesSearch && matchesFilter;
    });

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newItem: MenuItem = {
            id: crypto.randomUUID(),
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price: Number(formData.get('price')),
            veg_or_nonveg: formData.get('veg_or_nonveg') as 'veg' | 'non-veg',
            availability_status: true,
            prep_time_minutes: Number(formData.get('prep_time_minutes')) || 10
        };
        addMenuItem(newItem);
        setIsAdding(false);
    };

    const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingItem) return;
        const formData = new FormData(e.currentTarget);
        const updated: MenuItem = {
            ...editingItem,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price: Number(formData.get('price')),
            veg_or_nonveg: formData.get('veg_or_nonveg') as 'veg' | 'non-veg',
            prep_time_minutes: Number(formData.get('prep_time_minutes')) || editingItem.prep_time_minutes
        };
        updateMenuItem(updated);
        setEditingItem(null);
    };

    const toggleAvailability = (item: MenuItem) => {
        updateMenuItem({ ...item, availability_status: !item.availability_status });
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
                    <p className="text-gray-500 mt-1">Add, edit, and organize your food items.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl font-medium hover:bg-neutral-800 shadow-lg shadow-neutral-200 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add New Item</span>
                </button>
            </header>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-shadow"
                    />
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {(['all', 'veg', 'non-veg'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                                filterType === type ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {type.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredItems.map(item => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={item.id}
                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={clsx(
                                        "w-2 h-2 rounded-full ring-2 ring-offset-2",
                                        item.veg_or_nonveg === 'veg' ? "bg-green-500 ring-green-100" : "bg-red-500 ring-red-100"
                                    )} title={item.veg_or_nonveg} />
                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-black transition-colors">{item.name}</h3>
                                </div>
                                <div className="relative">
                                    <button
                                        className="p-1 text-gray-400 hover:text-black rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setEditingItem(item)}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2 leading-relaxed">{item.description}</p>

                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 bg-gray-50 p-2 rounded-lg w-fit">
                                <span className="font-medium">Prep: {item.prep_time_minutes} min</span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <span className="text-lg font-bold">₹{item.price}</span>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleAvailability(item)}
                                        className={clsx(
                                            "text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5",
                                            item.availability_status
                                                ? "text-green-700 border-green-200 bg-green-50 hover:bg-green-100"
                                                : "text-gray-500 border-gray-200 bg-gray-50 hover:bg-gray-100"
                                        )}
                                    >
                                        {item.availability_status ? (
                                            <><Check className="w-3 h-3" /> In Stock</>
                                        ) : (
                                            <>Out of Stock</>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this item?')) deleteMenuItem(item.id);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-lg">No items found matching your filters.</p>
                </div>
            )}

            {/* Modal for Add/Edit */}
            <AnimatePresence>
                {(isAdding || editingItem) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setIsAdding(false);
                                setEditingItem(null);
                            }
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl"
                        >
                            <h3 className="text-2xl font-bold mb-6">{isAdding ? 'New Menu Item' : 'Edit Item'}</h3>

                            <form onSubmit={isAdding ? handleCreate : handleUpdate} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Item Name</label>
                                    <input required name="name" defaultValue={editingItem?.name} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all" placeholder="e.g. Spicy Burger" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                    <textarea required name="description" defaultValue={editingItem?.description} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all h-24 resize-none" placeholder="Describe the ingredients..." />
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Price (₹)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                            <input required type="number" name="price" defaultValue={editingItem?.price} className="w-full pl-8 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                                        <select name="veg_or_nonveg" defaultValue={editingItem?.veg_or_nonveg || 'veg'} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent bg-white">
                                            <option value="veg">🟢 Veg</option>
                                            <option value="non-veg">🔴 Non-Veg</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Prep Time (mins)</label>
                                    <input required type="number" name="prep_time_minutes" defaultValue={editingItem?.prep_time_minutes || 10} min="1" max="60" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent" />
                                </div>

                                <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => { setIsAdding(false); setEditingItem(null); }}
                                        className="flex-1 py-3.5 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3.5 bg-black text-white rounded-xl font-bold hover:bg-neutral-800 transition-transform active:scale-95"
                                    >
                                        {isAdding ? 'Create Item' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
