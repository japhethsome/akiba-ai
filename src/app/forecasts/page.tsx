"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/topbar";
import Link from "next/link";

const forecastData = [
  { id: 1, name: "Sugar 1kg", category: "Groceries", current: 8, demand: 120, rop: 25, suggest: "150 units", urgency: "URGENT", urgencyColor: "bg-error-container text-on-error-container", trend: "up" },
  { id: 2, name: "Unga wa Ngano 2kg", category: "Groceries", current: 45, demand: 90, rop: 20, suggest: "60 units", urgency: "REORDER SOON", urgencyColor: "bg-tertiary-container/20 text-tertiary", trend: "stable" },
  { id: 3, name: "Cooking Oil 2L", category: "Groceries", current: 0, demand: 60, rop: 10, suggest: "80 units", urgency: "URGENT", urgencyColor: "bg-error-container text-on-error-container", trend: "up" },
  { id: 4, name: "Maize Flour 2kg", category: "Groceries", current: 120, demand: 85, rop: 30, suggest: "—", urgency: "SUFFICIENT", urgencyColor: "bg-primary/10 text-primary", trend: "stable" },
  { id: 5, name: "Nails 4-inch 1kg", category: "Hardware", current: 5, demand: 40, rop: 10, suggest: "50 units", urgency: "REORDER SOON", urgencyColor: "bg-tertiary-container/20 text-tertiary", trend: "up" },
  { id: 6, name: "Wire Mesh 1m", category: "Hardware", current: 32, demand: 25, rop: 8, suggest: "—", urgency: "SUFFICIENT", urgencyColor: "bg-primary/10 text-primary", trend: "down" },
  { id: 7, name: "Cement 50kg", category: "Hardware", current: 4, demand: 35, rop: 8, suggest: "40 units", urgency: "URGENT", urgencyColor: "bg-error-container text-on-error-container", trend: "up" },
  { id: 8, name: "DAP Fertilizer 50kg", category: "Agro-vet", current: 18, demand: 20, rop: 5, suggest: "15 units", urgency: "REORDER SOON", urgencyColor: "bg-tertiary-container/20 text-tertiary", trend: "up" },
  { id: 9, name: "Broiler Feed 50kg", category: "Agro-vet", current: 3, demand: 28, rop: 5, suggest: "35 units", urgency: "URGENT", urgencyColor: "bg-error-container text-on-error-container", trend: "up" },
  { id: 10, name: "Maize Seed 2kg", category: "Agro-vet", current: 55, demand: 30, rop: 8, suggest: "—", urgency: "SUFFICIENT", urgencyColor: "bg-primary/10 text-primary", trend: "down", isNew: true },
];

export default function ForecastingPage() {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const toggleProduct = (id: number) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 md:ml-[240px] flex flex-col min-w-0">
        <TopBar title="Forecasts" />

        <main className="flex-1 p-margin-mobile md:p-lg space-y-xl pb-24 md:pb-lg max-w-7xl mx-auto w-full">
          {/* SUMMARY BANNER */}
          <div className="bg-primary-container text-on-primary-container p-lg rounded-xl flex flex-col md:flex-row items-center justify-between gap-md shadow-sm border border-primary/20">
            <div className="flex items-center gap-md">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] fill-1 text-on-primary-container">auto_awesome</span>
              </div>
              <div>
                <h2 className="text-h2 font-black leading-tight">3 products need reordering this week</h2>
                <p className="text-body-md opacity-80 font-medium">Based on 30-day WMA forecast + current lead times</p>
              </div>
            </div>
            <button className="bg-on-primary-container text-primary-container h-[48px] px-lg rounded-xl font-black text-label-caps uppercase tracking-wider active:scale-95 transition-transform shadow-lg">
              View Recommendations
            </button>
          </div>

          {/* FILTER & CONTROL BAR */}
          <div className="flex flex-col md:flex-row gap-sm items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-xs">
              {["All", "Groceries", "Hardware", "Agro-vet"].map((cat) => (
                <button
                  key={cat}
                  className={`px-md h-[40px] rounded-full font-black text-label-caps uppercase tracking-wider transition-all border ${
                    cat === "All"
                      ? "bg-primary text-on-primary border-primary shadow-sm"
                      : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-sm w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <select className="appearance-none bg-surface-container-lowest border border-outline-variant rounded-xl h-[40px] pl-sm pr-10 font-black text-label-caps text-on-surface uppercase tracking-wider focus:border-primary outline-none cursor-pointer w-full">
                  <option>Sort by: Urgency ↓</option>
                  <option>Sort by: Name</option>
                  <option>Sort by: Forecast Demand</option>
                </select>
                <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
              <button className="border border-outline-variant bg-surface-container-low rounded-xl h-[40px] px-md font-black text-label-caps text-on-surface-variant uppercase tracking-wider flex items-center gap-xs hover:bg-surface-container transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[20px]">download</span>
                Export
              </button>
            </div>
          </div>

          {/* FORECAST TABLE */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-[auto_2fr_1fr_1fr_1fr_1.5fr_1fr] px-md py-sm bg-surface-container-high border-b border-outline-variant text-label-caps text-on-surface-variant font-black tracking-wider uppercase">
              <div className="w-6"></div>
              <span>Product</span>
              <span>Current Stock</span>
              <span>Predicted (30d)</span>
              <span>Reorder Pt</span>
              <span>Recommended Order</span>
              <span className="text-right">Urgency</span>
            </div>

            <div className="divide-y divide-outline-variant">
              {forecastData.map((item) => (
                <div key={item.id} className="flex flex-col">
                  <div 
                    className={`grid md:grid-cols-[auto_2fr_1fr_1fr_1fr_1.5fr_1fr] px-md py-md md:py-sm items-center hover:bg-surface-container cursor-pointer transition-colors group ${expandedRow === item.id ? 'bg-surface-container' : ''}`}
                    onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}
                  >
                    <div className="hidden md:block w-6" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedProducts.includes(item.id)}
                        onChange={() => toggleProduct(item.id)}
                        className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex items-center gap-md">
                      <div className="flex flex-col">
                        <span className="font-black text-on-surface text-body-md group-hover:text-primary transition-colors flex items-center gap-xs">
                          {item.name}
                          {item.isNew && (
                            <span className="bg-secondary-container text-on-secondary-container rounded-full px-xs py-0.5 text-[8px] font-black uppercase">NEW</span>
                          )}
                        </span>
                        <span className="text-[11px] font-bold text-on-surface-variant opacity-60 uppercase">{item.category}</span>
                      </div>
                      {/* Sparkline Mock (SVG) */}
                      <div className="hidden lg:block ml-auto mr-xl">
                        <svg width="60" height="20" viewBox="0 0 60 20">
                          <path 
                            d={item.trend === 'up' ? "M0,15 L15,10 L30,12 L45,5 L60,2" : item.trend === 'down' ? "M0,5 L15,12 L30,8 L45,15 L60,18" : "M0,10 L15,12 L30,10 L45,11 L60,10"} 
                            fill="none" 
                            stroke={item.trend === 'up' ? "#00694c" : item.trend === 'down' ? "#ba1a1a" : "#6d7a73"} 
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="flex justify-between md:block items-center mt-2 md:mt-0">
                       <span className="md:hidden text-label-caps text-on-surface-variant font-bold">STOCK</span>
                       <span className={`text-body-md font-black ${item.current <= item.rop ? 'text-error' : 'text-on-surface'}`}>{item.current}</span>
                    </div>

                    <div className="flex justify-between md:block items-center">
                       <span className="md:hidden text-label-caps text-on-surface-variant font-bold uppercase">PREDICTED</span>
                       <span className="text-body-md font-bold text-on-surface">{item.demand} <span className="text-[10px] opacity-60">UNITS</span></span>
                    </div>

                    <div className="flex justify-between md:block items-center">
                       <span className="md:hidden text-label-caps text-on-surface-variant font-bold uppercase">REORDER PT</span>
                       <span className="text-body-md text-on-surface-variant font-medium">{item.rop}</span>
                    </div>

                    <div className="flex justify-between md:block items-center">
                       <span className="md:hidden text-label-caps text-on-surface-variant font-bold uppercase">RECOMMENDED</span>
                       <span className="text-body-md font-black text-primary">{item.suggest}</span>
                    </div>

                    <div className="flex justify-between md:justify-end items-center mt-2 md:mt-0">
                       <span className="md:hidden text-label-caps text-on-surface-variant font-bold uppercase">URGENCY</span>
                       <span className={`${item.urgencyColor} px-xs py-base rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap`}>
                          {item.urgency}
                       </span>
                    </div>
                  </div>

                  {/* EXPANDABLE DETAIL PANEL */}
                  {expandedRow === item.id && (
                    <div className="bg-surface-container-low/50 p-md md:p-lg border-t border-outline-variant flex flex-col md:grid md:grid-cols-3 gap-lg animate-slide-down">
                      {/* Left: Sales Chart Mock */}
                      <div className="flex flex-col gap-sm">
                        <span className="text-label-caps font-black uppercase text-on-surface-variant opacity-70">30-Day Sales Trend</span>
                        <div className="h-32 bg-white rounded-xl border border-outline-variant flex items-end justify-between px-md pb-md gap-1">
                          {[40, 55, 45, 60, 75, 90, 80, 70, 85, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-primary/20 hover:bg-primary rounded-t-sm transition-all" style={{ height: `${h}%` }}></div>
                          ))}
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-on-surface-variant opacity-50 px-1 uppercase">
                          <span>30 Days Ago</span>
                          <span>Today</span>
                        </div>
                      </div>

                      {/* Center: AI Explanation */}
                      <div className="ai-purple-tint p-md rounded-xl shadow-sm">
                        <div className="flex items-center gap-xs mb-sm">
                           <span className="material-symbols-outlined text-secondary fill-1 text-[20px]">auto_awesome</span>
                           <span className="text-label-caps text-secondary font-black uppercase">AI Explanation</span>
                        </div>
                        <p className="text-body-md text-on-surface leading-relaxed font-medium">
                          Based on your last 30 days of sales, this product averages <span className="font-bold">{(item.demand/30).toFixed(1)} units/day</span> with a 3-day supplier lead time. Safety stock adjusted for medium volatility. Reorder point = [demand × lead time] + safety stock.
                        </p>
                      </div>

                      {/* Right: Supplier Info */}
                      <div className="bg-surface-container-highest/30 p-md rounded-xl border border-outline-variant flex flex-col gap-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-label-caps font-black uppercase opacity-60">Supplier Details</span>
                          <span className="material-symbols-outlined text-primary text-[20px] fill-1">local_shipping</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-body-md font-black text-on-surface truncate">Brookside Distributors Ltd</p>
                          <p className="text-body-md font-medium text-on-surface-variant">Lead Time: <span className="font-bold text-on-surface">3 days</span></p>
                          <p className="text-body-md font-medium text-on-surface-variant">Last Price: <span className="font-bold text-on-surface">KES 120 / unit</span></p>
                        </div>
                        <button className="bg-primary text-on-primary h-[40px] px-md rounded-xl font-black text-label-caps uppercase tracking-wider mt-auto active:scale-95 transition-transform shadow-sm">
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
          <div className="fixed bottom-[80px] md:bottom-8 left-1/2 -translate-x-1/2 z-[110] bg-inverse-surface text-inverse-on-surface px-lg py-md rounded-full shadow-2xl flex items-center gap-lg border border-white/10 animate-slide-up">
            <span className="text-body-md font-black uppercase tracking-wider">{selectedProducts.length} products selected</span>
            <div className="flex items-center gap-md">
              <button className="bg-primary text-on-primary h-[44px] px-lg rounded-full font-black text-label-caps uppercase tracking-wider shadow-lg active:scale-95 transition-transform">
                Place Reorder
              </button>
              <button className="border border-white/30 h-[44px] px-md rounded-full font-black text-label-caps uppercase tracking-wider hover:bg-white/10 transition-all">
                Export Selected
              </button>
              <button 
                onClick={() => setSelectedProducts([])}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out forwards;
          overflow: hidden;
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
