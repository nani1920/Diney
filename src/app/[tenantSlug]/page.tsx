"use client";

import { useStore } from "@/context/StoreContext";
import { useAdmin } from "@/context/AdminContext";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";
import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useOrderStore } from "@/store/useOrderStore";
import {
  ShoppingCart,
  Search,
  Clock,
  ArrowRight,
  X,
  Plus,
  Minus,
  Bell,
  ChevronDown,
  MapPin,
  Image as ImageIcon,
  Receipt,
  AlertTriangle
} from "lucide-react";
import clsx from "clsx";
import ResilientImage from "@/components/ResilientImage";
import { MenuItem } from "@/types";
import { validateTable, callWaiter } from "@/app/actions/orders";
import { toast } from "react-hot-toast";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">Loading...</div>}>
      <StoreContent />
    </Suspense>
  );
}

function StoreContent() {
  const {
    tenant, isStoreOpen, openingTime, closingTime,
    isLoading: isStoreLoading, customer
  } = useStore();
  const { menuItems, categories, isLoading: isAdminLoading } = useAdmin();
  const { cart, addToCart, updateCartQuantity } = useCart();
  const { orders } = useOrders();
  const { setOrderType, setTableNumber, orderType, tableNumber } = useOrderStore();

  const searchParams = useSearchParams();
  const tableQuery = searchParams.get('table');

  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCalling, setIsCalling] = useState(false);

  const totalItems = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  const activeOrdersCount = orders ? orders.filter(o => {
    const isMyOrder = customer ? o.customer_mobile === customer.mobile : false;
    const isActiveStatus = o.order_status === "received" || o.order_status === "preparing" || o.order_status === "ready";
    return isMyOrder && isActiveStatus;
  }).length : 0;

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    
    const baseItems = menuItems.filter((item: any) => {
      const matchesCategory = activeCategoryId === "all" || item.category_id === activeCategoryId;
      const matchesSearch = searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return [...baseItems].sort((a, b) => {
      const aVal = a.availability_status ? 1 : 0;
      const bVal = b.availability_status ? 1 : 0;
      return bVal - aVal;
    });
  }, [menuItems, activeCategoryId, searchQuery]);

  const getItemInCart = (itemId: string) => cart.find(c => c.uniqueId === `${itemId}-[]`);

  const activeCategoryLabel = activeCategoryId === "all"
    ? "All Items"
    : categories?.find((c: any) => c.id === activeCategoryId)?.name || "Items";

  const [isValidatingTable, setIsValidatingTable] = useState(false);
  const [tableOccupiedError, setTableOccupiedError] = useState(false);
  const [tableNotFoundError, setTableNotFoundError] = useState(false);

  useEffect(() => {
    const checkTable = async () => {
        if (tableQuery && tenant) {
            setIsValidatingTable(true);
            try {
                const res = await validateTable(tenant.id, tableQuery, customer?.mobile);
                if (res?.success && res.data) {
                    if (res.data.isOccupiedByOther) {
                        setTableOccupiedError(true);
                        setTableNotFoundError(false);
                    } else {
                        setOrderType('DINE_IN');
                        setTableNumber(tableQuery);
                        setTableNotFoundError(false);
                        setTableOccupiedError(false);
                    }
                } else {
                    setTableNotFoundError(true);
                    setTableOccupiedError(false);
                    setOrderType('TAKEAWAY');
                    setTableNumber(null);
                }
            } catch (error) {
                console.error("Table validation error:", error);
            } finally {
                setIsValidatingTable(false);
            }
        } else if (!tableQuery) {
            // Strictly enforce TAKEAWAY mode if no table query is present in the URL
            setOrderType('TAKEAWAY');
            setTableNumber(null);
        }
    };
    checkTable();
  }, [tableQuery, tenant, customer?.mobile, setOrderType, setTableNumber]);

  return (
    <main className="min-h-screen bg-[#FAFAF8] relative max-w-[520px] mx-auto overflow-x-hidden">
      {tenant?.is_active === false && !isStoreLoading && (
        <div className="fixed inset-0 z-[60] bg-neutral-900 flex flex-col items-center justify-center p-8 text-center text-white">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-4xl mb-6">
            🚫
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Store Offline</h1>
          <p className="text-neutral-400 text-sm max-w-xs">
            {tenant?.name || "This store"} is currently unavailable. Please contact the store owner.
          </p>
        </div>
      )}

      {tableOccupiedError && !isValidatingTable && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-8 text-center">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="max-w-xs w-full space-y-8"
            >
                <div className="w-24 h-24 bg-orange-50 rounded-[2.5rem] flex items-center justify-center text-orange-500 mx-auto shadow-sm">
                    <Clock size={48} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-[24px] font-bold text-neutral-900 tracking-tight leading-tight uppercase italic">
                        Table <span className="text-orange-500">Occupied</span>
                    </h2>
                    <p className="text-[14px] text-neutral-400 font-medium leading-relaxed">
                        This table is already <span className="font-bold text-neutral-900">occupied or booked</span> at this time.
                    </p>
                    <p className="text-[12px] text-neutral-400">
                        Please try scanning another table or continue as a <span className="font-bold">takeaway</span> order.
                    </p>
                </div>
                <Link href={`/${tenant?.slug}`}>
                    <button 
                        onClick={() => {
                            setTableOccupiedError(false);
                            setOrderType('TAKEAWAY');
                            setTableNumber(null);
                        }}
                        className="w-full h-14 bg-neutral-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[12px] shadow-xl shadow-neutral-900/10 active:scale-[0.98] transition-all mt-4"
                    >
                        Order Takeaway
                    </button>
                </Link>
            </motion.div>
        </div>
      )}

      {tableNotFoundError && !isValidatingTable && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-8 text-center">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="max-w-xs w-full space-y-8"
            >
                <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-500 mx-auto shadow-sm">
                    <AlertTriangle size={48} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-[24px] font-bold text-neutral-900 tracking-tight leading-tight uppercase italic">
                        Table <span className="text-red-500">Not Found</span>
                    </h2>
                    <p className="text-[14px] text-neutral-400 font-medium leading-relaxed">
                        The table <span className="font-bold text-neutral-900">"{tableQuery}"</span> does not exist in our system. Please check the QR code or ask our staff for assistance.
                    </p>
                </div>
                <Link href={`/${tenant?.slug}`}>
                    <button 
                        onClick={() => setTableNotFoundError(false)}
                        className="w-full h-14 bg-neutral-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[12px] shadow-xl shadow-neutral-900/10 active:scale-[0.98] transition-all mt-4"
                    >
                        Return to Menu
                    </button>
                </Link>
            </motion.div>
        </div>
      )}

      {!isStoreOpen && tenant?.is_active !== false && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm w-full space-y-8">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-5xl mx-auto">🌙</div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">We're Closed</h2>
              <p className="text-neutral-400 text-sm">{tenant?.name} is resting. We'll be back soon!</p>
            </div>
            <div className="bg-neutral-50 p-6 rounded-2xl">
              <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                <Clock className="w-3.5 h-3.5" />
                <span>Business Hours</span>
              </div>
              <div className="flex justify-center items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-neutral-400 mb-0.5">Opens</p>
                  <p className="text-xl font-bold">{openingTime} AM</p>
                </div>
                <div className="w-6 h-px bg-neutral-200" />
                <div className="text-center">
                  <p className="text-xs text-neutral-400 mb-0.5">Closes</p>
                  <p className="text-xl font-bold">{closingTime} PM</p>
                </div>
              </div>
            </div>
            <button onClick={() => window.location.reload()}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-900 transition-colors">
              ↻ Check Again
            </button>
          </motion.div>
        </div>
      )}

      {isStoreOpen && (
        <>
          <div className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-lg border-b border-neutral-100/60">
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-[18px] h-[18px] text-emerald-600 flex-shrink-0" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <h1 className="text-[16px] font-bold text-neutral-900 leading-none tracking-[-0.01em]">{tenant?.name || "Store"}</h1>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-300 translate-y-[1px]" />
                  </div>
                  <div className="flex items-center gap-2">
                    {orderType === 'DINE_IN' && tableNumber ? (
                      <>
                        <span className="text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded-md">Dining at Table {tableNumber}</span>
                        <button 
                          onClick={async () => {
                            if (!tenant) return;
                            
                            // Check for local cooldown
                            if (isCalling) {
                              toast("Our waiter is on the way! 🏃‍♂️ If not, please try again in a moment.", { 
                                icon: "⏳",
                                style: { borderRadius: '10px', background: '#333', color: '#fff' }
                              });
                              return;
                            }

                            setIsCalling(true);
                            try {
                              const res = await callWaiter(tenant.id, tableNumber);
                              if (res?.success) {
                                toast.success("Waiter notified!", { icon: "🔔" });
                              } else {
                                toast.error(res?.error || "Error calling waiter");
                              }
                            } finally {
                              setTimeout(() => setIsCalling(false), 60000); // 60s cooldown
                            }
                          }}
                          className={clsx(
                            "p-1 rounded-md transition-all active:scale-95",
                            isCalling ? "bg-orange-400" : "bg-orange-600 hover:bg-orange-700"
                          )}
                          title="Call Waiter"
                        >
                          <Bell className={clsx("w-3.5 h-3.5 text-white", isCalling && "animate-pulse")} />
                        </button>
                      </>
                    ) : (customer ? `Hi, ${customer.name} 👋` : "Order delicious food")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/${tenant?.slug}/my-orders`}>
                  <div className="relative w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/50">
                    <Bell className="w-5 h-5" />
                    {activeOrdersCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#FAFAF8] shadow-sm leading-none pl-[0.5px] pt-[0.5px]">
                        {activeOrdersCount}
                      </span>
                    )}
                  </div>
                </Link>
                {orderType === 'DINE_IN' && tableNumber && customer && (
                  <Link href={`/${tenant?.slug}/bill`}>
                    <div className="relative h-10 px-3 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100/50 hover:bg-orange-100 transition-colors gap-1.5">
                      <Receipt className="w-4 h-4" />
                      <span className="text-xs font-bold">Live Bill</span>
                    </div>
                  </Link>
                )}
                <Link href={`/${tenant?.slug}/cart`}>
                  <div className="relative w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-100/50">
                    <ShoppingCart className="w-5 h-5" />
                    {cart.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#FAFAF8] shadow-sm leading-none pl-[0.5px] pt-[0.5px]">
                        {cart.reduce((acc: number, item: any) => acc + item.quantity, 0)}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            </div>

            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral-300" />
                <input
                  type="text"
                  placeholder="Search for dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-11 pr-11 bg-white rounded-2xl outline-none text-[15px] font-medium text-neutral-800 placeholder:text-neutral-300 border border-neutral-200/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all shadow-sm shadow-neutral-100/50"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="px-5 pb-3.5 flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveCategoryId("all")}
                className={clsx(
                  "px-5 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-200",
                  activeCategoryId === "all"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/15"
                    : "bg-white text-neutral-500 border border-neutral-200/50 hover:border-emerald-300 hover:text-emerald-700"
                )}
              >
                All
              </button>
              {categories && categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={clsx(
                    "px-5 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-200",
                    activeCategoryId === cat.id
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/15"
                      : "bg-white text-neutral-500 border border-neutral-200/50 hover:border-emerald-300 hover:text-emerald-700"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 pt-4">
            <div className="relative h-44 rounded-3xl overflow-hidden shadow-sm">
              <Image src="/hero-bg.png" alt="" fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-white/60 text-[11px] font-semibold uppercase tracking-wider mb-1">Today's picks</p>
                <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.02em]">
                  Fresh & Delicious 🔥
                </h2>
              </div>
            </div>
          </div>

          <div className="px-5 pt-6 pb-4 flex items-center justify-between">
            <h3 className="text-[20px] font-bold text-neutral-900 tracking-[-0.02em]">
              {activeCategoryLabel}
            </h3>
            <span className="text-[13px] text-neutral-400 font-medium">{filteredItems.length} items</span>
          </div>

          <div className="px-5 pb-32">
            <motion.div
              key={activeCategoryId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              {isAdminLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-neutral-200/30 flex items-center gap-4 animate-pulse">
                      <div className="w-[88px] h-[88px] bg-neutral-100 rounded-2xl" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-neutral-100 rounded w-2/3" />
                        <div className="h-3 bg-neutral-100 rounded w-1/2" />
                        <div className="h-6 bg-neutral-100 rounded w-1/4 mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="w-8 h-8 text-neutral-200" />
                  </div>
                  <p className="text-neutral-400 text-sm font-medium">No items found in this section</p>
                </div>
              ) : (
                filteredItems.map((item: any, index: number) => {
                  const cartItem = getItemInCart(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                      className={clsx(
                        "flex gap-4 p-4 rounded-2xl border transition-all duration-200",
                        !item.availability_status
                          ? "bg-neutral-50/50 border-neutral-100 opacity-50"
                          : "bg-white border-neutral-200/30 hover:border-emerald-200 hover:shadow-md shadow-sm shadow-neutral-100/40"
                      )}
                    >
                      <div className="relative flex-shrink-0 w-[94px] h-[94px] rounded-2xl bg-neutral-50 overflow-hidden">
                        {item.image_url ? (
                          <ResilientImage
                            src={item.image_url}
                            fill
                            sizes="94px"
                            className="object-cover"
                            alt={item.name}
                            fallbackEmoji={getFoodEmoji(item.name)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300">
                            <span className="text-[42px]">{getFoodEmoji(item.name)}</span>
                          </div>
                        )}
                        {!item.availability_status && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <span className="text-[10px] font-bold tracking-tighter text-neutral-500 bg-white px-2 py-1 rounded shadow-sm">SOLD OUT</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-[16px] font-bold text-neutral-900 leading-tight line-clamp-2 tracking-tight">
                              {item.name}
                            </h4>
                            <div className={clsx(
                              "w-[14px] h-[14px] rounded-[3px] flex-shrink-0 border flex items-center justify-center mt-1",
                              item.veg_or_nonveg === "veg" ? "border-green-600" : "border-red-500"
                            )}>
                              <div className={clsx(
                                "w-[6px] h-[6px] rounded-full",
                                item.veg_or_nonveg === "veg" ? "bg-green-600" : "bg-red-500"
                              )} />
                            </div>
                          </div>
                          <p className="text-[12px] text-neutral-400 font-medium line-clamp-2 leading-relaxed">{item.description}</p>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[17px] font-bold text-neutral-900 tracking-tight">₹{item.price}</span>

                          {item.availability_status && (
                            cartItem ? (
                              <div className="flex items-center bg-emerald-600 h-9 rounded-xl overflow-hidden shadow-lg shadow-emerald-600/10">
                                <button onClick={() => updateCartQuantity(cartItem.uniqueId, -1)}
                                  className="w-9 h-9 flex items-center justify-center text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors">
                                  <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                                </button>
                                <span className="text-white text-[14px] font-bold w-6 text-center">{cartItem.quantity}</span>
                                <button onClick={() => addToCart(item)}
                                  className="w-9 h-9 flex items-center justify-center text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors">
                                  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                                </button>
                              </div>
                            ) : (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addToCart(item)}
                                className="h-9 px-5 bg-white text-emerald-600 border border-emerald-100 rounded-xl text-[13px] font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              >
                                ADD
                              </motion.button>
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>

            <div className="mt-20 pb-12 flex flex-col items-center justify-center gap-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Powered By</span>
              <Image src="/logo.png" alt="Diney" width={100} height={32} className="h-8 w-auto object-contain" />
            </div>
          </div>

          <AnimatePresence>
            {totalItems > 0 && (
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                className="fixed bottom-0 left-0 right-0 z-50 p-5 pb-8 pointer-events-none"
              >
                <div className="max-w-[520px] mx-auto pointer-events-auto">
                  <Link href={`/${tenant?.slug}/cart`}>
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="bg-emerald-600 px-6 py-4 rounded-3xl shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] flex items-center justify-between border border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 w-11 h-11 rounded-2xl flex items-center justify-center">
                          <span className="text-white text-lg font-bold">{totalItems}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">{totalItems === 1 ? "Dish added" : "Dishes added"}</span>
                          <span className="text-white text-[20px] font-bold tracking-tight leading-none">₹{cartTotal}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white text-sm font-bold uppercase tracking-wider">Checkout</span>
                        <div className="bg-white w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transform group-hover:translate-x-1 transition-transform">
                          <ArrowRight className="w-5 h-5 text-emerald-600" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </main>
  );
}

function getFoodEmoji(name: string) {
  const n = name.toLowerCase();
  if (n.includes("samosa")) return "🥟";
  if (n.includes("cutlet")) return "🍘";
  if (n.includes("pakora") || n.includes("bread")) return "🥙";
  if (n.includes("burger") || n.includes("wrap")) return "🍔";
  if (n.includes("momos") || n.includes("pizza")) return "🥟";
  if (n.includes("fries")) return "🍟";
  if (n.includes("pav") || n.includes("dosa")) return "🌮";
  if (n.includes("nuggets")) return "🍗";
  if (n.includes("drink") || n.includes("soda") || n.includes("thums")) return "🥤";
  if (n.includes("chai") || n.includes("coffee") || n.includes("tea")) return "☕";
  return "🍱";
}
