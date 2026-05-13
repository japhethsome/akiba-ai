"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/topbar";

const urgencyStyle: Record<string, React.CSSProperties> = {
  "URGENT": { background: "#ffdad6", color: "#410002" },
  "REORDER SOON": { background: "rgba(128,82,0,0.12)", color: "#805200" },
  "SUFFICIENT": { background: "rgba(0,105,76,0.1)", color: "#00694c" },
};

const forecastData = [
  { id: 1, name: "Sugar 1kg", category: "Groceries", current: 8, demand: 120, rop: 25, suggest: "150 units", urgency: "URGENT", trend: "up" },
  { id: 2, name: "Unga wa Ngano 2kg", category: "Groceries", current: 45, demand: 90, rop: 20, suggest: "60 units", urgency: "REORDER SOON", trend: "stable" },
  { id: 3, name: "Cooking Oil 2L", category: "Groceries", current: 0, demand: 60, rop: 10, suggest: "80 units", urgency: "URGENT", trend: "up" },
  { id: 4, name: "Maize Flour 2kg", category: "Groceries", current: 120, demand: 85, rop: 30, suggest: "—", urgency: "SUFFICIENT", trend: "stable" },
  { id: 5, name: "Nails 4-inch 1kg", category: "Hardware", current: 5, demand: 40, rop: 10, suggest: "50 units", urgency: "REORDER SOON", trend: "up" },
  { id: 6, name: "Wire Mesh 1m", category: "Hardware", current: 32, demand: 25, rop: 8, suggest: "—", urgency: "SUFFICIENT", trend: "down" },
  { id: 7, name: "Cement 50kg", category: "Hardware", current: 4, demand: 35, rop: 8, suggest: "40 units", urgency: "URGENT", trend: "up" },
  { id: 8, name: "DAP Fertilizer 50kg", category: "Agro-vet", current: 18, demand: 20, rop: 5, suggest: "15 units", urgency: "REORDER SOON", trend: "up" },
  { id: 9, name: "Broiler Feed 50kg", category: "Agro-vet", current: 3, demand: 28, rop: 5, suggest: "35 units", urgency: "URGENT", trend: "up" },
  { id: 10, name: "Maize Seed 2kg", category: "Agro-vet", current: 55, demand: 30, rop: 8, suggest: "—", urgency: "SUFFICIENT", trend: "down", isNew: true },
];

export default function ForecastingPage() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");

  const toggleProduct = (id: number) => {
    setSelectedProducts(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const filtered = activeFilter === "All" ? forecastData : forecastData.filter(d => d.category === activeFilter);

  return (
    <div className="flex min-h-screen" style={{ background: "#f5fbf5" }}>
      <Sidebar />
      <div className="flex-1 md:ml-[240px] flex flex-col min-w-0">
        <TopBar title="Forecasts" />

        <main className="flex-1 p-4 md:p-6 space-y-5 pb-24 md:pb-6 max-w-7xl mx-auto w-full">

          {/* SUMMARY BANNER */}
          <div className="p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm border"
            style={{ background: "#008560", borderColor: "rgba(0,105,76,0.3)", color: "#f5fff7" }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                <span className="material-symbols-outlined text-[28px]" style={{ color: "#86f8c9", fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div>
                <h2 className="text-lg font-black leading-tight">3 products need reordering this week</h2>
                <p className="text-sm opacity-75 font-medium">Based on 30-day WMA forecast + current lead times</p>
              </div>
            </div>
            <button className="h-11 px-6 rounded-xl font-black text-xs uppercase tracking-wider active:scale-95 transition-transform shadow-lg whitespace-nowrap"
              style={{ background: "#f5fff7", color: "#00694c" }}>
              View Recommendations
            </button>
          </div>

          {/* FILTER BAR */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {["All", "Groceries", "Hardware", "Agro-vet"].map((cat) => (
                <button key={cat} onClick={() => setActiveFilter(cat)}
                  className="px-4 h-9 rounded-full font-black text-xs uppercase tracking-wider transition-all border"
                  style={activeFilter === cat
                    ? { background: "#00694c", color: "white", borderColor: "#00694c" }
                    : { background: "white", borderColor: "#bccac1", color: "#6d7a73" }}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <select className="appearance-none bg-white border border-[#bccac1] rounded-xl h-9 pl-3 pr-8 text-xs font-black text-[#171d1a] uppercase tracking-wider focus:border-[#00694c] outline-none cursor-pointer w-full">
                  <option>Sort by: Urgency ↓</option>
                  <option>Sort by: Name</option>
                  <option>Sort by: Forecast Demand</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#6d7a73] text-[18px]">expand_more</span>
              </div>
              <button className="border border-[#bccac1] bg-white rounded-xl h-9 px-4 font-black text-xs text-[#6d7a73] uppercase tracking-wider flex items-center gap-2 hover:bg-[#f5fbf5] transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[18px]">download</span>Export
              </button>
            </div>
          </div>

          {/* FORECAST TABLE */}
          <div className="bg-white rounded-xl border border-[#bccac1] shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-[32px_2fr_1fr_1fr_1fr_1.5fr_1fr] px-4 py-2 bg-[#f5fbf5] border-b border-[#bccac1] text-[10px] text-[#6d7a73] font-black tracking-widest uppercase">
              <div />
              <span>Product</span><span>Stock</span><span>Predicted (30d)</span>
              <span>Reorder Pt</span><span>Recommended Order</span><span className="text-right">Urgency</span>
            </div>

            <div className="divide-y divide-[#e4eae4]">
              {filtered.map((item) => (
                <div key={item.id} className="flex flex-col">
                  <div
                    className="grid md:grid-cols-[32px_2fr_1fr_1fr_1fr_1.5fr_1fr] px-4 py-3 md:py-2.5 items-center cursor-pointer transition-colors group"
                    style={{ background: expandedRow === item.id ? "#f5fbf5" : undefined }}
                    onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}
                    onMouseEnter={e => { if (expandedRow !== item.id) (e.currentTarget as HTMLElement).style.background = "#f9fcf9"; }}
                    onMouseLeave={e => { if (expandedRow !== item.id) (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <div className="hidden md:block" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedProducts.includes(item.id)} onChange={() => toggleProduct(item.id)}
                        className="w-4 h-4 rounded cursor-pointer accent-[#00694c]" />
                    </div>

                    <div className="flex items-center gap-3 mb-1 md:mb-0">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#171d1a] group-hover:text-[#00694c] transition-colors flex items-center gap-1.5">
                          {item.name}
                          {"isNew" in item && item.isNew && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full" style={{ background: "rgba(88,79,188,0.1)", color: "#584fbc" }}>NEW</span>
                          )}
                        </span>
                        <span className="text-[10px] text-[#6d7a73] font-black uppercase">{item.category}</span>
                      </div>
                      {/* Sparkline */}
                      <div className="hidden lg:block ml-4">
                        <svg width="48" height="16" viewBox="0 0 60 20">
                          <path d={item.trend === "up" ? "M0,15 L15,10 L30,12 L45,5 L60,2" : item.trend === "down" ? "M0,5 L15,12 L30,8 L45,15 L60,18" : "M0,10 L15,12 L30,10 L45,11 L60,10"}
                            fill="none" stroke={item.trend === "up" ? "#00694c" : item.trend === "down" ? "#ba1a1a" : "#6d7a73"}
                            strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>

                    {/* Mobile labels */}
                    <div className="flex justify-between md:block items-center">
                      <span className="md:hidden text-[10px] text-[#6d7a73] font-black uppercase">STOCK</span>
                      <span className="text-sm font-black" style={{ color: item.current <= item.rop ? "#ba1a1a" : "#171d1a" }}>{item.current}</span>
                    </div>
                    <div className="flex justify-between md:block items-center">
                      <span className="md:hidden text-[10px] text-[#6d7a73] font-black uppercase">PREDICTED</span>
                      <span className="text-sm font-bold text-[#171d1a]">{item.demand} <span className="text-[10px] text-[#6d7a73]">units</span></span>
                    </div>
                    <div className="flex justify-between md:block items-center">
                      <span className="md:hidden text-[10px] text-[#6d7a73] font-black uppercase">REORDER PT</span>
                      <span className="text-sm text-[#6d7a73]">{item.rop}</span>
                    </div>
                    <div className="flex justify-between md:block items-center">
                      <span className="md:hidden text-[10px] text-[#6d7a73] font-black uppercase">RECOMMENDED</span>
                      <span className="text-sm font-black" style={{ color: "#00694c" }}>{item.suggest}</span>
                    </div>
                    <div className="flex justify-between md:justify-end items-center mt-1 md:mt-0">
                      <span className="md:hidden text-[10px] text-[#6d7a73] font-black uppercase">URGENCY</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                        style={urgencyStyle[item.urgency]}>
                        {item.urgency}
                      </span>
                    </div>
                  </div>

                  {/* EXPANDABLE DETAIL */}
                  {expandedRow === item.id && (
                    <div className="p-4 md:p-5 border-t border-[#bccac1] flex flex-col md:grid md:grid-cols-3 gap-5 bg-[#f5fbf5]"
                      style={{ animation: "slideDown 0.3s ease-out" }}>
                      {/* Mini chart */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] text-[#6d7a73] font-black uppercase tracking-wider">30-Day Sales Trend</span>
                        <div className="h-28 bg-white rounded-xl border border-[#bccac1] flex items-end justify-between px-3 pb-3 gap-1">
                          {[40, 55, 45, 60, 75, 90, 80, 70, 85, 95].map((h, i) => (
                            <div key={i} className="flex-1 rounded-t-sm transition-all cursor-pointer"
                              style={{ height: `${h}%`, background: "rgba(0,105,76,0.15)" }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#00694c"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,105,76,0.15)"} />
                          ))}
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-[#6d7a73] uppercase">
                          <span>30 Days Ago</span><span>Today</span>
                        </div>
                      </div>

                      {/* AI Explanation */}
                      <div className="p-4 rounded-xl" style={{ background: "rgba(88,79,188,0.07)", borderLeft: "3px solid #584fbc" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-[18px]" style={{ color: "#584fbc", fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#584fbc" }}>AI Explanation</span>
                        </div>
                        <p className="text-sm text-[#171d1a] leading-relaxed">
                          Based on your last 30 days of sales, this product averages <span className="font-black">{(item.demand / 30).toFixed(1)} units/day</span> with a 3-day supplier lead time. Safety stock adjusted for medium volatility.
                        </p>
                      </div>

                      {/* Supplier */}
                      <div className="p-4 rounded-xl border border-[#bccac1] bg-white flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-[#6d7a73] tracking-wider">Supplier Details</span>
                          <span className="material-symbols-outlined text-[20px]" style={{ color: "#00694c", fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-[#171d1a] truncate">Brookside Distributors Ltd</p>
                          <p className="text-xs text-[#6d7a73]">Lead Time: <span className="font-black text-[#171d1a]">3 days</span></p>
                          <p className="text-xs text-[#6d7a73]">Last Price: <span className="font-black text-[#171d1a]">KES 120 / unit</span></p>
                        </div>
                        <button className="h-9 px-4 rounded-xl font-black text-xs uppercase tracking-wider mt-auto active:scale-95 transition-transform shadow-sm text-white"
                          style={{ background: "#00694c" }}>
                          Place Order
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* BULK ACTION BAR */}
        {selectedProducts.length > 0 && (
          <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border"
            style={{ background: "#1a2e24", color: "#ecf2ed", borderColor: "rgba(255,255,255,0.1)", animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
            <span className="text-sm font-black uppercase tracking-wider">{selectedProducts.length} selected</span>
            <div className="flex items-center gap-3">
              <button className="h-10 px-5 rounded-full font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform text-white" style={{ background: "#00694c" }}>
                Place Reorder
              </button>
              <button className="h-10 px-4 rounded-full font-black text-xs uppercase tracking-wider border hover:bg-white/10 transition-all" style={{ borderColor: "rgba(255,255,255,0.25)" }}>
                Export
              </button>
              <button onClick={() => setSelectedProducts([])} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideDown { from { opacity:0; max-height:0; } to { opacity:1; max-height:500px; } }
        @keyframes slideUp { from { opacity:0; transform:translate(-50%,20px); } to { opacity:1; transform:translate(-50%,0); } }
      `}</style>
    </div>
  );
}
