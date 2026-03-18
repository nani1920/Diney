'use client';

import { useStore } from '@/context/StoreContext';
import { Store, Clock, Save, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
    const { isStoreOpen, toggleStoreStatus, openingTime, closingTime, setOpeningTime, setClosingTime } = useStore();

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
                <p className="text-gray-500 mt-1">Manage your food truck's operational details.</p>
            </header>

            {/* Store Status Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${isStoreOpen ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            <Store className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-gray-900">Store Status</h2>
                            <p className="text-sm text-gray-500">
                                Currently <span className={`font-bold ${isStoreOpen ? 'text-green-600' : 'text-red-500'}`}>
                                    {isStoreOpen ? 'OPEN' : 'CLOSED'}
                                </span> for orders.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={toggleStoreStatus}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isStoreOpen
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-100'
                            : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-200'
                            }`}
                    >
                        {isStoreOpen ? (
                            <>
                                <Lock className="w-4 h-4" /> Close Store
                            </>
                        ) : (
                            <>
                                <Unlock className="w-4 h-4" /> Open Store
                            </>
                        )}
                    </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600">
                    <p>
                        <strong>Note:</strong> Closing the store will prevent customers from placing new orders.
                        Existing orders can still be processed.
                    </p>
                </div>
            </div>

            {/* Business Hours (Static for now) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-75">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-gray-900">Business Hours</h2>
                        <p className="text-sm text-gray-500">Set your automatic opening hours.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time</label>
                        <input
                            type="time"
                            value={openingTime}
                            onChange={(e) => setOpeningTime(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time</label>
                        <input
                            type="time"
                            value={closingTime}
                            onChange={(e) => setClosingTime(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                </div>

                <button disabled className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                    <Save className="w-4 h-4" /> Save Changes
                </button>
                <p className="text-xs text-center md:text-left text-gray-400 mt-2">Display only (Automatic scheduling coming soon)</p>
            </div>
        </div>
    );
}
