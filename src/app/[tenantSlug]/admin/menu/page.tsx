"use client";

import { useStore } from "@/context/StoreContext";
import { MenuItem } from "@/types";
import { useState, useEffect } from "react";
import {
  Plus, Edit2, Trash2, Search, Filter, MoreHorizontal, Check,
  Package, LayoutGrid, Layers, Globe, ArrowRight, X, Save, Image as ImageIcon, ChevronRight, Hash
} from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { getTenantCategories } from "@/app/actions/tenant";
import { getMasterProducts } from "@/app/actions/super-admin";
import { toast } from "react-hot-toast";

// Fallback UUID generator for non-secure contexts (lvh.me)
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export default function MenuManagementPage() {
  const { tenant, menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useStore();

  // State
  const [categories, setCategories] = useState<any[]>([]);
  const [masterProducts, setMasterProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [isBrowsingCatalog, setIsBrowsingCatalog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "veg" | "non-veg">("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState(false);

  // Catalog Internal State
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [catalogActiveCategory, setCatalogActiveCategory] = useState("all");

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    }
  }, [tenant?.id]);

  const loadData = async () => {
    // Only show loading if we don't have categories yet
    if (categories.length === 0) setIsLoading(true);
    
    const [catRes, masterRes] = await Promise.all([
      getTenantCategories(tenant!.id),
      getMasterProducts()
    ]);
    if (catRes.success) setCategories(catRes.data || []);
    if (masterRes.success) setMasterProducts(masterRes.data || []);
    setIsLoading(false);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiet = filterType === "all" || item.veg_or_nonveg === filterType;
    const matchesCat = activeCategory === "all" || (item as any).category_id === activeCategory;
    return matchesSearch && matchesDiet && matchesCat;
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    const formData = new FormData(e.currentTarget);
    const newItem: any = {
      id: editingItem?.id || generateUUID(),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: Number(formData.get("price")),
      veg_or_nonveg: formData.get("veg_or_nonveg") as "veg" | "non-veg",
      category_id: formData.get("category_id") as string,
      image_url: formData.get("image_url") as string,
      availability_status: true,
      prep_time_minutes: Number(formData.get("prep_time_minutes")) || 10,
      master_product_id: (editingItem as any)?.master_product_id,
    };
    const success = await addMenuItem(newItem);
    setIsProcessing(false);
    if (success) {
      setIsAdding(false);
      setEditingItem(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsProcessing(true);
    const formData = new FormData(e.currentTarget);
    const updated: any = {
      ...editingItem,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: Number(formData.get("price")),
      veg_or_nonveg: formData.get("veg_or_nonveg") as "veg" | "non-veg",
      category_id: formData.get("category_id") as string,
      image_url: formData.get("image_url") as string,
      prep_time_minutes: Number(formData.get("prep_time_minutes")) || editingItem.prep_time_minutes,
    };
    const success = await updateMenuItem(updated);
    setIsProcessing(false);
    if (success) setEditingItem(null);
  };

  const importFromCatalog = (product: any) => {
    const name = product.name.toLowerCase();
    const isClassicNonVeg = name.includes('chicken') || name.includes('meat') || name.includes('egg') || name.includes('fish');
    const suggested = product.category_suggestion?.toLowerCase();
    const matchedCategory = categories.find(c => c.name.toLowerCase() === suggested);

    const newItem: any = {
      id: generateUUID(),
      name: product.name,
      description: product.description,
      price: 0,
      veg_or_nonveg: isClassicNonVeg ? 'non-veg' : 'veg',
      image_url: product.default_image_url,
      availability_status: true,
      prep_time_minutes: 10,
      master_product_id: product.id,
      category_id: matchedCategory?.id || categories[0]?.id || "",
    };

    setEditingItem(newItem);
    setIsAdding(true);
    setIsBrowsingCatalog(false);
    toast.success("Imported! Now set your price.");
  };

  const toggleAvailability = async (item: MenuItem) => {
    setIsProcessing(true);
    await updateMenuItem({ ...item, availability_status: !item.availability_status });
    setIsProcessing(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen bg-neutral-50/30">
      {/* Refined Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Menu Management</h1>
          </div>
          <p className="text-neutral-400 text-sm font-medium italic px-1">Curate your store's culinary identity.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Action Bar - Unified Height */}
          <div className="flex items-center gap-3 flex-1 lg:w-[450px]">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 w-4 h-4 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border border-neutral-100 rounded-xl shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-sm text-neutral-900"
              />
            </div>

            <div className="flex bg-white p-1 rounded-xl border border-neutral-100 shadow-sm h-12">
              {(["all", "veg", "non-veg"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={clsx(
                    "px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    filterType === type ? "bg-neutral-900 text-white" : "text-neutral-400 hover:text-neutral-600"
                  )}
                >
                  {type === "all" ? "All" : type === "veg" ? "Veg" : "Non-Veg"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 h-12">
            <button
              onClick={() => setIsBrowsingCatalog(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 bg-white text-emerald-600 border border-emerald-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all active:scale-[0.98] shadow-sm"
            >
              <Globe className="w-4 h-4" />
              <span>Catalog</span>
            </button>
            <button
              onClick={() => { setEditingItem(null); setIsAdding(true); }}
              className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
              title="Add Custom Item"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Horizontal Category Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide py-1">
        <button
          onClick={() => setActiveCategory("all")}
          className={clsx(
            "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 flex items-center gap-2",
            activeCategory === "all"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100"
              : "bg-white text-neutral-500 border-neutral-100 hover:border-emerald-200 hover:text-emerald-600"
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          All Items
          <span className={clsx("px-1.5 py-0.5 rounded-md text-[8px]", activeCategory === "all" ? "bg-white/20 text-white" : "bg-neutral-50 text-neutral-400")}>
            {menuItems.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = menuItems.filter(i => (i as any).category_id === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={clsx(
                "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 flex items-center gap-2",
                activeCategory === cat.id
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100"
                  : "bg-white text-neutral-500 border-neutral-100 hover:border-emerald-200 hover:text-emerald-600"
              )}
            >
              {cat.name}
              <span className={clsx("px-1.5 py-0.5 rounded-md text-[8px]", activeCategory === cat.id ? "bg-white/20 text-white" : "bg-neutral-50 text-neutral-400")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => {
            const category = categories.find(c => c.id === (item as any).category_id);
            return (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group bg-white rounded-[2rem] border border-neutral-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 transition-all p-3 flex flex-col h-full"
              >
                <div className="aspect-[4/3] relative rounded-[1.5rem] overflow-hidden mb-3 bg-neutral-50">
                  {item.image_url ? (
                    <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-200">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2">
                    <div className={clsx(
                      "w-4 h-4 rounded-lg border-2 border-white shadow-sm flex items-center justify-center",
                      item.veg_or_nonveg === "veg" ? "bg-green-500" : "bg-red-500"
                    )}>
                      <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="w-8 h-8 bg-white/95 backdrop-blur-md rounded-lg flex items-center justify-center text-neutral-900 hover:text-emerald-600 shadow-xl transition-all active:scale-90"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm("Delete this item?")) deleteMenuItem(item.id); }}
                      className="w-8 h-8 bg-white/95 backdrop-blur-md rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 shadow-xl transition-all active:scale-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 px-1">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-bold text-[13px] text-neutral-900 tracking-tight leading-tight line-clamp-1">{item.name}</h3>
                    <span className="text-[13px] font-black text-emerald-600 mt-0.5 whitespace-nowrap">₹{item.price}</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-medium line-clamp-2 leading-relaxed italic mb-3">
                    {item.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-50 flex items-center justify-between">
                  <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">{category?.name || "Ungrouped"}</span>
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={clsx(
                      "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                      item.availability_status ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-orange-50 text-orange-600 border border-orange-100"
                    )}
                  >
                    {item.availability_status ? "Ready" : "Hold"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-dashed border-neutral-200">
          <div className="w-20 h-20 bg-neutral-50 rounded-[2rem] flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-neutral-200" />
          </div>
          <h3 className="text-xl font-black text-neutral-300 tracking-tighter uppercase">No match found</h3>
          <p className="text-neutral-400 font-medium max-w-xs mt-2 italic">Try broadening your search or creating a new item.</p>
        </div>
      )}

      {/* Product Detail Modal (Add/Edit) */}
      <AnimatePresence>
        {(isAdding || editingItem) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              key={editingItem?.id || 'new'}
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden relative"
            >
              <button onClick={() => { setIsAdding(false); setEditingItem(null); }} className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl bg-neutral-50 text-neutral-400 hover:text-neutral-900 transition-all z-10">
                <X className="w-5 h-5" />
              </button>

              <div className="p-10 md:p-12">
                <header className="mb-10">
                  <h2 className="text-3xl font-black text-neutral-900 tracking-tighter">
                    {isAdding ? "Craft Flavor" : "Refine Flavor"}
                  </h2>
                  <p className="text-neutral-400 text-sm font-medium italic mt-1">Details define the difference.</p>
                </header>

                <form onSubmit={isAdding ? handleCreate : handleUpdate} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest px-1">Product Identity</label>
                    <input
                      required
                      name="name"
                      defaultValue={editingItem?.name}
                      className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-neutral-900"
                      placeholder="e.g. Sizzling Paneer Burger"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest px-1">Price (₹)</label>
                      <input
                        required
                        type="number"
                        name="price"
                        defaultValue={editingItem?.price}
                        className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-neutral-900"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest px-1">Category</label>
                      <select
                        name="category_id"
                        defaultValue={(editingItem as any)?.category_id || (categories[0]?.id || '')}
                        className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-neutral-900 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22m19%209-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                      >
                        <option value="">Ungrouped</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest px-1">Description</label>
                    <textarea
                      required
                      name="description"
                      defaultValue={editingItem?.description}
                      className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all h-24 resize-none font-medium italic"
                      placeholder="Describe the flavors..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest px-1">Dietary Status</label>
                      <select name="veg_or_nonveg" defaultValue={editingItem?.veg_or_nonveg || "veg"} className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-neutral-900 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%23cbd5e1%22%20stroke-width%3D%222%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22m19%209-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat">
                        <option value="veg">Veg</option>
                        <option value="non-veg">Non-Veg</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest px-1">Wait Time (min)</label>
                      <input
                        required
                        type="number"
                        name="prep_time_minutes"
                        defaultValue={editingItem?.prep_time_minutes || 10}
                        className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-neutral-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-300 uppercase tracking-widest px-1">Image URL</label>
                    <input
                      name="image_url"
                      defaultValue={editingItem?.image_url}
                      className="w-full px-6 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-neutral-900"
                      placeholder="Paste link here..."
                    />
                  </div>

                  <div className="pt-6 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => { setIsAdding(false); setEditingItem(null); }}
                      className="flex-1 py-5 text-neutral-400 font-black uppercase tracking-widest hover:text-neutral-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-[2] py-5 bg-neutral-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-2xl shadow-neutral-200 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {isProcessing ? "Saving..." : editingItem?.id ? "Apply Fix" : "Confirm Entry"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Catalog Browser Overlay */}
      <AnimatePresence>
        {isBrowsingCatalog && (() => {
          const masterCategories = ["all", ...new Set(masterProducts.map(p => p.category_suggestion).filter(Boolean))];
          const filteredMaster = masterProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
              p.description?.toLowerCase().includes(catalogSearchQuery.toLowerCase());
            const matchesCat = catalogActiveCategory === "all" || p.category_suggestion === catalogActiveCategory;
            return matchesSearch && matchesCat;
          });

          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-neutral-950/90 backdrop-blur-xl flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 40 }} className="bg-white w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                <header className="px-10 py-8 border-b border-neutral-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                      <Globe className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-neutral-900 tracking-tighter">Master Catalog</h2>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mt-1">Global Library</p>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md mx-10">
                    <div className="relative group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search assets..."
                        value={catalogSearchQuery}
                        onChange={(e) => setCatalogSearchQuery(e.target.value)}
                        className="w-full h-14 pl-16 pr-6 bg-neutral-50 border border-neutral-100 rounded-[2rem] text-sm font-bold focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button onClick={() => setIsBrowsingCatalog(false)} className="w-14 h-14 flex items-center justify-center hover:bg-neutral-50 rounded-2xl text-neutral-400 hover:text-neutral-900 transition-all border border-neutral-100">
                    <X className="w-7 h-7" />
                  </button>
                </header>

                <div className="flex-1 flex overflow-hidden">
                  <aside className="w-72 border-r border-neutral-100 flex flex-col bg-neutral-50/20">
                    <div className="p-8">
                      <h3 className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em] mb-6 px-2">Types</h3>
                      <div className="space-y-1.5">
                        {masterCategories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setCatalogActiveCategory(cat)}
                            className={clsx(
                              "w-full px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-left transition-all flex items-center justify-between group",
                              catalogActiveCategory === cat ? "bg-white text-emerald-600 shadow-sm border border-neutral-100" : "text-neutral-400 hover:text-neutral-900"
                            )}
                          >
                            {cat === "all" ? "All assets" : cat}
                            {catalogActiveCategory === cat ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </aside>

                  <div className="flex-1 overflow-y-auto p-8 bg-neutral-50/10 scrollbar-hide">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredMaster.map(product => (
                        <motion.div
                          layout
                          key={product.id}
                          className="group bg-white rounded-[2.5rem] p-4 border border-neutral-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all flex flex-col h-full"
                        >
                          <div className="aspect-square relative rounded-[1.8rem] overflow-hidden mb-4 shadow-inner">
                            <img src={product.default_image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={product.name} />
                          </div>
                          <div className="flex-1 px-1">
                            <h4 className="text-sm font-black text-neutral-900 mb-1 tracking-tight">{product.name}</h4>
                            <p className="text-[11px] font-medium text-neutral-400 line-clamp-2 leading-relaxed italic">{product.description}</p>
                          </div>
                          <button
                            onClick={() => importFromCatalog(product)}
                            className="w-full mt-6 py-4 bg-neutral-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-xl shadow-neutral-100 hover:shadow-emerald-100"
                          >
                            <Plus className="w-4 h-4" />
                            Import to Store
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    {filteredMaster.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 bg-neutral-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-neutral-100 mb-8">
                          <Search className="w-10 h-10 text-neutral-200" />
                        </div>
                        <h3 className="text-2xl font-black text-neutral-300 tracking-tighter uppercase">No match</h3>
                        <p className="text-neutral-400 font-medium max-w-xs mt-3 italic">Try searching for a different flavor profile.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
