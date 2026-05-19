"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { voidTransaction } from "@/lib/actions/transactions";

interface Transaction {
  transaction_id: string;
  product_name: string;
  product_id: string;
  clerk_name: string;
  quantity: number;
  total_price: number;
  total_profit: number;
  transaction_type: string;
  created_at: string;
}

interface DemandPoint {
  period: string;
  historicalSales: number;
  projectedSales: number;
}

interface ReorderAlert {
  product_id: string;
  name: string;
  stock_quantity: number;
  daily_velocity: number;
  days_remaining: number;
  lead_time_days: number;
  reorder_date: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  supplier_name: string;
  supplier_contact: string;
  suggested_qty: number;
}

interface ClerkTarget {
  user_id: string;
  name: string;
  email: string;
  historical_revenue: number;
  projected_target: number;
  daily_target: number;
}

interface TransactionsClientUIProps {
  initialTransactions: Transaction[];
  stats: {
    todaySales: number;
    todayProfit: number;
    mpesaSales: number;
    cashSales: number;
    todayCount: number;
  };
  // Forecast properties for integration
  forecastData: {
    upcomingEvent: string;
    eventDescription: string;
    seasonalFactor: number;
    reorderAlerts: ReorderAlert[];
    chartDataByProduct: Record<string, { weekly: DemandPoint[]; monthly: DemandPoint[] }>;
    clerkTargets: ClerkTarget[];
    products: { id: string; name: string }[];
  };
}

export function TransactionsClientUI({
  initialTransactions,
  stats,
  forecastData,
}: TransactionsClientUIProps) {
  const [activeTab, setActiveTab] = useState<"ledger" | "forecasts">("ledger");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  
  // Forecast state variables
  const [selectedProductId, setSelectedProductId] = useState(
    forecastData.products[0]?.id || ""
  );
  const [chartView, setChartView] = useState<"weekly" | "monthly">("weekly");
  const [hoveredPoint, setHoveredPoint] = useState<DemandPoint | null>(null);
  
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) =>
    tx.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.clerk_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.transaction_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVoid = async (id: string) => {
    if (!confirm("Are you sure you want to void/refund this transaction? This will restore stock levels.")) return;
    setVoidingId(id);
    setActionError(null);
    
    const result = await voidTransaction(id);
    setVoidingId(null);

    if (result.success) {
      setTransactions((prev) => prev.filter((t) => t.transaction_id !== id));
      setSelectedTx(null);
    } else {
      setActionError(result.error || "Failed to void transaction");
    }
  };

  // Forecast data computations
  const activeProduct = forecastData.products.find(p => p.id === selectedProductId);
  const productChartData = selectedProductId ? forecastData.chartDataByProduct[selectedProductId] : null;
  const activeChartPoints = productChartData ? productChartData[chartView] : [];
  const maxVal = activeChartPoints.length > 0 
    ? Math.max(...activeChartPoints.map(p => Math.max(p.historicalSales, p.projectedSales))) 
    : 100;

  const highRiskItems = forecastData.reorderAlerts.filter(
    alert => alert.days_remaining <= 3 && alert.stock_quantity > 0
  );
  const depletedItems = forecastData.reorderAlerts.filter(alert => alert.stock_quantity === 0);

  const triggerWhatsAppRequest = (alert: ReorderAlert) => {
    const message = `Habari ${alert.supplier_name}. We would like to place an order for ${alert.name}. Recommended Restock Quantity: ${alert.suggested_qty} units. Please confirm lead time of ${alert.lead_time_days} days. Shukran.`;
    const whatsappUrl = `https://wa.me/${alert.supplier_contact.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <span className="text-[11px] font-black text-[#00694c] uppercase tracking-[0.25em] bg-[#f0fdf4] px-4 py-2 rounded-full border border-[#00694c]/10">
            Akiba Ledger &amp; Forecasts
          </span>
          <h1 className="text-4xl lg:text-5xl font-black text-[#171d1a] tracking-tight mt-3">
            Financial Ledger &amp; Analytics
          </h1>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex bg-[#e4eae4]/50 border border-[#e4eae4] p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === "ledger"
                ? "bg-[#171d1a] text-white shadow-lg shadow-black/10"
                : "text-[#6d7a73] hover:text-[#171d1a]"
            }`}
          >
            Sales Ledger
          </button>
          <button
            onClick={() => setActiveTab("forecasts")}
            className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === "forecasts"
                ? "bg-[#171d1a] text-white shadow-lg shadow-black/10"
                : "text-[#6d7a73] hover:text-[#171d1a]"
            }`}
          >
            Predictive Forecasts
          </button>
        </div>
      </div>

      {actionError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {actionError}
        </div>
      )}

      {/* RENDER LEDGER TAB */}
      {activeTab === "ledger" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* STATS PANEL (Span 12) */}
          <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Today's Revenue",
                value: `KES ${stats.todaySales.toLocaleString()}`,
                bg: "bg-white",
                text: "text-[#171d1a]",
                icon: "payments",
                iconColor: "text-[#00694c]",
              },
              {
                label: "Today's Net Profit",
                value: `KES ${stats.todayProfit.toLocaleString()}`,
                bg: "bg-white",
                text: "text-[#00694c]",
                icon: "trending_up",
                iconColor: "text-[#00a87a]",
              },
              {
                label: "M-Pesa Revenue",
                value: `KES ${stats.mpesaSales.toLocaleString()}`,
                bg: "bg-white",
                text: "text-[#584fbc]",
                icon: "qr_code_2",
                iconColor: "text-[#584fbc]",
              },
              {
                label: "Cash Revenue",
                value: `KES ${stats.cashSales.toLocaleString()}`,
                bg: "bg-white",
                text: "text-[#6d7a73]",
                icon: "wallet",
                iconColor: "text-[#bccac1]",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white border border-[#e4eae4] rounded-[28px] p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#6d7a73]">
                    {stat.label}
                  </span>
                  <span className={`material-symbols-outlined ${stat.iconColor} text-[22px] group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </span>
                </div>
                <h3 className={`text-2xl font-black ${stat.text} tracking-tight`}>
                  {stat.value}
                </h3>
              </div>
            ))}
          </div>

          {/* LEDGER GRID (Span 8) */}
          <div className="lg:col-span-8 bg-white border border-[#e4eae4] rounded-[40px] p-8 shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-[#171d1a] tracking-tight">Sales ledger register</h2>
                <p className="text-xs font-bold text-[#6d7a73] uppercase tracking-widest mt-1">
                  Showing the latest 100 store checkout transactions
                </p>
              </div>

              {/* Search input */}
              <div className="flex items-center bg-[#f8faf9] border border-[#e4eae4] rounded-[18px] px-4 h-12 w-full sm:w-64 focus-within:border-[#00a87a] transition-all">
                <span className="material-symbols-outlined text-[#bccac1] text-[20px] mr-2">search</span>
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-xs w-full font-medium text-[#171d1a] placeholder-[#bccac1]"
                />
              </div>
            </div>

            {/* List container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e4eae4] text-[10px] font-black uppercase tracking-wider text-[#6d7a73]">
                    <th className="pb-4 pl-2">Product</th>
                    <th className="pb-4">Operator</th>
                    <th className="pb-4">Quantity</th>
                    <th className="pb-4">Total Price</th>
                    <th className="pb-4">Type</th>
                    <th className="pb-4 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5fbf5] text-xs font-semibold text-[#171d1a]">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[#bccac1] font-bold">
                        No transactions found matching search query.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr
                        key={tx.transaction_id}
                        onClick={() => setSelectedTx(tx)}
                        className="hover:bg-[#f8faf9] cursor-pointer transition-colors"
                      >
                        <td className="py-4 pl-2 font-black">{tx.product_name}</td>
                        <td className="py-4 text-[#6d7a73]">{tx.clerk_name}</td>
                        <td className="py-4 font-bold">{tx.quantity} pcs</td>
                        <td className="py-4 font-black">KES {tx.total_price.toLocaleString()}</td>
                        <td className="py-4">
                          <span
                            className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                              tx.transaction_type.includes("MPESA")
                                ? "bg-[#584fbc]/5 border-[#584fbc]/20 text-[#584fbc]"
                                : "bg-[#00a87a]/5 border-[#00a87a]/20 text-[#00694c]"
                            }`}
                          >
                            {tx.transaction_type.replace("SALE_", "")}
                          </span>
                        </td>
                        <td className="py-4 pr-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVoid(tx.transaction_id);
                            }}
                            disabled={voidingId === tx.transaction_id}
                            className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/50 p-2 rounded-xl transition-all font-black text-[11px] uppercase tracking-wider border border-rose-200/40"
                          >
                            {voidingId === tx.transaction_id ? "..." : "Void"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RECEIPT / DETAILS PANEL (Span 4) */}
          <div className="lg:col-span-4 bg-white border border-[#e4eae4] rounded-[40px] p-8 shadow-sm flex flex-col justify-between min-h-[400px]">
            {selectedTx ? (
              <div className="flex flex-col h-full justify-between gap-6">
                <div>
                  <div className="border-b-2 border-dashed border-[#e4eae4] pb-4 mb-4 text-center">
                    <h3 className="text-lg font-black text-[#171d1a] uppercase tracking-wider">
                      Akiba AI Store
                    </h3>
                    <p className="text-[10px] text-[#6d7a73] font-bold mt-0.5">
                      Receipt Code: {selectedTx.transaction_id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <div className="space-y-4 text-xs font-bold text-[#6d7a73]">
                    <div className="flex justify-between">
                      <span>Transaction Time:</span>
                      <span className="text-[#171d1a]">
                        {new Date(selectedTx.created_at).toLocaleString("en-KE")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Product:</span>
                      <span className="text-[#171d1a] font-black">{selectedTx.product_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operator Clerk:</span>
                      <span className="text-[#171d1a]">{selectedTx.clerk_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity Sold:</span>
                      <span className="text-[#171d1a]">{selectedTx.quantity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="text-[#171d1a] font-black">
                        {selectedTx.transaction_type.replace("SALE_", "")}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[#e4eae4] pt-4 text-sm">
                      <span className="font-black text-[#171d1a]">Total Paid:</span>
                      <span className="font-black text-[#00694c]">
                        KES {selectedTx.total_price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-700">
                      <span>Margin (Est Profit):</span>
                      <span>KES {selectedTx.total_profit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={() => window.print()}
                    className="w-full py-4 border-2 border-[#171d1a] text-[#171d1a] hover:bg-[#171d1a] hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Print Receipt
                  </button>
                  <button
                    onClick={() => handleVoid(selectedTx.transaction_id)}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-rose-900/10"
                  >
                    Void &amp; Return Stock
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full py-16 border-2 border-dashed border-[#e4eae4] rounded-[28px] p-6">
                <span className="material-symbols-outlined text-[48px] text-[#bccac1] mb-4">
                  receipt_long
                </span>
                <h4 className="text-sm font-black text-[#171d1a]">No Receipt Selected</h4>
                <p className="text-xs text-[#6d7a73] font-medium mt-1.5 max-w-[200px]">
                  Click on any ledger transaction row to view details, print receipt, or process voids.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER FORECASTS TAB */}
      {activeTab === "forecasts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SEASONAL DETECTOR BANNER (Span 12) */}
          <div className="lg:col-span-12 bg-gradient-to-r from-[#584fbc]/10 to-[#00a87a]/5 border border-[#584fbc]/20 rounded-[32px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#584fbc]/5 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="flex gap-5 items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-[#584fbc] to-[#3a3385] rounded-2xl flex items-center justify-center shadow-lg shadow-[#584fbc]/20 text-white shrink-0">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-black tracking-widest text-[#584fbc] uppercase bg-[#584fbc]/10 px-2 py-0.5 rounded">
                    SEASONAL EVENT ACTIVE
                  </span>
                  <span className="text-sm font-black text-[#171d1a]">{forecastData.upcomingEvent}</span>
                </div>
                <p className="text-xs font-bold text-[#6d7a73] leading-relaxed mt-1 max-w-2xl">
                  {forecastData.eventDescription} Local demand variables updated automatically by <span className="text-[#00694c] font-black">+{Math.round((forecastData.seasonalFactor - 1) * 100)}%</span>.
                </p>
              </div>
            </div>
            <div className="text-center md:text-right bg-white/70 backdrop-blur border border-white px-5 py-3 rounded-2xl shrink-0">
              <div className="text-2xl font-black text-[#584fbc] tracking-tighter">x{forecastData.seasonalFactor.toFixed(2)}</div>
              <div className="text-[9px] font-black text-[#6d7a73] uppercase tracking-wider">Demand Multiplier</div>
            </div>
          </div>

          {/* DEMAND FORECAST CHARTS (Span 8) */}
          <div className="lg:col-span-8 bg-white rounded-[40px] p-8 border border-[#e4eae4] flex flex-col shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-black text-[#171d1a] tracking-tight">Demand Velocity Chart</h3>
                <p className="text-xs font-bold text-[#6d7a73] uppercase tracking-widest mt-1">Historic sales velocity mapped to predictive analytics</p>
              </div>
              
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <select 
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="bg-[#f8faf9] text-xs font-black text-[#171d1a] border border-[#e4eae4] px-4 py-2.5 rounded-xl outline-none focus:border-[#00694c] transition-colors"
                >
                  {forecastData.products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <div className="flex bg-[#f8faf9] p-1 rounded-xl border border-[#e4eae4]">
                  <button 
                    onClick={() => setChartView("weekly")}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${chartView === "weekly" ? "bg-white text-[#171d1a] shadow-sm" : "text-[#6d7a73] hover:text-[#171d1a]"}`}
                  >
                    Weekly
                  </button>
                  <button 
                    onClick={() => setChartView("monthly")}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${chartView === "monthly" ? "bg-white text-[#171d1a] shadow-sm" : "text-[#6d7a73] hover:text-[#171d1a]"}`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-end min-h-[300px] mt-4 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-[#6d7a73] w-full h-0" />
                ))}
              </div>

              <div className="relative z-10 w-full h-[240px] flex items-end gap-3 px-2">
                {activeChartPoints.map((point, index) => {
                  const histHeight = maxVal > 0 ? (point.historicalSales / maxVal) * 100 : 0;
                  const projHeight = maxVal > 0 ? (point.projectedSales / maxVal) * 100 : 0;
                  const isProjected = point.projectedSales > 0;

                  return (
                    <div 
                      key={index}
                      className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <div className="w-full flex justify-center gap-1 items-end h-[85%] pb-2">
                        {point.historicalSales > 0 && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${histHeight}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="w-1/2 bg-gradient-to-t from-[#6d7a73] to-[#bccac1] rounded-t-lg group-hover:from-[#171d1a] group-hover:to-[#6d7a73] transition-colors"
                          />
                        )}
                        {point.projectedSales > 0 && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${projHeight}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="w-1/2 bg-gradient-to-t from-[#584fbc] to-[#958dff] rounded-t-lg group-hover:from-[#3a3385] group-hover:to-[#584fbc] transition-colors"
                          />
                        )}
                      </div>
                      
                      <span className={`text-[10px] font-black mt-2 uppercase ${isProjected ? "text-[#584fbc]" : "text-[#6d7a73]"}`}>
                        {point.period}
                      </span>
                    </div>
                  );
                })}
              </div>

              <AnimatePresence>
                {hoveredPoint && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#171d1a]/95 backdrop-blur-md border border-white/10 text-white rounded-2xl p-4 shadow-2xl z-20 flex gap-4 min-w-[200px]"
                  >
                    <div>
                      <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">{hoveredPoint.period} Sales</div>
                      <div className="text-sm font-black mt-1">{activeProduct?.name}</div>
                      <div className="flex gap-4 mt-2">
                        {hoveredPoint.historicalSales > 0 && (
                          <div>
                            <span className="text-[9px] text-[#bccac1] font-bold block">Historical</span>
                            <span className="text-base font-black text-white">{hoveredPoint.historicalSales} units</span>
                          </div>
                        )}
                        {hoveredPoint.projectedSales > 0 && (
                          <div>
                            <span className="text-[9px] text-[#958dff] font-bold block">Projected</span>
                            <span className="text-base font-black text-[#86f8c9]">{hoveredPoint.projectedSales} units</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-6 mt-8 pt-6 border-t border-[#e4eae4] text-xs font-bold text-[#6d7a73]">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 bg-gradient-to-r from-[#6d7a73] to-[#bccac1] rounded" />
                <span>Historical Demand (POS data)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 bg-gradient-to-r from-[#584fbc] to-[#958dff] rounded" />
                <span>AI Projected Demand (+Seasonal Buffers)</span>
              </div>
            </div>
          </div>

          {/* STOCKOUT RISK ANALYSIS & WHATSUP Restocking (Span 4) */}
          <div className="lg:col-span-4 bg-white rounded-[40px] p-8 border border-[#e4eae4] flex flex-col shadow-sm min-h-[460px]">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-[#171d1a] tracking-tight">Stockout Risk</h3>
                <span className="text-[10px] font-black text-white bg-[#ba1a1a] px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  72h Risk
                </span>
              </div>
              <p className="text-xs font-bold text-[#6d7a73] uppercase tracking-widest mt-1">High depletion risk within 3 days</p>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {highRiskItems.length === 0 && depletedItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#e4eae4] rounded-3xl">
                  <span className="material-symbols-outlined text-[48px] text-[#00694c] mb-3">check_circle</span>
                  <p className="text-[#6d7a73] font-bold text-sm">No items at risk</p>
                  <p className="text-xs text-[#bccac1] font-medium mt-1">All stock levels will outlast the 72h window.</p>
                </div>
              ) : (
                <>
                  {depletedItems.map((alert, i) => (
                    <div key={`depleted-${i}`} className="p-4 rounded-2xl border border-[#ba1a1a]/30 bg-[#ba1a1a]/5 flex flex-col justify-between gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-black text-[#ba1a1a] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">cancel</span> OUT OF STOCK
                          </div>
                          <h4 className="text-sm font-black text-[#171d1a] mt-1">{alert.name}</h4>
                          <p className="text-[11px] text-[#6d7a73] font-medium mt-0.5">
                            Supplier Lead Time: <span className="font-bold text-[#171d1a]">{alert.lead_time_days} days</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-[#171d1a]">0</span>
                          <span className="text-[10px] text-[#6d7a73] font-bold block">stock</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => triggerWhatsAppRequest(alert)}
                        className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                        WhatsApp Restock Order
                      </button>
                    </div>
                  ))}

                  {highRiskItems.map((alert, i) => (
                    <div key={`risk-${i}`} className="p-4 rounded-2xl border border-[#ba1a1a]/20 bg-[#fff1f2] flex flex-col justify-between gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-black text-[#ba1a1a] uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] animate-bounce">warning</span> DEPLETES IN {alert.days_remaining}d
                          </div>
                          <h4 className="text-sm font-black text-[#171d1a] mt-1">{alert.name}</h4>
                          <p className="text-[11px] text-[#6d7a73] font-medium mt-0.5">
                            Shipping Buffer: <span className="font-bold text-[#171d1a]">{alert.lead_time_days}d lead time</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-[#ba1a1a]">{alert.stock_quantity}</span>
                          <span className="text-[10px] text-[#6d7a73] font-bold block">stock</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => triggerWhatsAppRequest(alert)}
                        className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                        WhatsApp Restock Order
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* SMART REORDER TIMELINE (Span 8) */}
          <div className="lg:col-span-8 bg-white rounded-[40px] p-8 border border-[#e4eae4] flex flex-col shadow-sm">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-[#171d1a] tracking-tight">Smart Reorder Timeline</h3>
                <p className="text-xs font-bold text-[#6d7a73] uppercase tracking-widest mt-1">Order suggestions synchronized with supplier delivery times</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {forecastData.reorderAlerts.slice(0, 4).map((alert, i) => {
                const urgencyStyles = {
                  CRITICAL: "border-[#ba1a1a] bg-[#fff1f2]/50 text-[#ba1a1a]",
                  HIGH: "border-[#805200] bg-[#fffbeb] text-[#805200]",
                  MEDIUM: "border-[#00694c]/20 bg-[#f0fdf4] text-[#00694c]",
                  LOW: "border-[#e4eae4] bg-[#f8faf9] text-[#6d7a73]"
                };

                return (
                  <div 
                    key={i} 
                    className={`p-5 rounded-[24px] border flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow ${urgencyStyles[alert.urgency]}`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-white border border-[#e4eae4]">
                          {alert.urgency} Urgency
                        </span>
                        <span className="text-xs font-black">{alert.stock_quantity} units left</span>
                      </div>
                      <h4 className="text-base font-black text-[#171d1a]">{alert.name}</h4>
                      
                      <div className="mt-4 space-y-1.5 text-xs text-[#6d7a73] font-bold">
                        <div className="flex justify-between">
                          <span>Rate of Consumption:</span>
                          <span className="text-[#171d1a]">{alert.daily_velocity} units/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lead-Time Offset:</span>
                          <span className="text-[#171d1a]">{alert.lead_time_days} days shipping buffer</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[#e4eae4] pt-4 mt-4 flex justify-between items-center bg-white/30 rounded-b-xl -mx-5 px-5 -mb-5 py-3">
                      <div>
                        <span className="text-[9px] text-[#6d7a73] font-black uppercase tracking-widest block">ORDER DATE Suggestion</span>
                        <span className="text-sm font-black text-[#171d1a]">{alert.reorder_date}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-[#6d7a73] font-black uppercase tracking-widest block">SUGGESTED restock qty</span>
                        <span className="text-sm font-black text-[#00694c]">{alert.suggested_qty} units</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CLERK REVENUE TARGETS (Span 4) */}
          <div className="lg:col-span-4 bg-white rounded-[40px] p-8 border border-[#e4eae4] flex flex-col shadow-sm">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-[#171d1a] tracking-tight">Clerk Revenue Targets</h3>
              <p className="text-xs font-bold text-[#6d7a73] uppercase tracking-widest mt-1">Projected sales goals based on previous shift history</p>
            </div>

            <div className="space-y-4 flex-1">
              {forecastData.clerkTargets.map((clerk, i) => (
                <div key={i} className="p-5 rounded-2xl border border-[#e4eae4] bg-[#f8faf9] flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-black text-[#171d1a]">{clerk.name}</h4>
                      <span className="text-[10px] font-bold text-[#6d7a73]">{clerk.email}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#584fbc]/10 text-[#584fbc] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-[#e4eae4] text-xs font-bold">
                    <div>
                      <span className="text-[9px] text-[#6d7a73] font-black uppercase tracking-widest block">Daily target goal</span>
                      <span className="text-base font-black text-[#171d1a]">KES {clerk.daily_target.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#6d7a73] font-black uppercase tracking-widest block">Weekly target goal</span>
                      <span className="text-base font-black text-[#584fbc]">KES {clerk.projected_target.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
