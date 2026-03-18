"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { 
  Plus, Search, Trash2, Edit3, Grid, Save, X, GripVertical, 
  Layers, Package, ChevronRight, Hash
} from "lucide-react";
import { 
  getTenantCategories, 
  upsertCategory, 
  deleteCategory 
} from "@/app/actions/tenant";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoriesPage() {
  const { tenant } = useStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    display_order: 0
  });

  useEffect(() => {
    if (tenant?.id) fetchCategories();
  }, [tenant?.id]);

  const fetchCategories = async () => {
    setIsLoading(true);
    const result = await getTenantCategories(tenant!.id);
    if (result.success) {
      setCategories(result.data || []);
    }
    setIsLoading(false);
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        display_order: item.display_order || 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        display_order: categories.length  
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    if (!formData.name) return toast.error("Category name is required");

    const payload = editingItem 
      ? { ...formData, id: editingItem.id }
      : formData;

    const result = await upsertCategory(tenant.id, tenant.slug, payload);
    if (result.success) {
      toast.success(editingItem ? "Category updated" : "Category created");
      setIsModalOpen(false);
      fetchCategories();
    } else {
      toast.error("Failed to save category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!tenant) return;
    if (!confirm("Are you sure? Items in this category might become uncategorized.")) return;
    
    const result = await deleteCategory(tenant.id, tenant.slug, id);
    if (result.success) {
      toast.success("Category deleted");
      fetchCategories();
    } else {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
      { }
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-emerald-600" />
            Menu Categories
          </h1>
          <p className="text-neutral-500 mt-1">Organize your menu items into custom sections like "Breakfast", "Desserts", etc.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      { }
      <div className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm flex-shrink-0">
          <Grid className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-emerald-900">Why use categories?</h4>
          <p className="text-emerald-700/80 text-sm mt-1 leading-relaxed">
            Categories help customers find food faster. Items in "Drinks" will be grouped together under the "Drinks" tab on your storefront.
          </p>
        </div>
      </div>

      { }
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(n => (
            <div key={n} className="h-20 bg-neutral-100 rounded-[24px] animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-neutral-200">
          <div className="bg-neutral-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-300">
            <Layers className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-neutral-900">No categories yet</h3>
          <p className="text-neutral-500 mt-2">Start by creating your first menu section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-white p-6 rounded-[32px] border border-neutral-200 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
                      {index + 1}
                    </div>
                    <h3 className="font-black text-lg text-neutral-900">{cat.name}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(cat)}
                      className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-dashed border-neutral-100 mt-auto">
                    <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                        <Hash className="w-3.5 h-3.5" />
                        Order: {cat.display_order}
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                        Manage Items <ChevronRight className="w-4 h-4" />
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-neutral-900">
                    {editingItem ? "Edit Category" : "New Category"}
                  </h2>
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-full hover:bg-neutral-100 text-neutral-400"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-700 ml-1">Category Name</label>
                    <input 
                      required
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Italian Pizza"
                      className="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-[20px] focus:ring-2 focus:ring-emerald-600 outline-none transition-all font-medium"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-700 ml-1">Display Order</label>
                    <input 
                      type="number"
                      value={formData.display_order}
                      onChange={e => setFormData({...formData, display_order: parseInt(e.target.value)})}
                      placeholder="0"
                      className="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-[20px] focus:ring-2 focus:ring-emerald-600 outline-none transition-all font-medium"
                    />
                    <p className="text-[10px] text-neutral-400 font-bold uppercase ml-1">Smaller numbers appear first.</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-[20px] text-neutral-600 font-bold hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-[20px] font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                  >
                    <Save className="w-5 h-5" />
                    {editingItem ? "Save" : "Create"}
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
