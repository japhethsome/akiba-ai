"use client";

import React, { useState, useMemo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addProduct, updateProduct, restockProduct } from "@/lib/actions/inventory";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  buyingPrice: number;
  stock: number;
  reorderLevel: number;
  lastUpdated: string;
  supplierId?: string | null;
}

export function InventoryClient({ userRole, initialProducts, suppliers = [] }: { userRole: string, initialProducts: Product[], suppliers?: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isPending, startTransition] = useTransition();

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);

  // Form States
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", category: "Groceries", sellingPrice: 0, buyingPrice: 0, stock: 0, reorderLevel: 5, supplierId: "" });
  const [restockAmount, setRestockAmount] = useState(0);

  // Dynamically extract unique categories from actual products
  const categories = useMemo(() => {
    const cats = new Set(initialProducts.map(p => p.category));
    return ["All", ...Array.from(cats)];
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [initialProducts, searchQuery, selectedCategory]);

  const lowStockCount = initialProducts.filter(p => p.stock <= p.reorderLevel).length;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
  };

  const handleAddProduct = () => {
    if (!formData.name) return;
    startTransition(async () => {
      if (editingProductId) {
        await updateProduct(editingProductId, formData);
      } else {
        await addProduct(formData);
      }
      setIsAddModalOpen(false);
      setEditingProductId(null);
      setFormData({ name: "", category: "Groceries", sellingPrice: 0, buyingPrice: 0, stock: 0, reorderLevel: 5, supplierId: "" });
    });
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      sellingPrice: product.price,
      buyingPrice: product.buyingPrice,
      stock: product.stock,
      reorderLevel: product.reorderLevel,
      supplierId: product.supplierId || "",
    });
    setIsAddModalOpen(true);
  };

  const handleRestock = () => {
    if (!restockTarget || restockAmount <= 0) return;
    startTransition(async () => {
      await restockProduct(restockTarget.id, restockAmount);
      setRestockTarget(null);
      setRestockAmount(0);
    });
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#171d1a]">Inventory</h1>
          <p className="text-[#6d7a73] font-medium mt-1">Manage your stock levels and product catalog.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="hidden md:flex bg-white border border-[#e4eae4] p-1 rounded-xl shadow-sm">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-[#f5fbf5] text-[#00694c] shadow-sm" : "text-[#bccac1] hover:text-[#6d7a73] hover:bg-gray-50"}`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === "list" ? "bg-[#f5fbf5] text-[#00694c] shadow-sm" : "text-[#bccac1] hover:text-[#6d7a73] hover:bg-gray-50"}`}
              title="List View"
            >
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
          </div>

          {userRole === "owner" && (
            <motion.button 
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingProductId(null);
                setFormData({ name: "", category: "Groceries", sellingPrice: 0, buyingPrice: 0, stock: 0, reorderLevel: 5, supplierId: "" });
                setIsAddModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#00694c] to-[#008560] text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-[#00694c]/20 transition-all w-full md:w-auto"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Add Product
            </motion.button>
          )}
        </div>
      </div>

      {/* AI Low Stock Alert (Proactive) */}
      <AnimatePresence>
        {lowStockCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="bg-[#fff1f2] border border-[#fecdd3] p-6 rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#fb7185] to-[#e11d48] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20 shrink-0">
                  <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#9f1239]">Action Required</h3>
                  <p className="text-[#be123c] text-sm font-medium">Akiba AI detected <strong className="font-black">{lowStockCount} items</strong> at or below critical reorder levels.</p>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#9f1239] text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-[#881337] transition-colors shadow-lg shadow-[#9f1239]/20 w-full md:w-auto text-center"
              >
                Generate Restock List
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">search</span>
          <input 
            type="text" 
            placeholder="Search by product name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-12 bg-white border border-[#e4eae4] rounded-2xl text-sm font-medium outline-none focus:border-[#00694c] focus:ring-4 focus:ring-[#00694c]/5 transition-all shadow-sm"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bccac1] hover:text-[#e11d48] transition-colors flex items-center justify-center p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                selectedCategory === cat 
                  ? "bg-[#171d1a] text-white border-[#171d1a] shadow-lg shadow-black/10" 
                  : "bg-white text-[#6d7a73] border-[#e4eae4] hover:border-[#bccac1] hover:bg-gray-50 hover:text-[#171d1a]"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="popLayout">
          {filteredProducts.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#e4eae4] border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="w-20 h-20 bg-[#f5fbf5] rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] text-[#00694c] opacity-50">inventory_2</span>
              </div>
              <h3 className="text-xl font-black text-[#171d1a] mb-2">No Products Found</h3>
              <p className="text-[#6d7a73] text-sm max-w-md mb-8">
                {searchQuery 
                  ? `We couldn't find any products matching "${searchQuery}" in ${selectedCategory}.` 
                  : "Your inventory is currently empty. Add your first product to start tracking stock."}
              </p>
              
              {searchQuery ? (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                  className="bg-[#f0f4f0] text-[#00694c] px-6 py-3 rounded-xl font-black text-sm hover:bg-[#e6eee6] transition-colors"
                >
                  Clear Filters
                </motion.button>
              ) : userRole === "owner" ? (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-[#00694c] text-white px-6 py-3 rounded-xl font-black text-sm shadow-lg shadow-[#00694c]/20 transition-all"
                >
                  Add Your First Product
                </motion.button>
              ) : null}
            </motion.div>
          ) : (
            viewMode === "grid" ? (
              /* Grid View */
              <motion.div 
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {filteredProducts.map((product) => (
                    <motion.div 
                      layout
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      whileHover={{ y: -4 }}
                      className="bg-white p-6 rounded-[24px] border border-[#e4eae4] hover:border-[#00a87a] hover:shadow-2xl hover:shadow-[#00a87a]/10 transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-[#f5fbf5] text-[#00694c] border border-[#e4eae4]">
                          {product.category}
                        </div>
                        <motion.button 
                          onClick={() => openEditModal(product)}
                          whileHover={{ scale: 1.1, backgroundColor: "#f0f4f0" }}
                          whileTap={{ scale: 0.9 }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[#bccac1] hover:text-[#00a87a] transition-colors z-10 relative"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </motion.button>
                      </div>

                      <h3 className="text-xl font-black text-[#171d1a] mb-1 group-hover:text-[#00694c] transition-colors truncate">{product.name}</h3>
                      <p className="text-[11px] font-black text-[#bccac1] uppercase tracking-[0.2em] mb-6">KES {product.price.toLocaleString()}</p>

                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-[10px] font-black text-[#6d7a73] uppercase tracking-widest mb-1">Stock Level</div>
                            <div className="flex items-center gap-2">
                              <span className={`text-2xl font-black tracking-tight ${
                                product.stock <= product.reorderLevel ? "text-[#e11d48]" : "text-[#171d1a]"
                              }`}>
                                {product.stock}
                              </span>
                              <span className="text-sm font-medium text-[#bccac1]">units</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-black text-[#bccac1] uppercase tracking-widest mb-1">Updated</div>
                            <div className="text-[12px] font-bold text-[#6d7a73]">{formatDate(product.lastUpdated)}</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-[#f8faf9] rounded-full overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((product.stock / Math.max(product.reorderLevel * 2, 1)) * 100, 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`absolute top-0 left-0 h-full rounded-full ${
                              product.stock <= product.reorderLevel ? "bg-[#e11d48]" : "bg-[#00a87a]"
                            }`}
                          />
                        </div>
                      </div>
                      
                      {/* Hover Action Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-white via-white to-transparent pt-12">
                         <motion.button 
                           onClick={() => setRestockTarget(product)}
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           className="w-full h-12 bg-[#171d1a] hover:bg-black text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-colors flex items-center justify-center gap-2"
                         >
                            <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                            Quick Restock
                         </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* List View */
              <motion.div 
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-[#e4eae4] rounded-[24px] overflow-hidden shadow-sm"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f8faf9] border-b border-[#e4eae4]">
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Product Name</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Category</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Price</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Stock</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Status</th>
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredProducts.map((product) => (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0, backgroundColor: "#ffffff" }}
                            animate={{ opacity: 1, backgroundColor: "#ffffff" }}
                            exit={{ opacity: 0, backgroundColor: "#f9fafb" }}
                            whileHover={{ backgroundColor: "#f5fbf5" }}
                            key={product.id} 
                            className="border-b border-[#e4eae4] last:border-0 group transition-colors"
                          >
                            <td className="p-4">
                              <div className="font-black text-[#171d1a] group-hover:text-[#00694c] transition-colors">{product.name}</div>
                              <div className="text-[10px] font-bold text-[#bccac1] mt-0.5">Updated {formatDate(product.lastUpdated)}</div>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-[#f8faf9] text-[#6d7a73] border border-[#e4eae4]">
                                {product.category}
                              </span>
                            </td>
                            <td className="p-4 font-black text-[#171d1a]">
                              <span className="text-[10px] text-[#bccac1] mr-1">KES</span>
                              {product.price.toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className={`font-black text-lg ${product.stock <= product.reorderLevel ? "text-[#e11d48]" : "text-[#171d1a]"}`}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="p-4">
                              {product.stock <= product.reorderLevel ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48] animate-pulse"></span>
                                  Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
                                  Healthy
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <motion.button 
                                  onClick={() => openEditModal(product)}
                                  whileHover={{ scale: 1.1, backgroundColor: "#f8faf9" }}
                                  whileTap={{ scale: 0.9 }}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#bccac1] hover:text-[#00a87a] transition-colors"
                                  title="Edit Product"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </motion.button>
                                <motion.button 
                                  onClick={() => setRestockTarget(product)}
                                  whileHover={{ scale: 1.1, backgroundColor: "#fff1f2" }}
                                  whileTap={{ scale: 0.9 }}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#bccac1] hover:text-[#e11d48] transition-colors"
                                  title="Quick Restock"
                                >
                                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-[#171d1a]">{editingProductId ? "Edit Product" : "Add New Product"}</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-[#bccac1] hover:text-[#e11d48] transition-colors p-1">
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Product Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20 outline-none transition-all" placeholder="e.g. Unga wa Dola" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Category</label>
                    <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20 outline-none transition-all" placeholder="e.g. Groceries" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Initial Stock</label>
                    <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})} className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20 outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Selling Price (KES)</label>
                    <input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({...formData, sellingPrice: Number(e.target.value)})} className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Buying Price / Cost (KES)</label>
                    <input type="number" value={formData.buyingPrice} onChange={(e) => setFormData({...formData, buyingPrice: Number(e.target.value)})} className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20 outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Reorder Level Alert Threshold</label>
                    <input type="number" value={formData.reorderLevel} onChange={(e) => setFormData({...formData, reorderLevel: Number(e.target.value)})} className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Supplier</label>
                    <select 
                      value={formData.supplierId} 
                      onChange={(e) => setFormData({...formData, supplierId: e.target.value})} 
                      className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] outline-none text-[#171d1a] appearance-none"
                    >
                      <option value="">No Supplier</option>
                      {suppliers.map(s => (
                        <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <motion.button 
                onClick={handleAddProduct}
                disabled={isPending || !formData.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-8 bg-[#00694c] hover:bg-[#00553e] disabled:opacity-50 text-white h-14 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00694c]/20"
              >
                {isPending ? <span className="material-symbols-outlined animate-spin">refresh</span> : "Save Product"}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Restock Modal */}
      <AnimatePresence>
        {restockTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => { setRestockTarget(null); setRestockAmount(0); }}
              className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-[#f5fbf5] text-[#00694c] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">add_shopping_cart</span>
              </div>
              <h2 className="text-2xl font-black text-[#171d1a] mb-1">Quick Restock</h2>
              <p className="text-sm font-medium text-[#6d7a73] mb-6">How many units of <strong className="text-[#171d1a]">{restockTarget.name}</strong> are you adding?</p>

              <div className="flex items-center justify-center gap-4 mb-8">
                <button 
                  onClick={() => setRestockAmount(Math.max(0, restockAmount - 10))}
                  className="w-12 h-12 rounded-2xl bg-[#f8faf9] border border-[#e4eae4] text-[#171d1a] font-black text-xl hover:border-[#bccac1] transition-colors"
                >-10</button>
                <input 
                  type="number" 
                  value={restockAmount} 
                  onChange={(e) => setRestockAmount(Number(e.target.value))} 
                  className="w-24 h-16 text-center bg-white border-2 border-[#00694c] rounded-2xl text-3xl font-black text-[#171d1a] outline-none" 
                />
                <button 
                  onClick={() => setRestockAmount(restockAmount + 10)}
                  className="w-12 h-12 rounded-2xl bg-[#f8faf9] border border-[#e4eae4] text-[#171d1a] font-black text-xl hover:border-[#bccac1] transition-colors"
                >+10</button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setRestockTarget(null); setRestockAmount(0); }}
                  className="flex-1 h-14 bg-[#f8faf9] hover:bg-[#e4eae4] text-[#171d1a] rounded-2xl font-black text-sm transition-colors"
                >Cancel</button>
                <motion.button 
                  onClick={handleRestock}
                  disabled={isPending || restockAmount <= 0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 h-14 bg-[#171d1a] disabled:opacity-50 text-white rounded-2xl font-black text-sm transition-colors flex items-center justify-center shadow-lg"
                >
                  {isPending ? <span className="material-symbols-outlined animate-spin">refresh</span> : "Confirm"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
