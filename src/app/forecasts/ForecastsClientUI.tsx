"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cleanWhatsAppNumber } from "@/lib/phone";

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

interface MarketFeedItem {
  id: string;
  title: string;
  metric: string;
  impact: string;
  type: "WEATHER" | "AGRICULTURE" | "EPRA" | "HOLIDAY" | "MACRO";
  details: string;
}

interface ForecastsClientUIProps {
  upcomingEvent: string;
  eventDescription: string;
  seasonalFactor: number;
  reorderAlerts: ReorderAlert[];
  chartDataByProduct: Record<string, { weekly: DemandPoint[]; monthly: DemandPoint[] }>;
  clerkTargets: ClerkTarget[];
  products: { id: string; name: string }[];
  storeName: string;
  marketFeed?: MarketFeedItem[];
}

export function ForecastsClientUI({
  upcomingEvent,
  eventDescription,
  seasonalFactor,
  reorderAlerts,
  chartDataByProduct,
  clerkTargets,
  products,
  storeName,
  marketFeed = [],
}: ForecastsClientUIProps) {
  // Session lock to prevent multiple tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Clean up any stale localStorage key from the old lock mechanism
    try {
      localStorage.removeItem("akiba_active_session");
    } catch (e) {}

    if (typeof BroadcastChannel === "undefined") return;

    const myTabId = Math.random().toString(36).substring(7);
    const myCreatedAt = Date.now();
    const channel = new BroadcastChannel("akiba_tab_channel");
    
    // We wait 500ms before checking to allow any unmounting pages or double-renders to clean up
    const timer = setTimeout(() => {
      channel.postMessage({ type: "CHECK_OTHER_TABS", tabId: myTabId, createdAt: myCreatedAt });
    }, 500);

    const handleMessage = (event: MessageEvent) => {
      const { type, tabId, createdAt } = event.data || {};
      if (type === "CHECK_OTHER_TABS") {
        // If we are the older tab (or win the tie-breaker), notify the new tab to close
        if (myCreatedAt < createdAt || (myCreatedAt === createdAt && myTabId < tabId)) {
          channel.postMessage({ type: "TAB_ALREADY_EXISTS", targetTabId: tabId });
        }
      } else if (type === "TAB_ALREADY_EXISTS") {
        if (event.data.targetTabId === myTabId) {
          alert("Akiba Yangu is already open in another tab. Please use that tab or close it to continue here.");
          window.location.href = "/";
        }
      }
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      clearTimeout(timer);
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, []);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ""
  );
  const [chartView, setChartView] = useState<"weekly" | "monthly">("weekly");
  const [hoveredPoint, setHoveredPoint] = useState<DemandPoint | null>(null);

  // Active product details
  const activeProduct = products.find(p => p.id === selectedProductId);
  const productChartData = selectedProductId ? chartDataByProduct[selectedProductId] : null;
  const activeChartPoints = productChartData ? productChartData[chartView] : [];

  // Calculate high stockout risk items (depletion in <= 72 hours)
  const highRiskItems = reorderAlerts.filter(
    alert => alert.days_remaining <= 3 && alert.stock_quantity > 0
  );
  
  // Also count depleted out of stock items
  const depletedItems = reorderAlerts.filter(alert => alert.stock_quantity === 0);
  
  const totalAlertsCount = reorderAlerts.filter(a => a.urgency === "CRITICAL" || a.urgency === "HIGH").length;

  // WhatsApp link generator
  const triggerWhatsAppRequest = (alert: ReorderAlert) => {
    const message = `Habari ${alert.supplier_name}, this is ${storeName}. We would like to place an order for ${alert.name}. Recommended Restock Quantity: ${alert.suggested_qty} units. Please confirm lead time of ${alert.lead_time_days} days. Shukran.`;
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanWhatsAppNumber(alert.supplier_contact)}?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  };

  // Find max value in chart points to scale the SVG chart
  const maxVal = activeChartPoints.length > 0 
    ? Math.max(...activeChartPoints.map(p => Math.max(p.historicalSales, p.projectedSales))) 
    : 100;

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  } as const;

  const item = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
  } as const;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto w-full"
    >
      {/* 1. SECTOR HEADER & SEASONAL BANNER */}
      <motion.div variants={item} className="lg:col-span-12 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-2">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black text-[#171d1a] tracking-tight mt-3">
            Predictive Ordering &amp; Demand Forecasts
          </h1>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link href="/dashboard" className="flex-1 md:flex-initial bg-white border border-[#e4eae4] text-[#6d7a73] hover:text-[#171d1a] px-6 py-3.5 rounded-2xl font-black text-xs hover:border-[#bccac1] transition-all flex items-center justify-center">
            Dashboard
          </Link>
          <Link href="/dashboard/inventory" className="flex-1 md:flex-initial bg-[#171d1a] text-white px-6 py-3.5 rounded-2xl font-black text-xs hover:bg-black transition-all shadow-md flex items-center justify-center">
            Manage Stock
          </Link>
        </div>
      </motion.div>

      {/* SEASONAL DETECTOR BANNER (Span 12) */}
      <motion.div 
        variants={item} 
        className="lg:col-span-12 bg-gradient-to-r from-[#584fbc]/10 to-[#00a87a]/5 border border-[#584fbc]/20 rounded-[24px] md:rounded-[32px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden"
      >
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
              <span className="text-sm font-black text-[#171d1a]">{upcomingEvent}</span>
            </div>
            <p className="text-xs font-bold text-[#6d7a73] leading-relaxed mt-1 max-w-2xl">
              {eventDescription} Local demand variables updated automatically by <span className="text-[#00694c] font-black">+{Math.round((seasonalFactor - 1) * 100)}%</span>.
            </p>
          </div>
        </div>
        <div className="text-center md:text-right bg-white/70 backdrop-blur border border-white px-5 py-3 rounded-2xl shrink-0">
          <div className="text-2xl font-black text-[#584fbc] tracking-tighter">x{seasonalFactor.toFixed(2)}</div>
          <div className="text-[9px] font-black text-[#6d7a73] uppercase tracking-wider">Demand Multiplier</div>
        </div>
      </motion.div>

      <motion.div variants={item} className="lg:col-span-8 bg-white rounded-[28px] md:rounded-[40px] p-5 md:p-8 border border-[#e4eae4] flex flex-col shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-black text-[#171d1a] tracking-tight">Demand Velocity Chart</h3>
            <p className="text-xs font-bold text-[#6d7a73] uppercase tracking-widest mt-1">Historic sales velocity mapped to predictive analytics</p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            {/* Product Selector */}
            <select 
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="bg-[#f8faf9] text-xs font-black text-[#171d1a] border border-[#e4eae4] px-4 py-2.5 rounded-xl outline-none focus:border-[#00694c] transition-colors"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Chart View Toggle */}
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

        {/* Visual Chart - Responsive SVG */}
        <div className="flex-1 flex flex-col justify-end min-h-[300px] mt-4 relative">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-[#6d7a73] w-full h-0" />
            ))}
          </div>

          <div className="relative z-10 w-full h-[240px] flex items-end gap-1.5 md:gap-3 px-1 md:px-2">
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
                    {/* Historical Bar */}
                    {point.historicalSales > 0 && (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${histHeight}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-1/2 bg-gradient-to-t from-[#6d7a73] to-[#bccac1] rounded-t-lg group-hover:from-[#171d1a] group-hover:to-[#6d7a73] transition-colors"
                      />
                    )}
                    {/* Projected Bar */}
                    {point.projectedSales > 0 && (
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${projHeight}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-1/2 bg-gradient-to-t from-[#584fbc] to-[#958dff] rounded-t-lg group-hover:from-[#3a3385] group-hover:to-[#584fbc] transition-colors"
                      />
                    )}
                  </div>
                  
                  {/* Axis Label */}
                  <span className={`text-[8px] md:text-[10px] font-black mt-2 uppercase text-center truncate w-full ${isProjected ? "text-[#584fbc]" : "text-[#6d7a73]"}`}>
                    {point.period}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Interactive Tooltip on Hover */}
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

        {/* Legend */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-8 pt-6 border-t border-[#e4eae4] text-xs font-bold text-[#6d7a73]">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-gradient-to-r from-[#6d7a73] to-[#bccac1] rounded" />
            <span>Historical Demand (POS data)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-gradient-to-r from-[#584fbc] to-[#958dff] rounded" />
            <span>AI Projected Demand (+Seasonal Buffers)</span>
          </div>
        </div>
      </motion.div>

      {/* 3. STOCKOUT RISK ANALYSIS & WHATSAPP (Span 4) */}
      <motion.div variants={item} className="lg:col-span-4 bg-white rounded-[28px] md:rounded-[40px] p-5 md:p-8 border border-[#e4eae4] flex flex-col shadow-sm min-h-[460px]">
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
              {/* Out of Stock (Depleted) */}
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
                    className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-[#25D366]/20"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    WhatsApp Restock Order
                  </button>
                </div>
              ))}

              {/* High Risk (Depletes soon) */}
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
                    className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-[#25D366]/20"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    WhatsApp Restock Order
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </motion.div>

      {/* 4. SMART REORDER ALERTS & SUPPLIER LEAD-TIME SYNC (Span 8) */}
      <motion.div variants={item} className="lg:col-span-8 bg-white rounded-[28px] md:rounded-[40px] p-5 md:p-8 border border-[#e4eae4] flex flex-col shadow-sm">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-[#171d1a] tracking-tight">Smart Reorder Timeline</h3>
            <p className="text-xs font-bold text-[#6d7a73] uppercase tracking-widest mt-1">Order suggestions synchronized with supplier delivery times</p>
          </div>
          <span className="text-xs font-black bg-[#f3f4f6] text-[#171d1a] px-3.5 py-1.5 rounded-xl border border-[#e4eae4]">
            {totalAlertsCount} alerts active
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {reorderAlerts.slice(0, 4).map((alert, i) => {
            const urgencyStyles = {
              CRITICAL: "border-[#ba1a1a] bg-[#fff1f2]/50 text-[#ba1a1a] icon-warning",
              HIGH: "border-[#805200] bg-[#fffbeb] text-[#805200] icon-warning",
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
                    <span className="text-xs font-black">
                      {alert.stock_quantity} units left
                    </span>
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
      </motion.div>

      {/* 5. ESTIMATED CLERK REVENUE TARGETS (Span 4) */}
      <motion.div variants={item} className="lg:col-span-4 bg-white rounded-[28px] md:rounded-[40px] p-5 md:p-8 border border-[#e4eae4] flex flex-col shadow-sm">
        <div className="mb-6">
          <h3 className="text-2xl font-black text-[#171d1a] tracking-tight">Clerk Revenue Targets</h3>
          <p className="text-xs font-bold text-[#6d7a73] uppercase tracking-widest mt-1">Projected sales goals based on previous shift history</p>
        </div>

        <div className="space-y-4 flex-1">
          {clerkTargets.map((clerk, i) => (
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
      </motion.div>

      {/* Floating Sparkles 'Ask Akiba Yangu Coach' Button */}
      <div className="fixed bottom-24 right-6 z-[160] pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const customEvent = new CustomEvent("open-ai-chat", {
              detail: {
                prompt: "Help me analyze my store's predictive demand forecasts, seasonal multipliers, and critical restocking alerts."
              }
            });
            window.dispatchEvent(customEvent);
          }}
          className="flex items-center gap-2 px-5 h-12 bg-gradient-to-r from-[#584fbc] to-[#00694c] hover:from-[#493ea6] hover:to-[#00573e] text-white rounded-full font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-[#584fbc]/20 border border-white/20 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-amber-300 animate-pulse shrink-0">
            <path d="M11.5 2C11.5 2 12.3 5.7 14 7.4C15.7 9.1 19.4 9.9 19.4 9.9C19.4 9.9 15.7 10.7 14 12.4C12.3 14.1 11.5 17.8 11.5 17.8C11.5 17.8 10.7 14.1 9 12.4C7.3 10.7 3.6 9.9 3.6 9.9C3.6 9.9 7.3 9.1 9 7.4C10.7 5.7 11.5 2 11.5 2Z" />
            <path d="M19 14C19 14 19.4 15.8 20.2 16.6C21 17.4 22.8 17.8 22.8 17.8C22.8 17.8 21 18.2 20.2 19C19.4 19.8 19 21.6 19 21.6C19 21.6 18.6 19.8 17.8 19C17 18.2 15.2 17.8 15.2 17.8C15.2 17.8 17 17.4 17.8 16.6C18.6 15.8 19 14 19 14Z" />
          </svg>
          <span>Ask Akiba Yangu Coach</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
