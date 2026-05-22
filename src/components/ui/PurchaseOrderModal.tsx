"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cleanWhatsAppNumber } from "@/lib/phone";

export interface POProduct {
  id: string;
  name: string;
  category: string;
  stock: number;
  reorderLevel: number;
  buyingPrice: number;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierWhatsapp?: string | null;
  supplierEmail?: string | null;
  supplierContact?: string | null;
  supplierLocation?: string | null;
  supplierLeadTime?: number | null;
  supplierPaymentTerms?: string | null;
  supplierCompanyName?: string | null;
}

interface SupplierGroup {
  supplierId: string;
  supplierName: string;
  companyName?: string | null;
  whatsappNumber?: string | null;
  contact?: string | null;
  email?: string | null;
  location?: string | null;
  leadTimeDays?: number | null;
  paymentTerms?: string | null;
  products: POProduct[];
}

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  lowStockProducts: POProduct[];
  storeName: string;
  initialSupplierId?: string | null;
}

function generatePONumber(supplierName: string): string {
  const prefix = supplierName.replace(/\s+/g, "").toUpperCase().slice(0, 3);
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 900 + 100);
  return `PO-${prefix}-${dateStr}-${random}`;
}

function getRestockQty(product: POProduct): number {
  return Math.max(product.reorderLevel * 2 - product.stock, product.reorderLevel);
}

function getUrgency(product: POProduct): "CRITICAL" | "HIGH" | "MEDIUM" {
  if (product.stock === 0) return "CRITICAL";
  if (product.stock <= Math.floor(product.reorderLevel * 0.5)) return "HIGH";
  return "MEDIUM";
}

function getUrgencyEmoji(urgency: "CRITICAL" | "HIGH" | "MEDIUM"): string {
  if (urgency === "CRITICAL") return "🔴";
  if (urgency === "HIGH") return "🟡";
  return "🟢";
}

function groupProductsBySupplier(products: POProduct[]): SupplierGroup[] {
  const map = new Map<string, SupplierGroup>();

  for (const product of products) {
    const key = product.supplierId || "__unassigned__";
    if (!map.has(key)) {
      map.set(key, {
        supplierId: key,
        supplierName: product.supplierName || "Unassigned Supplier",
        companyName: product.supplierCompanyName,
        whatsappNumber: product.supplierWhatsapp,
        contact: product.supplierContact,
        email: product.supplierEmail,
        location: product.supplierLocation,
        leadTimeDays: product.supplierLeadTime,
        paymentTerms: product.supplierPaymentTerms,
        products: [],
      });
    }
    map.get(key)!.products.push(product);
  }

  return Array.from(map.values());
}

function buildWhatsAppMessage(
  group: SupplierGroup,
  storeName: string,
  poNumber: string,
  customNote?: string
): string {
  const today = new Date().toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + (group.leadTimeDays || 3));
  const deliveryStr = deliveryDate.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Build item lines with structured layout and no internal telemetry
  const itemLines = group.products
    .map((p, idx) => {
      const qty = getRestockQty(p);
      const lineTotal = qty * p.buyingPrice;
      const sku = p.id.slice(0, 8).toUpperCase();
      return `*${idx + 1}. ${p.name.trim()}*\n` +
             `   • SKU: ${sku}\n` +
             `   • Quantity: *${qty} units*\n` +
             `   • Price: KES ${p.buyingPrice.toLocaleString()}/unit\n` +
             `   • Subtotal: *KES ${lineTotal.toLocaleString()}*`;
    })
    .join("\n\n");

  const grandTotal = group.products.reduce((sum, p) => {
    return sum + getRestockQty(p) * p.buyingPrice;
  }, 0);

  const paymentStr = group.paymentTerms || "To be discussed";
  const separator = "------------------------------------------";

  const supplierName = group.supplierName.trim();
  const companyName = group.companyName ? group.companyName.trim() : "";
  const greeting = companyName
    ? `Hello ${supplierName} (${companyName}),`
    : `Hello ${supplierName},`;

  let message =
    `${greeting}\n\n` +
    `I hope you are well. Please find our restock request from *${storeName}*.\n\n` +
    `${separator}\n` +
    `📋 *PURCHASE ORDER #${poNumber}*\n` +
    `📅 Date: ${today}\n` +
    `${separator}\n\n` +
    `*ITEMS REQUESTED:*\n\n` +
    `${itemLines}\n\n` +
    `${separator}\n` +
    `💰 *TOTAL ESTIMATED VALUE: KES ${grandTotal.toLocaleString()}*\n` +
    `💳 Payment Terms: ${paymentStr}\n` +
    `🚚 Delivery Required By: *${deliveryStr}*\n` +
    `${separator}\n\n`;

  if (customNote && customNote.trim()) {
    message += `📝 *Note from ${storeName}:*\n${customNote.trim()}\n\n`;
  }

  message +=
    `Please confirm:\n` +
    `1. Stock availability for all items above\n` +
    `2. Expected delivery date\n` +
    `3. Any price adjustments from the last order\n\n` +
    `Asante sana! 🙏\n` +
    `*${storeName}* — Powered by Akiba AI`;

  return message;
}

export function PurchaseOrderModal({
  isOpen,
  onClose,
  lowStockProducts,
  storeName,
  initialSupplierId,
}: PurchaseOrderModalProps) {
  const [activeGroupIdx, setActiveGroupIdx] = React.useState(0);
  const [customNote, setCustomNote] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const supplierGroups = groupProductsBySupplier(lowStockProducts);
  const activeGroup = supplierGroups[activeGroupIdx];

  const poNumbers = React.useMemo(
    () => supplierGroups.map((g) => generatePONumber(g.supplierName)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen]
  );

  const poNumber = poNumbers[activeGroupIdx] || "PO-001";

  const grandTotal =
    activeGroup?.products.reduce((sum, p) => {
      return sum + getRestockQty(p) * p.buyingPrice;
    }, 0) || 0;

  const whatsappMessage = activeGroup
    ? buildWhatsAppMessage(activeGroup, storeName, poNumber, customNote)
    : "";

  // Auto-focus active tab when initialSupplierId is provided
  React.useEffect(() => {
    if (isOpen && initialSupplierId) {
      const idx = supplierGroups.findIndex((g) => g.supplierId === initialSupplierId);
      if (idx !== -1) {
        setActiveGroupIdx(idx);
      }
    }
  }, [isOpen, initialSupplierId]);

  const savePurchaseOrderLog = async (channel: "WhatsApp" | "Email" | "SMS") => {
    if (!activeGroup) return;
    setIsSaving(true);
    try {
      let contactVal = "";
      if (channel === "WhatsApp") {
        contactVal = activeGroup.whatsappNumber || activeGroup.contact || "";
      } else if (channel === "Email") {
        contactVal = activeGroup.email || "";
      } else if (channel === "SMS") {
        contactVal = activeGroup.contact || activeGroup.whatsappNumber || "";
      }

      await fetch("/api/ai/po-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poNumber,
          supplierName: activeGroup.supplierName,
          supplierContact: contactVal,
          grandTotal,
          itemCount: activeGroup.products.length,
          itemsSummary: activeGroup.products.map((p) => `${p.name} x${getRestockQty(p)}`).join(", "),
          notes: customNote,
          channel,
        }),
      });
    } catch {
      /* non-blocking */
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!activeGroup) return;
    await savePurchaseOrderLog("WhatsApp");
    const rawNumber = cleanWhatsAppNumber(activeGroup.whatsappNumber || activeGroup.contact || "");
    const url = `https://wa.me/${rawNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank");
  };

  const handleEmail = async () => {
    if (!activeGroup || !activeGroup.email) return;
    await savePurchaseOrderLog("Email");
    const cleanMessageText = whatsappMessage.replace(/\*/g, "");
    const subject = encodeURIComponent(`Purchase Order #${poNumber} - ${storeName}`);
    const body = encodeURIComponent(cleanMessageText);
    const url = `mailto:${activeGroup.email}?subject=${subject}&body=${body}`;
    window.location.href = url;
  };

  const handleSMS = async () => {
    if (!activeGroup) return;
    const phone = activeGroup.contact || activeGroup.whatsappNumber;
    if (!phone) return;
    await savePurchaseOrderLog("SMS");
    const cleanMessageText = whatsappMessage.replace(/\*/g, "");
    const cleanPhone = cleanWhatsAppNumber(phone);
    const url = `sms:${cleanPhone}?body=${encodeURIComponent(cleanMessageText)}`;
    window.location.href = url;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      /* fallback: select text */
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order ${poNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #171d1a; }
            h1 { font-size: 22px; font-weight: 900; }
            h2 { font-size: 14px; font-weight: 700; color: #6d7a73; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6d7a73; border-bottom: 2px solid #e4eae4; padding: 8px 4px; }
            td { padding: 10px 4px; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
            .total { font-weight: 900; font-size: 16px; text-align: right; margin-top: 16px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
            .badge { background: #f0fdf4; color: #00694c; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
            @media print { body { padding: 16px; } }
          </style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (supplierGroups.length === 0) return null;

  const urgencyColors: Record<"CRITICAL" | "HIGH" | "MEDIUM", string> = {
    CRITICAL: "text-[#ba1a1a] bg-[#fff1f2] border-[#fecdd3]",
    HIGH: "text-[#805200] bg-[#fffbeb] border-[#fde68a]",
    MEDIUM: "text-[#166534] bg-[#f0fdf4] border-[#bbf7d0]",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 bg-white rounded-[28px] w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-br from-[#171d1a] to-[#252f2a] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00694c]/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px] text-[#00a87a]">receipt_long</span>
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Purchase Order</h2>
                  <p className="text-[10px] text-[#bccac1] font-bold uppercase tracking-widest">
                    {supplierGroups.length} Supplier{supplierGroups.length > 1 ? "s" : ""} · {lowStockProducts.length} Low-Stock Item{lowStockProducts.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-[#bccac1] hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Supplier tabs (if multiple) */}
            {supplierGroups.length > 1 && (
              <div className="flex gap-2 overflow-x-auto px-5 py-3 border-b border-[#e4eae4] shrink-0" style={{ scrollbarWidth: "none" }}>
                {supplierGroups.map((g, i) => (
                  <button
                    key={g.supplierId}
                    onClick={() => setActiveGroupIdx(i)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                      activeGroupIdx === i
                        ? "bg-[#171d1a] text-white"
                        : "bg-[#f8faf9] text-[#6d7a73] hover:bg-[#e4eae4]"
                    }`}
                  >
                    {g.supplierName} ({g.products.length})
                  </button>
                ))}
              </div>
            )}

            {/* PO Content (scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth: "thin" }}>
              {/* Printable content */}
              <div ref={printRef}>
                {/* PO Header Info */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00694c] to-[#008560] flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[14px]">account_balance_wallet</span>
                      </div>
                      <span className="font-black text-[#171d1a] text-base">{storeName}</span>
                    </div>
                    <p className="text-[10px] text-[#6d7a73] font-bold uppercase tracking-widest">Powered by Akiba AI</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#6d7a73] mb-1">Purchase Order</div>
                    <div className="font-black text-lg text-[#171d1a]">#{poNumber}</div>
                    <div className="text-[10px] text-[#6d7a73] font-bold mt-0.5">
                      {new Date().toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                </div>

                {/* Supplier Info Block */}
                {activeGroup && (
                  <div className="bg-[#f8faf9] border border-[#e4eae4] rounded-2xl p-4 mb-5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#6d7a73] mb-3">Supplier Details</div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px] text-[#00694c]">local_shipping</span>
                        <span className="text-sm font-black text-[#171d1a]">{activeGroup.supplierName}</span>
                        {activeGroup.companyName && (
                          <span className="text-[10px] font-bold text-[#6d7a73]">— {activeGroup.companyName}</span>
                        )}
                      </div>
                      {activeGroup.contact && (
                        <div className="flex items-center gap-2 text-xs font-medium text-[#6d7a73]">
                          <span className="material-symbols-outlined text-[14px] text-[#bccac1]">call</span>
                          {activeGroup.contact}
                        </div>
                      )}
                      {activeGroup.whatsappNumber && (
                        <div className="flex items-center gap-2 text-xs font-medium text-[#6d7a73]">
                          <span className="material-symbols-outlined text-[14px] text-[#25d366]">chat</span>
                          {activeGroup.whatsappNumber}
                        </div>
                      )}
                      {activeGroup.email && (
                        <div className="flex items-center gap-2 text-xs font-medium text-[#6d7a73]">
                          <span className="material-symbols-outlined text-[14px] text-[#bccac1]">mail</span>
                          {activeGroup.email}
                        </div>
                      )}
                      {activeGroup.location && (
                        <div className="flex items-center gap-2 text-xs font-medium text-[#6d7a73]">
                          <span className="material-symbols-outlined text-[14px] text-[#bccac1]">location_on</span>
                          {activeGroup.location}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 mt-1">
                        {activeGroup.leadTimeDays != null && (
                          <span className="bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] text-[10px] font-black px-2 py-0.5 rounded-full">
                            {activeGroup.leadTimeDays} Day Lead Time
                          </span>
                        )}
                        {activeGroup.paymentTerms && (
                          <span className="bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af] text-[10px] font-black px-2 py-0.5 rounded-full">
                            {activeGroup.paymentTerms}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Table with Urgency */}
                <div className="border border-[#e4eae4] rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#f8faf9] border-b border-[#e4eae4]">
                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-[#6d7a73]">Product</th>
                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-[#6d7a73] text-center">Urgency</th>
                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-[#6d7a73] text-center">Stock</th>
                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-[#6d7a73] text-center">Order Qty</th>
                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-[#6d7a73] text-right">Unit Price</th>
                        <th className="p-3 text-[9px] font-black uppercase tracking-widest text-[#6d7a73] text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeGroup?.products.map((product, i) => {
                        const qty = getRestockQty(product);
                        const lineTotal = qty * product.buyingPrice;
                        const urgency = getUrgency(product);
                        const isLast = i === (activeGroup.products.length - 1);
                        return (
                          <tr key={product.id} className={`${!isLast ? "border-b border-[#f0f4f0]" : ""} hover:bg-[#f8faf9] transition-colors`}>
                            <td className="p-3">
                              <div className="font-black text-[#171d1a] text-xs">{product.name}</div>
                              <div className="text-[9px] font-bold text-[#bccac1] uppercase mt-0.5">{product.category}</div>
                              <div className="text-[9px] font-mono text-[#bccac1] mt-0.5">SKU: {product.id.slice(0, 8).toUpperCase()}</div>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${urgencyColors[urgency]}`}>
                                {urgency}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-[#e11d48] font-black text-sm">{product.stock}</span>
                              <div className="text-[8px] text-[#6d7a73] font-bold">/ {product.reorderLevel} min</div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="bg-[#f0fdf4] text-[#00694c] font-black text-sm px-2 py-0.5 rounded-lg">{qty}</span>
                            </td>
                            <td className="p-3 text-right font-bold text-xs text-[#171d1a]">
                              KES {product.buyingPrice.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-black text-sm text-[#171d1a]">
                              KES {lineTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Grand Total */}
                  <div className="p-4 bg-[#f8faf9] border-t border-[#e4eae4] flex justify-between items-center">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-[#6d7a73]">Grand Total</div>
                      <div className="text-[10px] text-[#6d7a73] font-medium">
                        {activeGroup?.products.length} item{(activeGroup?.products.length || 0) > 1 ? "s" : ""} · Expected delivery in {activeGroup?.leadTimeDays || "?"} days
                      </div>
                    </div>
                    <div className="text-2xl font-black text-[#171d1a]">
                      KES {grandTotal.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Note */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">
                  Add a custom note to supplier (optional)
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Please prioritize the delivery of sugar — we are completely out of stock. Also confirm if you have any promotions this month."
                  className="w-full px-4 py-3 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-xs font-bold focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]/10 outline-none transition-all resize-none text-[#171d1a] placeholder:text-[#bccac1]"
                />
              </div>

              {/* WhatsApp Message Preview */}
              <div className="border border-[#e4eae4] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#f8faf9] hover:bg-[#e4eae4] text-[#171d1a] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#25d366]">preview</span>
                    <span className="text-[11px] font-black uppercase tracking-wider">Preview WhatsApp Message</span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-[#6d7a73]">
                    {showPreview ? "expand_less" : "expand_more"}
                  </span>
                </button>
                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <pre className="p-4 text-[10px] font-mono text-[#171d1a] bg-white whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto border-t border-[#e4eae4]">
                        {whatsappMessage}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-[#e4eae4] flex flex-col gap-3 shrink-0 bg-white">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePrint}
                    className="h-12 flex items-center justify-center gap-1.5 bg-[#f8faf9] hover:bg-[#e4eae4] border border-[#e4eae4] text-[#171d1a] rounded-xl font-black text-[10px] uppercase tracking-wider transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    Print PDF
                  </button>

                  <button
                    onClick={handleCopy}
                    className={`h-12 flex items-center justify-center gap-1.5 border rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                      copySuccess
                        ? "bg-[#f0fdf4] border-[#00694c] text-[#00694c]"
                        : "bg-[#f8faf9] hover:bg-[#e4eae4] border-[#e4eae4] text-[#171d1a]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{copySuccess ? "check_circle" : "content_copy"}</span>
                    {copySuccess ? "Copied!" : "Copy Text"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* WhatsApp Button */}
                  {(activeGroup?.whatsappNumber || activeGroup?.contact) ? (
                    <button
                      onClick={handleWhatsApp}
                      disabled={isSaving}
                      className="h-12 flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#1ebe5d] disabled:opacity-70 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#25d366]/20"
                    >
                      <span className="material-symbols-outlined text-[18px]">{isSaving ? "hourglass_empty" : "chat"}</span>
                      {isSaving ? "Logging..." : "WhatsApp PO"}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="h-12 flex items-center justify-center gap-2 bg-[#f8faf9] border border-dashed border-[#bccac1] text-[#bccac1] rounded-xl font-black text-[10px] uppercase tracking-wider cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      WhatsApp (No Phone)
                    </button>
                  )}

                  {/* Email Button */}
                  {activeGroup?.email ? (
                    <button
                      onClick={handleEmail}
                      disabled={isSaving}
                      className="h-12 flex items-center justify-center gap-2 bg-[#00694c] hover:bg-[#00543d] disabled:opacity-70 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#00694c]/20"
                    >
                      <span className="material-symbols-outlined text-[18px]">{isSaving ? "hourglass_empty" : "mail"}</span>
                      {isSaving ? "Logging..." : "Email PO"}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="h-12 flex items-center justify-center gap-2 bg-[#f8faf9] border border-dashed border-[#bccac1] text-[#bccac1] rounded-xl font-black text-[10px] uppercase tracking-wider cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      Email (No Email)
                    </button>
                  )}

                  {/* SMS Button */}
                  {(activeGroup?.contact || activeGroup?.whatsappNumber) ? (
                    <button
                      onClick={handleSMS}
                      disabled={isSaving}
                      className="h-12 flex items-center justify-center gap-2 bg-[#171d1a] hover:bg-[#252f2a] disabled:opacity-70 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#171d1a]/20"
                    >
                      <span className="material-symbols-outlined text-[18px]">{isSaving ? "hourglass_empty" : "sms"}</span>
                      {isSaving ? "Logging..." : "SMS PO"}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="h-12 flex items-center justify-center gap-2 bg-[#f8faf9] border border-dashed border-[#bccac1] text-[#bccac1] rounded-xl font-black text-[10px] uppercase tracking-wider cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[16px]">sms</span>
                      SMS (No Phone)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
