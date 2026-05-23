"use client";

import React, { useState, useMemo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addProduct, updateProduct, restockProduct } from "@/lib/actions/inventory";
import { hasPermission } from "@/lib/permissions";
import { PurchaseOrderModal, type POProduct } from "@/components/ui/PurchaseOrderModal";
import Link from "next/link";

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
  supplierName?: string | null;
  supplierCompanyName?: string | null;
  supplierContact?: string | null;
  supplierWhatsapp?: string | null;
  supplierEmail?: string | null;
  supplierLocation?: string | null;
  supplierLeadTime?: number | null;
  supplierPaymentTerms?: string | null;
}

export function InventoryClient({
  userRole,
  initialProducts,
  suppliers = [],
  storeName = "My Store",
}: {
  userRole: string;
  initialProducts: Product[];
  suppliers?: any[];
  storeName?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isPending, startTransition] = useTransition();

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedSupplierIdForPO, setSelectedSupplierIdForPO] = useState<string | null>(null);
  const [extraPOProduct, setExtraPOProduct] = useState<POProduct | null>(null);

  // Form States
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Groceries",
    sellingPrice: 0,
    buyingPrice: 0,
    stock: 0,
    reorderLevel: 5,
    vatRate: 16,
    supplierId: "",
  });
  const [restockAmount, setRestockAmount] = useState(0);

  // Dynamically extract unique categories from actual products
  const categories = useMemo(() => {
    const cats = new Set(initialProducts.map((p) => p.category));
    return ["All", ...Array.from(cats)];
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [initialProducts, searchQuery, selectedCategory]);

  const lowStockProducts = useMemo(
    () => initialProducts.filter((p) => p.stock <= p.reorderLevel),
    [initialProducts]
  );

  const lowStockCount = lowStockProducts.length;

  // Map low-stock products to POProduct shape
  const poProducts: POProduct[] = useMemo(
    () =>
      lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        stock: p.stock,
        reorderLevel: p.reorderLevel,
        buyingPrice: p.buyingPrice,
        supplierId: p.supplierId,
        supplierName: p.supplierName,
        supplierWhatsapp: p.supplierWhatsapp,
        supplierEmail: p.supplierEmail,
        supplierContact: p.supplierContact,
        supplierLocation: p.supplierLocation,
        supplierLeadTime: p.supplierLeadTime,
        supplierPaymentTerms: p.supplierPaymentTerms,
        supplierCompanyName: p.supplierCompanyName,
      })),
    [lowStockProducts]
  );

  const poProductsToSend = useMemo(() => {
    if (!extraPOProduct) return poProducts;
    const exists = poProducts.some((p) => p.id === extraPOProduct.id);
    if (exists) return poProducts;
    return [...poProducts, extraPOProduct];
  }, [poProducts, extraPOProduct]);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
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
      setFormData({
        name: "",
        category: "Groceries",
        sellingPrice: 0,
        buyingPrice: 0,
        stock: 0,
        reorderLevel: 5,
        vatRate: 16,
        supplierId: "",
      });
    });
  };

  const handleNumberChange = (field: keyof typeof formData, rawValue: string) => {
    const digits = rawValue.replace(/[^0-9]/g, "");
    const sanitized = digits.replace(/^0+([0-9])/, "$1");
    setFormData((prev) => ({ ...prev, [field]: sanitized ? Number(sanitized) : 0 }));
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

  const handleCreateSupplierOrder = () => {
    if (!restockTarget) return;
    setSelectedSupplierIdForPO(restockTarget.supplierId || null);
    setExtraPOProduct({
      id: restockTarget.id,
      name: restockTarget.name,
      category: restockTarget.category,
      stock: restockTarget.stock,
      reorderLevel: restockTarget.reorderLevel,
      buyingPrice: restockTarget.buyingPrice,
      supplierId: restockTarget.supplierId,
      supplierName: restockTarget.supplierName,
      supplierWhatsapp: restockTarget.supplierWhatsapp,
      supplierEmail: restockTarget.supplierEmail,
      supplierContact: restockTarget.supplierContact,
      supplierLocation: restockTarget.supplierLocation,
      supplierLeadTime: restockTarget.supplierLeadTime,
      supplierPaymentTerms: restockTarget.supplierPaymentTerms,
      supplierCompanyName: restockTarget.supplierCompanyName,
    });
    setRestockTarget(null);
    setIsPOModalOpen(true);
  };

  const handleClosePOModal = () => {
    setIsPOModalOpen(false);
    setSelectedSupplierIdForPO(null);
    setExtraPOProduct(null);
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
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-10 pb-24 md:pb-10 space-y-4 md:space-y-6 relative overflow-hidden">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#171d1a]">Inventory</h1>
          <p className="text-[#6d7a73] font-medium mt-0.5 text-sm hidden sm:block">
            Manage your stock levels and product catalog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Reorder Center Link */}
          <Link
            href="/dashboard/suppliers?tab=reorder"
            className="flex items-center gap-1.5 bg-white hover:bg-[#f8faf9] border border-[#e4eae4] text-[#6d7a73] hover:text-[#171d1a] px-3.5 py-2.5 rounded-xl font-black text-xs transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">local_mall</span>
            <span>Reorder Center</span>
          </Link>

          {/* View Mode Toggle - desktop only */}
          <div className="hidden md:flex bg-white border border-[#e4eae4] p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-[#f5fbf5] text-[#00694c] shadow-sm" : "text-[#bccac1] hover:text-[#6d7a73]"}`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === "list" ? "bg-[#f5fbf5] text-[#00694c] shadow-sm" : "text-[#bccac1] hover:text-[#6d7a73]"}`}
              title="List View"
            >
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
          </div>

          {hasPermission(userRole, "inventory_edit") && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditingProductId(null);
                setFormData({
                  name: "",
                  category: "Groceries",
                  sellingPrice: 0,
                  buyingPrice: 0,
                  stock: 0,
                  reorderLevel: 5,
                  supplierId: "",
                });
                setIsAddModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#00694c] to-[#008560] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl shadow-[#00694c]/20 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
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
            <div className="bg-[#fff1f2] border border-[#fecdd3] p-4 sm:p-5 rounded-[16px] sm:rounded-[20px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#fb7185] to-[#e11d48] rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-[#9f1239]">Action Required</h3>
                  <p className="text-[#be123c] text-xs font-medium">
                    Akiba AI detected <strong className="font-black">{lowStockCount} items</strong> at or below critical reorder levels.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsPOModalOpen(true)}
                  className="bg-[#9f1239] text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-[#881337] transition-colors shadow-lg w-full sm:w-auto text-center flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  Generate Restock Order
                </motion.button>
                <Link
                  href="/dashboard/suppliers?tab=reorder"
                  className="bg-white border border-[#fecdd3] text-[#9f1239] hover:bg-[#fff1f2] px-5 py-2.5 rounded-xl font-black text-xs transition-colors w-full sm:w-auto text-center flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">local_mall</span>
                  Go to Reorder Center
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        {/* Search bar */}
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bccac1] group-focus-within:text-[#00694c] transition-colors text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 bg-white border border-[#e4eae4] rounded-xl text-sm font-medium outline-none focus:border-[#00694c] focus:ring-4 focus:ring-[#00694c]/5 transition-all shadow-sm"
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bccac1] hover:text-[#e11d48] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 h-8 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? "bg-[#171d1a] text-white border-[#171d1a]"
                  : "bg-white text-[#6d7a73] border-[#e4eae4] hover:border-[#bccac1]"
              }`}
            >
              {cat}
            </button>
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
              ) : hasPermission(userRole, "inventory_edit") ? (
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
          ) : viewMode === "grid" ? (
            /* Grid View */
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
            >
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.div
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="bg-white p-3.5 sm:p-5 rounded-[20px] border border-[#e4eae4] hover:border-[#00a87a] hover:shadow-lg transition-all cursor-pointer group relative flex flex-col justify-between w-full gap-3"
                  >
                    {/* Top Row / Details Section */}
                    <div className="flex justify-between items-start w-full gap-2">
                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[8px] sm:text-[10px] font-black uppercase tracking-wider bg-[#f5fbf5] text-[#00694c] border border-[#e4eae4] truncate shrink-0">
                            {product.category}
                          </span>
                          {product.stock <= product.reorderLevel && (
                            <span className="text-[8px] font-black bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3] px-1.5 py-0.5 rounded-full uppercase shrink-0">Low Stock</span>
                          )}
                        </div>
                        <h3 className="text-xs sm:text-base font-black text-[#171d1a] leading-tight group-hover:text-[#00694c] transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] font-bold text-[#6d7a73] sm:text-[#bccac1]">
                          KES {product.price.toLocaleString()}
                        </p>
                        {/* Supplier Badge */}
                        {product.supplierName && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[11px] text-[#bccac1]">local_shipping</span>
                            <span className="text-[9px] font-bold text-[#6d7a73] truncate">{product.supplierName}</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {hasPermission(userRole, "inventory_edit") && (
                        <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(product); }}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[#bccac1] hover:text-[#00a87a] hover:bg-[#f5fbf5] transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Desktop Stock */}
                    <div className="hidden sm:block space-y-2.5">
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[8px] sm:text-[9px] font-black text-[#6d7a73] uppercase tracking-wider mb-0.5">Stock</div>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-lg sm:text-xl font-black ${product.stock <= product.reorderLevel ? "text-[#e11d48]" : "text-[#171d1a]"}`}>
                              {product.stock}
                            </span>
                            <span className="text-[9px] font-medium text-[#bccac1]">units</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-[#f8faf9] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((product.stock / Math.max(product.reorderLevel * 2, 1)) * 100, 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${product.stock <= product.reorderLevel ? "bg-[#e11d48]" : "bg-[#00a87a]"}`}
                        />
                      </div>
                    </div>

                    {/* Mobile Stock & Restock button row */}
                    <div className="flex items-center justify-between gap-3 w-full sm:mt-1 border-t sm:border-t-0 border-[#f2f6f2] pt-2.5 sm:pt-0">
                      {/* Mobile Stock Indicator */}
                      <div className="sm:hidden flex items-center gap-1">
                        <span className="text-[9px] font-black text-[#6d7a73] uppercase">Stock:</span>
                        <span className={`text-xs font-black ${product.stock <= product.reorderLevel ? "text-[#e11d48]" : "text-[#171d1a]"}`}>
                          {product.stock}
                        </span>
                        <span className="text-[9px] font-medium text-[#bccac1]">units</span>
                      </div>

                      {/* Restock Button */}
                      {hasPermission(userRole, "inventory_edit") && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setRestockTarget(product); }}
                          className="flex-1 sm:w-full h-11 sm:h-10 bg-[#f5fbf5] hover:bg-[#00694c] hover:text-white text-[#00694c] border border-[#d1ebd7] hover:border-[#00694c] rounded-xl font-black text-[9px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                        >
                          <span className="material-symbols-outlined text-[14px]">add_shopping_cart</span>
                          <span>Restock</span>
                        </button>
                      )}
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
                <table className="w-full min-w-[700px] md:min-w-0 text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f8faf9] border-b border-[#e4eae4]">
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Product Name</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Category</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Supplier</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Price</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Stock</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Status</th>
                      {hasPermission(userRole, "inventory_edit") && (
                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73] text-right">Actions</th>
                      )}
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
                          <td className="p-4">
                            {product.supplierName ? (
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[13px] text-[#00694c]">local_shipping</span>
                                <span className="text-xs font-bold text-[#171d1a]">{product.supplierName}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#bccac1] font-medium">—</span>
                            )}
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
                          {hasPermission(userRole, "inventory_edit") && (
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
                          )}
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add / Edit Product Modal */}
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
                <h2 className="text-2xl font-black text-[#171d1a]">
                  {editingProductId ? "Edit Product" : "Add New Product"}
                </h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-[#bccac1] hover:text-[#e11d48] transition-colors p-1">
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20 outline-none transition-all"
                    placeholder="e.g. Unga wa Dola"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20 outline-none transition-all"
                      placeholder="e.g. Groceries"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">
                      {editingProductId ? "Current Stock" : "Initial Stock"}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.stock}
                      onChange={(e) => handleNumberChange("stock", e.target.value)}
                      className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Selling Price (KES)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.sellingPrice}
                      onChange={(e) => handleNumberChange("sellingPrice", e.target.value)}
                      className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Buying Price / Cost (KES)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.buyingPrice}
                      onChange={(e) => handleNumberChange("buyingPrice", e.target.value)}
                      className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Reorder Level Alert Threshold</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.reorderLevel}
                    onChange={(e) => handleNumberChange("reorderLevel", e.target.value)}
                    className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Supplier</label>
                  <div className="relative">
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full h-12 pl-4 pr-10 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold focus:border-[#00694c] outline-none text-[#171d1a] appearance-none"
                    >
                      <option value="">No Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#bccac1] pointer-events-none text-[20px]">
                      keyboard_arrow_down
                    </span>
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
               className="bg-white rounded-[32px] p-8 w-full max-w-md relative z-10 shadow-2xl"
             >
               <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-[#f5fbf5] text-[#00694c] rounded-full flex items-center justify-center mx-auto mb-4">
                   <span className="material-symbols-outlined text-[32px]">add_shopping_cart</span>
                 </div>
                 <h2 className="text-2xl font-black text-[#171d1a] mb-1">Restock Options</h2>
                 <p className="text-xs font-semibold text-[#6d7a73]">
                   Choose a restocking route for <strong className="text-[#171d1a]">{restockTarget.name}</strong>.
                 </p>
               </div>

               {/* Supplier Routing Card */}
               {restockTarget.supplierId ? (
                 <div className="bg-[#f5fbf5] border border-[#d1ebd7] rounded-2xl p-4 mb-6 text-left flex items-center justify-between gap-3 shadow-sm">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[#e6eee6] rounded-xl flex items-center justify-center text-[#00694c] shrink-0">
                       <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                     </div>
                     <div>
                       <div className="text-xs font-black text-[#171d1a] leading-snug">{restockTarget.supplierName}</div>
                       <div className="text-[10px] font-bold text-[#6d7a73]">
                         {restockTarget.supplierCompanyName || "Linked Supplier"}
                       </div>
                     </div>
                   </div>
                   <button
                     onClick={handleCreateSupplierOrder}
                     className="bg-[#00694c] hover:bg-[#00553e] text-white px-3.5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                   >
                     <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                     Order PO
                   </button>
                 </div>
               ) : (
                 <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4 mb-6 text-left flex items-start gap-2.5 shadow-sm">
                   <span className="material-symbols-outlined text-[#b27b16] text-[20px] shrink-0">warning</span>
                   <div>
                     <div className="text-xs font-black text-[#805200]">No Supplier Linked</div>
                     <div className="text-[10px] font-semibold text-[#b27b16] mt-0.5">
                       Assign a supplier to enable automated restock orders via WhatsApp, SMS, or Email.
                     </div>
                     <button
                       onClick={() => {
                         const target = restockTarget;
                         setRestockTarget(null);
                         openEditModal(target);
                       }}
                       className="text-[10px] font-black text-[#805200] hover:text-[#5c3a00] underline mt-1.5 inline-flex items-center gap-0.5"
                     >
                       Link Supplier Now →
                     </button>
                   </div>
                 </div>
               )}

               {/* Manual Adjustments Option */}
               <div className="border-t border-[#f2f6f2] pt-5">
                 <div className="text-[10px] font-black uppercase tracking-widest text-[#6d7a73] mb-3 text-left">
                   Manual Stock Increment (Physical Arrival)
                 </div>
                 
                 <div className="flex items-center justify-center gap-4 mb-6">
                   <button
                     onClick={() => setRestockAmount(Math.max(0, restockAmount - 10))}
                     className="w-12 h-12 rounded-2xl bg-[#f8faf9] border border-[#e4eae4] text-[#171d1a] font-black text-xl hover:border-[#bccac1] transition-colors"
                   >
                     -10
                   </button>
                   <input
                     type="number"
                     value={restockAmount}
                     onChange={(e) => setRestockAmount(Number(e.target.value))}
                     className="w-24 h-14 text-center bg-white border-2 border-[#00694c] rounded-2xl text-2xl font-black text-[#171d1a] outline-none"
                   />
                   <button
                     onClick={() => setRestockAmount(restockAmount + 10)}
                     className="w-12 h-12 rounded-2xl bg-[#f8faf9] border border-[#e4eae4] text-[#171d1a] font-black text-xl hover:border-[#bccac1] transition-colors"
                   >
                     +10
                   </button>
                 </div>

                 <div className="flex gap-3">
                   <button
                     onClick={() => { setRestockTarget(null); setRestockAmount(0); }}
                     className="flex-1 h-14 bg-[#f8faf9] hover:bg-[#e4eae4] text-[#171d1a] rounded-2xl font-black text-sm transition-colors"
                   >
                     Cancel
                   </button>
                   <motion.button
                     onClick={handleRestock}
                     disabled={isPending || restockAmount <= 0}
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     className="flex-1 h-14 bg-[#171d1a] disabled:opacity-50 text-white rounded-2xl font-black text-sm transition-colors flex items-center justify-center shadow-lg"
                   >
                     {isPending ? <span className="material-symbols-outlined animate-spin">refresh</span> : "Confirm Count"}
                   </motion.button>
                 </div>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
 
       {/* Purchase Order Modal */}
       <PurchaseOrderModal
         isOpen={isPOModalOpen}
         onClose={handleClosePOModal}
         lowStockProducts={poProductsToSend}
         storeName={storeName}
         initialSupplierId={selectedSupplierIdForPO}
       />
     </div>
  );
}
