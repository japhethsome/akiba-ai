"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addSupplier } from "@/lib/actions/suppliers";

interface Supplier {
  supplier_id: string;
  name: string;
  contact: string;
  location: string | null;
  lead_time_days: number;
  _count: { products: number };
}

export function SuppliersClientUI({ initialSuppliers, userRole }: { initialSuppliers: Supplier[], userRole: string }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", contact: "", location: "", leadTimeDays: 1 });
  const [isPending, startTransition] = useTransition();

  const handleAddSupplier = () => {
    if (!formData.name || !formData.contact) return;
    
    startTransition(async () => {
      await addSupplier(formData);
      setIsAddModalOpen(false);
      setFormData({ name: "", contact: "", location: "", leadTimeDays: 1 });
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#171d1a]">Suppliers</h1>
          <p className="text-[#6d7a73] font-medium mt-1">Manage your vendors and restock channels.</p>
        </div>
        
        {userRole === "owner" && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#171d1a] text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all w-full md:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Add Supplier
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {initialSuppliers.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <span className="material-symbols-outlined text-6xl text-[#bccac1] mb-4">local_shipping</span>
              <h3 className="text-xl font-bold text-[#171d1a]">No suppliers added</h3>
              <p className="text-[#6d7a73]">Add your first supplier to start tracking sourcing channels.</p>
            </div>
          ) : (
            initialSuppliers.map((supplier) => (
              <motion.div 
                key={supplier.supplier_id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-[24px] border border-[#e4eae4] hover:shadow-xl transition-all flex flex-col group"
              >
                <div className="w-12 h-12 bg-[#f5fbf5] text-[#00694c] rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined">local_shipping</span>
                </div>
                <h3 className="text-xl font-black text-[#171d1a]">{supplier.name}</h3>
                <div className="text-[11px] font-bold text-[#00694c] bg-[#f0fdf4] px-2 py-1 rounded-md inline-block mt-2 self-start">
                  {supplier._count.products} Linked Products
                </div>
                
                <div className="mt-6 space-y-3 flex-1">
                  <div className="flex items-center gap-3 text-sm font-medium text-[#6d7a73]">
                    <span className="material-symbols-outlined text-[16px] text-[#bccac1]">call</span>
                    {supplier.contact}
                  </div>
                  {supplier.location && (
                    <div className="flex items-center gap-3 text-sm font-medium text-[#6d7a73]">
                      <span className="material-symbols-outlined text-[16px] text-[#bccac1]">location_on</span>
                      {supplier.location}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm font-medium text-[#6d7a73]">
                    <span className="material-symbols-outlined text-[16px] text-[#bccac1]">schedule</span>
                    {supplier.lead_time_days} Days Lead Time
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add Supplier Modal */}
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
                <h2 className="text-2xl font-black text-[#171d1a]">Add Supplier</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-[#bccac1] hover:text-[#e11d48] transition-colors p-1">
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Company Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#171d1a] outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Contact Info (Phone/Email)</label>
                  <input type="text" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#171d1a] outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Location (Optional)</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#171d1a] outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Lead Time (Days)</label>
                  <input type="number" value={formData.leadTimeDays} onChange={(e) => setFormData({...formData, leadTimeDays: Number(e.target.value)})} className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#171d1a] outline-none" />
                </div>
              </div>

              <motion.button 
                onClick={handleAddSupplier}
                disabled={isPending || !formData.name || !formData.contact}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-8 bg-[#171d1a] hover:bg-black disabled:opacity-50 text-white h-14 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
              >
                {isPending ? <span className="material-symbols-outlined animate-spin">refresh</span> : "Save Supplier"}
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
