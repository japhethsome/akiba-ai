"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  reorderLevel: number;
  lastUpdated: string;
}

const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Unga wa Dola (2kg)", category: "Groceries", price: 185, stock: 42, reorderLevel: 20, lastUpdated: "2h ago" },
  { id: "2", name: "Sugar (1kg)", category: "Groceries", price: 150, stock: 12, reorderLevel: 15, lastUpdated: "1h ago" },
  { id: "3", name: "Cooking Oil (3L)", category: "Groceries", price: 890, stock: 5, reorderLevel: 10, lastUpdated: "5m ago" },
  { id: "4", name: "Blue Band (450g)", category: "Groceries", price: 320, stock: 25, reorderLevel: 10, lastUpdated: "Yesterday" },
  { id: "5", name: "Broadways Bread", category: "Bakery", price: 65, stock: 8, reorderLevel: 12, lastUpdated: "10m ago" },
  { id: "6", name: "Coca-Cola (500ml)", category: "Drinks", price: 70, stock: 120, reorderLevel: 48, lastUpdated: "4h ago" },
];

export function InventoryClient({ userRole }: { userRole: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Groceries", "Bakery", "Drinks", "Household"];

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#171d1a]">Inventory</h1>
          <p className="text-[#6d7a73] font-medium mt-1">Manage your stock levels and product catalog.</p>
        </div>
        
        {userRole === "owner" && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 bg-[#00694c] text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#00694c]/20 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Add New Product
          </motion.button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">search</span>
          <input 
            type="text" 
            placeholder="Search by product name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white border border-[#e4eae4] rounded-2xl text-sm font-medium outline-none focus:border-[#00694c] focus:ring-4 focus:ring-[#00694c]/5 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                selectedCategory === cat 
                  ? "bg-[#171d1a] text-white border-[#171d1a] shadow-lg" 
                  : "bg-white text-[#6d7a73] border-[#e4eae4] hover:border-[#bccac1]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* AI Low Stock Alert (Proactive) */}
      <AnimatePresence>
        {filteredProducts.some(p => p.stock <= p.reorderLevel) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#fff1f2] border border-[#fecdd3] p-6 rounded-[32px] flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#fb7185] rounded-2xl flex items-center justify-center text-white shadow-lg">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-[#9f1239]">Action Required</h3>
                <p className="text-[#be123c] text-sm font-medium">DeepSeek AI detected {filteredProducts.filter(p => p.stock <= p.reorderLevel).length} items below reorder levels.</p>
              </div>
            </div>
            <button className="bg-[#9f1239] text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-[#881337] transition-colors">
              Generate Restock List
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <motion.div 
            layout
            key={product.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-[32px] border border-[#e4eae4] hover:border-[#00a87a] hover:shadow-2xl hover:shadow-[#00a87a]/10 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                product.category === "Groceries" ? "bg-[#f0fdf4] text-[#166534]" : "bg-[#f5f3ff] text-[#5b21b6]"
              }`}>
                {product.category}
              </div>
              <div className="text-[#bccac1] group-hover:text-[#00a87a] transition-colors">
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </div>
            </div>

            <h3 className="text-xl font-black text-[#171d1a] mb-1 group-hover:text-[#00694c] transition-colors">{product.name}</h3>
            <p className="text-[11px] font-black text-[#bccac1] uppercase tracking-[0.2em] mb-6">KES {product.price}</p>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] font-black text-[#6d7a73] uppercase tracking-widest mb-1">Stock Level</div>
                  <div className={`text-2xl font-black tracking-tight ${
                    product.stock <= product.reorderLevel ? "text-[#e11d48]" : "text-[#171d1a]"
                  }`}>
                    {product.stock} units
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-[#bccac1] uppercase tracking-widest mb-1">Updated</div>
                  <div className="text-[12px] font-bold text-[#6d7a73]">{product.lastUpdated}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-[#f8faf9] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((product.stock / (product.reorderLevel * 2)) * 100, 100)}%` }}
                  className={`h-full rounded-full ${
                    product.stock <= product.reorderLevel ? "bg-[#e11d48]" : "bg-[#00a87a]"
                  }`}
                />
              </div>
            </div>
            
            {/* Hover Action Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-white via-white to-transparent pt-12">
               <button className="w-full h-12 bg-[#171d1a] text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl">
                  Quick Restock
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
