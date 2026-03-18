"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, Trash2, Edit3, Image as ImageIcon, Check, X,
  Package, Tag, Info, ChevronRight, Save
} from "lucide-react";
import { 
  getMasterProducts, 
  upsertMasterProduct, 
  deleteMasterProduct 
} from "@/app/actions/super-admin";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function CatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
   
  const categories = ["ALL", ...Array.from(new Set(products.map(p => p.category_suggestion).filter(Boolean)))];
  
   
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_suggestion: "",
    default_image_url: "",
    is_public: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const result = await getMasterProducts();
    if (result.success) {
      setProducts(result.data || []);
    }
    setIsLoading(false);
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        category_suggestion: item.category_suggestion || "",
        default_image_url: item.default_image_url || "",
        is_public: item.is_public ?? true
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        description: "",
        category_suggestion: "",
        default_image_url: "",
        is_public: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Product name is required");

    const payload = editingItem 
      ? { ...formData, id: editingItem.id }
      : formData;

    setIsSubmitting(true);
    const result = await upsertMasterProduct(payload);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(editingItem ? "Product updated" : "Product created");
      setIsModalOpen(false);
      fetchProducts();
    } else {
      toast.error(result.error || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this master product?")) return;
    
    const result = await deleteMasterProduct(id);
    if (result.success) {
      toast.success("Product deleted from catalog");
      fetchProducts();
    } else {
      toast.error(result.error || "Failed to delete product");
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category_suggestion?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || p.category_suggestion === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-12 pb-12">
      { }
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <Package className="w-5 h-5 text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Master Catalog</h1>
          </div>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em] max-w-xl">Global Item Registry & Asset Repository</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-[#0a0a0a] border border-white/[0.03] px-6 py-4 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="text-right">
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Repository Volume</p>
              <p className="text-xl font-black text-white tracking-tighter">{products.length} Items</p>
            </div>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="group flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] active:scale-95"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Add Master Product
          </button>
        </div>
      </div>

      { }
      <div className="space-y-6">
        <div className="bg-[#0a0a0a] border border-white/[0.03] p-2 rounded-[2rem] shadow-2xl">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600 w-5 h-5" />
            <input 
              type="text"
              placeholder="FILTER REGISTRY BY NAME, CATEGORY, OR TAGS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-6 bg-transparent text-white font-bold placeholder:text-neutral-700 outline-none transition-all uppercase tracking-widest text-xs"
            />
          </div>
        </div>

        { }
        <div className="flex flex-wrap items-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={clsx(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                selectedCategory === cat
                  ? "bg-red-600 border-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  : "bg-[#0a0a0a] border-white/[0.05] text-neutral-500 hover:text-white hover:border-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      { }
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {[1,2,3,4,5].map(n => (
            <div key={n} className="aspect-[4/5] bg-[#0a0a0a] border border-white/[0.03] rounded-[2.5rem] animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-32 bg-[#0a0a0a] rounded-[3rem] border border-white/[0.03] shadow-2xl">
          <div className="w-24 h-24 rounded-[2rem] bg-neutral-900 border border-white/[0.03] flex items-center justify-center mx-auto mb-6 text-neutral-800">
            <Search className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">Registry Entry Not Found</h3>
          <p className="text-neutral-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Adjust filters or initialize new master record</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative flex flex-col bg-[#0a0a0a] border border-white/[0.03] rounded-[2.5rem] overflow-hidden hover:border-red-500/30 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
              >
                { }
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-900 border-b border-white/[0.03]">
                  {product.default_image_url ? (
                    <img 
                      src={product.default_image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-800 gap-2">
                      <ImageIcon className="w-10 h-10 stroke-[1]" />
                      <span className="text-[7px] font-black uppercase tracking-widest">No Asset Loaded</span>
                    </div>
                  )}

                  { }
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <button 
                      onClick={() => handleOpenModal(product)}
                      className="p-2.5 bg-white text-black rounded-xl hover:bg-neutral-200 transition-colors shadow-2xl"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-colors shadow-2xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {product.category_suggestion && (
                    <div className="absolute bottom-3 left-3">
                      <div className="px-2.5 py-1 bg-black/80 backdrop-blur-md text-[8px] font-black uppercase tracking-[0.15em] text-white border border-white/10 rounded-lg">
                        {product.category_suggestion}
                      </div>
                    </div>
                  )}
                </div>

                { }
                <div className="flex-1 p-6 flex flex-col justify-between min-h-[120px]">
                  <div className="space-y-2">
                    <h3 className="text-[15px] font-black text-white tracking-tight group-hover:text-red-500 transition-colors duration-300 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-[12px] text-neutral-500 font-medium leading-relaxed line-clamp-2">
                      {product.description || "Entry pending standardized metadata."}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-800">
                      <Package className="w-2.5 h-2.5" />
                      <span className="text-[7px] font-black uppercase tracking-widest">ID: {product.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      { }
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0a0a0a] w-full max-w-3xl rounded-[3rem] border border-white/[0.05] shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[850px]"
            >
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                <div className="p-10 border-b border-white/[0.03] flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">
                      {editingItem ? "Update Master Asset" : "Initialize Master Asset"}
                    </h2>
                    <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">Registry Record Calibration</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="p-3 rounded-2xl hover:bg-white/5 text-neutral-500 hover:text-white transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-10 space-y-8 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                        <Package className="w-3 h-3 text-red-500" />
                        Asset Identifier
                      </label>
                      <input 
                        required
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="E.G. CLASSIC MARGHERITA PIZZA"
                        className="w-full px-6 py-4 bg-black border border-white/[0.05] text-white font-bold rounded-2xl focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-neutral-800 uppercase tracking-widest text-xs"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                        <Tag className="w-3 h-3 text-red-500" />
                        Suggested Taxonomy
                      </label>
                      <input 
                        type="text"
                        value={formData.category_suggestion}
                        onChange={e => setFormData({...formData, category_suggestion: e.target.value})}
                        placeholder="E.G. PIZZA, BURGER, SNACKS"
                        className="w-full px-6 py-4 bg-black border border-white/[0.05] text-white font-bold rounded-2xl focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-neutral-800 uppercase tracking-widest text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon className="w-3 h-3 text-red-500" />
                      Global Visual Asset URL
                    </label>
                    <div className="flex gap-6">
                      <input 
                        type="url"
                        value={formData.default_image_url}
                        onChange={e => setFormData({...formData, default_image_url: e.target.value})}
                        placeholder="HTTPS://IMAGES.UNSPLASH.COM/..."
                        className="flex-1 px-6 py-4 bg-black border border-white/[0.05] text-white font-bold rounded-2xl focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-neutral-800 tracking-wide text-xs"
                      />
                      {formData.default_image_url && (
                        <div className="w-14 h-14 rounded-2xl border border-white/[0.05] overflow-hidden shadow-2xl flex-shrink-0 bg-black">
                          <img src={formData.default_image_url} className="w-full h-full object-cover opacity-80" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                      <Info className="w-3 h-3 text-red-500" />
                      Registry Description Metadata
                    </label>
                    <textarea 
                      rows={4}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="DEFINE STANDARDIZED DESCRIPTIVE METADATA FOR MERCHANTS..."
                      className="w-full px-6 py-4 bg-black border border-white/[0.05] text-white font-medium rounded-2xl focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none placeholder:text-neutral-800 tracking-wide text-xs min-h-[120px]"
                    />
                  </div>
                </div>

                <div className="p-10 bg-black border-t border-white/[0.03] flex items-center justify-end gap-5 shrink-0">
                  <button 
                    disabled={isSubmitting}
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 text-neutral-500 font-black text-xs uppercase tracking-[0.2em] hover:text-white transition-colors disabled:opacity-50"
                  >
                    Abort
                  </button>
                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {editingItem ? "Commit Changes" : "Create Record"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
