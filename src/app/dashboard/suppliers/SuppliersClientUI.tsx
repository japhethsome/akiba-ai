"use client";

import React, { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addSupplier, updateSupplier, deleteSupplier } from "@/lib/actions/suppliers";
import { PurchaseOrderModal, type POProduct } from "@/components/ui/PurchaseOrderModal";

interface SupplierProduct {
  product_id: string;
  name: string;
  stock_quantity: number;
  reorder_level: number;
  buying_price: number;
  selling_price: number;
  category: string;
}

interface Supplier {
  supplier_id: string;
  name: string;
  company_name: string | null;
  contact: string;
  whatsapp_number: string | null;
  email: string | null;
  location: string | null;
  lead_time_days: number;
  payment_terms: string | null;
  notes: string | null;
  products: SupplierProduct[];
  _count: { products: number };
}

const EMPTY_FORM = {
  name: "",
  companyName: "",
  contact: "",
  whatsappNumber: "",
  email: "",
  location: "",
  leadTimeDays: 3,
  paymentTerms: "",
  notes: "",
};

type FormData = typeof EMPTY_FORM;

export function SuppliersClientUI({
  initialSuppliers,
  userRole,
  storeName,
}: {
  initialSuppliers: Supplier[];
  userRole: string;
  storeName: string;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [poTarget, setPoTarget] = useState<Supplier | null>(null);
  const [globalPOOpen, setGlobalPOOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const isOwner = userRole === "owner";

  const openAddModal = () => {
    setEditingSupplierId(null);
    setFormData(EMPTY_FORM);
    setErrorMsg("");
    setIsFormOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplierId(supplier.supplier_id);
    setFormData({
      name: supplier.name,
      companyName: supplier.company_name || "",
      contact: supplier.contact,
      whatsappNumber: supplier.whatsapp_number || "",
      email: supplier.email || "",
      location: supplier.location || "",
      leadTimeDays: supplier.lead_time_days,
      paymentTerms: supplier.payment_terms || "",
      notes: supplier.notes || "",
    });
    setErrorMsg("");
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.contact) return;
    setErrorMsg("");
    startTransition(async () => {
      const result = editingSupplierId
        ? await updateSupplier(editingSupplierId, formData)
        : await addSupplier(formData);
      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        setIsFormOpen(false);
        setEditingSupplierId(null);
        setFormData(EMPTY_FORM);
      }
    });
  };

  const handleDelete = (supplierId: string) => {
    setErrorMsg("");
    startTransition(async () => {
      const result = await deleteSupplier(supplierId);
      if (result?.error) {
        setErrorMsg(result.error);
        setDeleteConfirmId(null);
      } else {
        setDeleteConfirmId(null);
      }
    });
  };

  // Build POProduct list for a specific supplier
  const buildPOProducts = (supplier: Supplier): POProduct[] => {
    return supplier.products
      .filter((p) => p.stock_quantity <= p.reorder_level)
      .map((p) => ({
        id: p.product_id,
        name: p.name,
        category: p.category,
        stock: p.stock_quantity,
        reorderLevel: p.reorder_level,
        buyingPrice: Number(p.buying_price),
        supplierId: supplier.supplier_id,
        supplierName: supplier.name,
        supplierCompanyName: supplier.company_name,
        supplierContact: supplier.contact,
        supplierWhatsapp: supplier.whatsapp_number,
        supplierEmail: supplier.email,
        supplierLocation: supplier.location,
        supplierLeadTime: supplier.lead_time_days,
        supplierPaymentTerms: supplier.payment_terms,
      }));
  };

  // Build POProduct list for all suppliers
  const allLowStockPOProducts: POProduct[] = initialSuppliers.flatMap(buildPOProducts);

  const totalProducts = initialSuppliers.reduce((s, sup) => s + sup._count.products, 0);
  const totalLowStock = initialSuppliers.reduce(
    (s, sup) => s + sup.products.filter((p) => p.stock_quantity <= p.reorder_level).length,
    0
  );

  const field = (label: string, key: keyof FormData, type = "text", placeholder = "") => (
    <div>
      <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">{label}</label>
      <input
        type={type}
        value={formData[key] as string}
        onChange={(e) =>
          setFormData({ ...formData, [key]: type === "number" ? Number(e.target.value) : e.target.value })
        }
        className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/10 outline-none transition-all"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 max-w-7xl mx-auto pb-24 md:pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#171d1a]">Suppliers</h1>
          <p className="text-[#6d7a73] font-medium mt-1 text-sm">Manage your vendors, restocking, and purchase orders.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {totalLowStock > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGlobalPOOpen(true)}
              className="flex items-center gap-2 bg-[#fff1f2] border border-[#fecdd3] text-[#e11d48] px-5 py-3 rounded-2xl font-black text-sm hover:bg-[#ffe4e6] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              Generate Restock PO ({totalLowStock})
            </motion.button>
          )}
          {isOwner && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAddModal}
              className="flex items-center gap-2 bg-[#171d1a] text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add Supplier
            </motion.button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Suppliers", value: initialSuppliers.length, icon: "local_shipping", color: "#00694c", bg: "#f0fdf4" },
          { label: "Linked Products", value: totalProducts, icon: "inventory_2", color: "#171d1a", bg: "#f8faf9" },
          { label: "Low Stock Alerts", value: totalLowStock, icon: "warning", color: "#e11d48", bg: "#fff1f2" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-[#e4eae4] p-4 shadow-sm flex flex-col gap-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1" style={{ background: stat.bg }}>
              <span className="material-symbols-outlined text-[16px]" style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <div className="text-2xl font-black text-[#171d1a]">{stat.value}</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-[#6d7a73]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="bg-[#fff1f2] border border-[#fecdd3] text-[#e11d48] text-sm font-bold rounded-2xl px-5 py-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {errorMsg}
        </div>
      )}

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {initialSuppliers.length === 0 ? (
            <div className="col-span-full bg-white border border-dashed border-[#bccac1] rounded-[28px] py-20 text-center">
              <span className="material-symbols-outlined text-6xl text-[#bccac1] block mb-4">local_shipping</span>
              <h3 className="text-xl font-bold text-[#171d1a] mb-1">No suppliers yet</h3>
              <p className="text-[#6d7a73] text-sm mb-6">Add your first supplier to start tracking vendors and restock orders.</p>
              {isOwner && (
                <button
                  onClick={openAddModal}
                  className="bg-[#00694c] text-white px-6 py-3 rounded-xl font-black text-sm shadow-lg"
                >
                  Add First Supplier
                </button>
              )}
            </div>
          ) : (
            initialSuppliers.map((supplier) => {
              const lowStockItems = supplier.products.filter((p) => p.stock_quantity <= p.reorder_level);
              const isExpanded = expandedId === supplier.supplier_id;

              return (
                <motion.div
                  key={supplier.supplier_id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-[24px] border border-[#e4eae4] hover:shadow-xl hover:border-[#00a87a]/40 transition-all flex flex-col overflow-hidden"
                >
                  {/* Card Top */}
                  <div className="p-5 flex flex-col gap-3">
                    {/* Name & Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00694c] to-[#008560] flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm">
                          {supplier.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-[#171d1a] leading-tight truncate">{supplier.name}</h3>
                          {supplier.company_name && (
                            <p className="text-[11px] font-bold text-[#6d7a73] truncate">{supplier.company_name}</p>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => openEditModal(supplier)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[#bccac1] hover:text-[#00a87a] hover:bg-[#f5fbf5] transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(supplier.supplier_id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[#bccac1] hover:text-[#e11d48] hover:bg-[#fff1f2] transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Contact Chips */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs font-medium text-[#6d7a73]">
                        <span className="material-symbols-outlined text-[14px] text-[#bccac1]">call</span>
                        <span>{supplier.contact}</span>
                      </div>
                      {supplier.whatsapp_number && (
                        <a
                          href={`https://wa.me/${supplier.whatsapp_number.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs font-bold text-[#25d366] hover:underline"
                        >
                          <span className="material-symbols-outlined text-[14px]">chat</span>
                          <span>{supplier.whatsapp_number}</span>
                        </a>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-xs font-medium text-[#6d7a73]">
                          <span className="material-symbols-outlined text-[14px] text-[#bccac1]">mail</span>
                          <span className="truncate">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.location && (
                        <div className="flex items-center gap-2 text-xs font-medium text-[#6d7a73]">
                          <span className="material-symbols-outlined text-[14px] text-[#bccac1]">location_on</span>
                          <span>{supplier.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Info Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {supplier.lead_time_days}d Lead
                      </span>
                      {supplier.payment_terms && (
                        <span className="bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {supplier.payment_terms}
                        </span>
                      )}
                      <span className="bg-[#f8faf9] border border-[#e4eae4] text-[#6d7a73] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {supplier._count.products} Products
                      </span>
                      {lowStockItems.length > 0 && (
                        <span className="bg-[#fff1f2] border border-[#fecdd3] text-[#e11d48] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          {lowStockItems.length} Low Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="border-t border-[#f0f4f0] p-3 flex gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : supplier.supplier_id)}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-[#f8faf9] hover:bg-[#e4eae4] text-[#6d7a73] hover:text-[#171d1a] rounded-xl font-black text-[9px] uppercase tracking-wider transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                      {isExpanded ? "Hide" : "View"} Products
                    </button>
                    {lowStockItems.length > 0 && (
                      <button
                        onClick={() => setPoTarget(supplier)}
                        className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#e11d48] border border-[#fecdd3] rounded-xl font-black text-[9px] uppercase tracking-wider transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                        Generate PO
                      </button>
                    )}
                    {supplier.whatsapp_number && (
                      <a
                        href={`https://wa.me/${supplier.whatsapp_number.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 flex items-center justify-center bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#25d366] rounded-xl transition-all"
                        title="Open WhatsApp"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                      </a>
                    )}
                  </div>

                  {/* Expandable Product List */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[#e4eae4] overflow-hidden"
                      >
                        <div className="p-4 space-y-2 max-h-[240px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                          <div className="text-[9px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">
                            Linked Products ({supplier.products.length})
                          </div>
                          {supplier.products.length === 0 ? (
                            <p className="text-xs text-[#bccac1] font-medium text-center py-3">No products linked to this supplier.</p>
                          ) : (
                            supplier.products.map((p) => {
                              const isLow = p.stock_quantity <= p.reorder_level;
                              return (
                                <div
                                  key={p.product_id}
                                  className={`flex items-center justify-between rounded-xl p-2.5 ${isLow ? "bg-[#fff8f8]" : "bg-[#f8faf9]"}`}
                                >
                                  <div>
                                    <div className="text-xs font-black text-[#171d1a]">{p.name}</div>
                                    <div className="text-[9px] font-bold text-[#bccac1] uppercase">{p.category}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-sm font-black ${isLow ? "text-[#e11d48]" : "text-[#00694c]"}`}>
                                      {p.stock_quantity}
                                    </div>
                                    <div className="text-[8px] font-bold text-[#bccac1]">/ {p.reorder_level} min</div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Add / Edit Supplier Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-lg relative z-10 shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Modal header */}
              <div className="p-6 pb-4 border-b border-[#e4eae4] flex items-center justify-between shrink-0">
                <h2 className="text-xl font-black text-[#171d1a]">
                  {editingSupplierId ? "Edit Supplier" : "Add New Supplier"}
                </h2>
                <button onClick={() => setIsFormOpen(false)} className="text-[#bccac1] hover:text-[#e11d48] transition-colors p-1">
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              {/* Modal body scrollable */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4" style={{ scrollbarWidth: "thin" }}>
                {/* Section: Identity */}
                <div className="text-[10px] font-black uppercase tracking-widest text-[#6d7a73] mb-1">Contact Person</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field("Supplier / Contact Name *", "name", "text", "e.g. James Kamau")}
                  {field("Company / Business Name", "companyName", "text", "e.g. Kamau Distributors")}
                </div>

                <div className="text-[10px] font-black uppercase tracking-widest text-[#6d7a73] mt-2 mb-1">Contact Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {field("Phone Number *", "contact", "tel", "e.g. 0712 345 678")}
                  {field("WhatsApp Number", "whatsappNumber", "tel", "e.g. 254712345678")}
                  {field("Email Address", "email", "email", "e.g. supplier@mail.com")}
                  {field("Physical Location", "location", "text", "e.g. Gikomba, Nairobi")}
                </div>

                <div className="text-[10px] font-black uppercase tracking-widest text-[#6d7a73] mt-2 mb-1">Supply Terms</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Lead Time (Days)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.leadTimeDays}
                      onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) })}
                      className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/10 outline-none transition-all"
                    />
                  </div>
                  {field("Payment Terms", "paymentTerms", "text", "e.g. COD, Net 30, Bank Transfer")}
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/10 outline-none transition-all resize-none"
                    placeholder="Any special instructions, pricing info, or notes about this supplier..."
                  />
                </div>

                {errorMsg && (
                  <div className="bg-[#fff1f2] border border-[#fecdd3] text-[#e11d48] text-xs font-bold rounded-xl px-4 py-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {errorMsg}
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="p-5 border-t border-[#e4eae4] shrink-0">
                <motion.button
                  onClick={handleSave}
                  disabled={isPending || !formData.name || !formData.contact}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-14 bg-[#171d1a] hover:bg-black disabled:opacity-50 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {isPending ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {editingSupplierId ? "Save Changes" : "Add Supplier"}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[28px] p-7 w-full max-w-sm relative z-10 shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-[#fff1f2] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[28px] text-[#e11d48]">delete_forever</span>
              </div>
              <h3 className="text-lg font-black text-[#171d1a] mb-2">Remove Supplier?</h3>
              <p className="text-sm font-medium text-[#6d7a73] mb-6">
                This supplier will be permanently removed. Any linked products will need to be reassigned.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 h-12 bg-[#f8faf9] text-[#171d1a] rounded-xl font-black text-sm hover:bg-[#e4eae4] transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={isPending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 h-12 bg-[#e11d48] text-white rounded-xl font-black text-sm hover:bg-[#be123c] transition-colors disabled:opacity-50"
                >
                  {isPending ? "Removing..." : "Yes, Remove"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Per-supplier PO Modal */}
      {poTarget && (
        <PurchaseOrderModal
          isOpen={!!poTarget}
          onClose={() => setPoTarget(null)}
          lowStockProducts={buildPOProducts(poTarget)}
          storeName={storeName}
        />
      )}

      {/* Global (all suppliers) PO Modal */}
      <PurchaseOrderModal
        isOpen={globalPOOpen}
        onClose={() => setGlobalPOOpen(false)}
        lowStockProducts={allLowStockPOProducts}
        storeName={storeName}
      />
    </div>
  );
}
