'use client';

import { useStore } from '@/context/StoreContext';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const { menuItems, addToCart, cart, orders, isStoreOpen, openingTime, closingTime } = useStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeOrdersCount = orders.filter(o =>
    o.order_status === 'received' || o.order_status === 'preparing' || o.order_status === 'ready'
  ).length;

  const categories = ['All', 'Snacks', 'Burger', 'Momos', 'Drinks'];

  // Filter by category first
  const categoryFiltered = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(i => {
      const name = i.name.toLowerCase();
      switch (activeCategory) {
        case 'Snacks':
          return name.includes('samosa') || name.includes('cutlet') || name.includes('pakora') ||
            name.includes('fries') || name.includes('nuggets');
        case 'Burger':
          return name.includes('burger') || name.includes('pav') || name.includes('dosa');
        case 'Momos':
          return name.includes('momos');
        case 'Drinks':
          return name.includes('drink') || name.includes('chai') || name.includes('soda') || name.includes('coffee');
        default:
          return true;
      }
    });

  // Then filter by search query
  const filteredItems = searchQuery.trim() === ''
    ? categoryFiltered
    : categoryFiltered.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <main className="min-h-screen pb-36 pt-4 relative">
      {/* Store Closed Overlay */}
      {!isStoreOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in duration-300">
          <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-black/50 ring-4 ring-neutral-700">
            <span className="text-4xl">🔒</span>
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Store is Closed</h2>
          <p className="text-neutral-400 max-w-xs mx-auto mb-8 text-lg leading-relaxed">
            We are currently not accepting new orders. Please come back during our operating hours.
          </p>

          <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 w-full max-w-sm">
            <div className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">Opening Hours</div>
            <div className="flex justify-between items-center text-xl font-mono">
              <span className="text-green-400">{openingTime} AM</span>
              <span className="text-neutral-600">-</span>
              <span className="text-red-400">{closingTime} PM</span>
            </div>
          </div>
        </div>
      )}

      {isStoreOpen && (
        <div className="container animate-enter">
          {/* Enhanced Header */}
          <header className="flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs font-medium mb-1">Delivering to</span>
              <div className="flex items-center gap-1.5 text-red-500 font-bold">
                <span className="text-base">📍</span>
                <span className="text-sm">Food Truck 1</span>
                <span className="text-xs opacity-60">▼</span>
              </div>
            </div>
            <Link href="/my-orders" className="w-11 h-11 bg-white shadow-md rounded-2xl flex items-center justify-center text-xl hover:shadow-lg transition-shadow active:scale-95 relative">
              📦
              {activeOrdersCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                  {activeOrdersCount}
                </div>
              )}
            </Link>
          </header>

          {/* Enhanced Title */}
          <h1 className="mb-6 leading-tight text-[28px]">
            Find The <span className="text-red-500 relative inline-block">
              Best Food
              <svg className="absolute -bottom-1 left-0 w-full" height="4" viewBox="0 0 100 4" preserveAspectRatio="none">
                <path d="M0,2 Q25,0 50,2 T100,2" stroke="#F54748" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            <br />Around You
          </h1>

          {/* Enhanced Search Bar */}
          <div className="flex gap-3 mb-6 animate-enter delay-1">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search your food"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all outline-none text-sm border border-gray-100 focus:border-red-200 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
            <button className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 hover:shadow-xl active:scale-95 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          {/* Enhanced Categories */}
          <div className="flex gap-2.5 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide mb-6 animate-enter delay-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${activeCategory === cat
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200'
                  : 'bg-white text-gray-600 shadow-sm active:scale-95'
                  }`}
              >
                {cat === 'Snacks' && '🍟'}
                {cat === 'Burger' && '🍔'}
                {cat === 'Momos' && '🥟'}
                {cat === 'Drinks' && '🥤'}
                {cat}
              </button>
            ))}
          </div>

          {/* Section Header */}
          <div className="flex justify-between items-center mb-4 animate-enter delay-3">
            <h2 className="text-lg font-bold flex items-center gap-1.5">
              Popular Now
              <span className="text-xl">🔥</span>
            </h2>
            <button className="text-red-500 text-xs font-bold active:opacity-70 flex items-center gap-1">
              View All
              <span className="text-xs">→</span>
            </button>
          </div>

          {/* Enhanced Product Grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
                <div className="text-6xl mb-4 opacity-20">🔍</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No items found</h3>
                <p className="text-sm text-gray-400 mb-4">
                  {searchQuery ? `No results for "${searchQuery}"` : 'No items in this category'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-red-500 text-sm font-bold hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-3xl shadow-sm hover:shadow-lg flex flex-col items-center text-center relative group transition-all duration-300 hover:-translate-y-1 animate-scale border border-gray-50"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Enhanced Image Placeholder */}
                  <div className="w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mb-4 flex items-center justify-center text-6xl relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                    {!item.availability_status && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center font-bold text-xs text-red-500 z-10">
                        OUT OF STOCK
                      </div>
                    )}
                    <div className="transform group-hover:scale-110 transition-transform duration-300">
                      {item.name.toLowerCase().includes('samosa') ? '🥟' :
                        item.name.toLowerCase().includes('cutlet') ? '🍘' :
                          item.name.toLowerCase().includes('pakora') || item.name.toLowerCase().includes('bread') ? '🥙' :
                            item.name.toLowerCase().includes('burger') || item.name.toLowerCase().includes('wrap') ? '🍔' :
                              item.name.toLowerCase().includes('momos') || item.name.toLowerCase().includes('pizza') ? '🥟' :
                                item.name.toLowerCase().includes('fries') ? '🍟' :
                                  item.name.toLowerCase().includes('pav') || item.name.toLowerCase().includes('dosa') ? '🌮' :
                                    item.name.toLowerCase().includes('nuggets') ? '🍗' :
                                      item.name.toLowerCase().includes('drink') || item.name.toLowerCase().includes('soda') ? '🥤' :
                                        item.name.toLowerCase().includes('chai') || item.name.toLowerCase().includes('coffee') ? '☕' : '🍱'}
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-1 w-full px-1">{item.name}</h3>
                  <div className="flex items-center gap-1 mb-3">
                    <span className={`w-2 h-2 rounded-full ${item.veg_or_nonveg === 'veg' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <p className="text-xs text-gray-400 font-medium">{item.veg_or_nonveg === 'veg' ? 'Veg' : 'Non-Veg'}</p>
                  </div>

                  <div className="flex justify-between items-center w-full mt-auto">
                    <span className="font-bold text-lg text-gray-900">
                      ₹{item.price}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!item.availability_status}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-md transition-all ${!item.availability_status
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-br from-red-500 to-red-600 hover:shadow-lg hover:scale-110 active:scale-95'
                        }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              )))
            }
          </div>
        </div>
      )}

      {/* Enhanced Floating Cart */}
      {isStoreOpen && totalItems > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-50 px-4 animate-scale">
          <Link href="/cart" className="block">
            <div className="glass px-5 py-3.5 rounded-3xl shadow-2xl flex items-center justify-between active:scale-95 transition-transform max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shadow-lg shadow-red-200">
                  {totalItems}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Cart</span>
                  <span className="font-bold text-sm text-gray-900">View Items</span>
                </div>
              </div>
              <div className="bg-red-500 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md text-sm">
                →
              </div>
            </div>
          </Link>
        </div>
      )}
    </main>
  );
}
