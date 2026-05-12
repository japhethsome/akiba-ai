"use client";

import React, { useEffect, useRef } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/topbar";
import Link from "next/link";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartData
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const kpis = [
  { label: "Total Products", value: "248", icon: "inventory_2", color: "text-primary", bg: "bg-primary/10", status: "NORMAL" },
  { label: "Low Stock Items", value: "12", icon: "warning", color: "text-error", bg: "bg-error/10", badge: "Needs attention", badgeBg: "bg-error-container", badgeText: "text-on-error-container", status: "OUT OF STOCK" },
  { label: "Today's Revenue", value: "18,450", icon: "payments", color: "text-tertiary", bg: "bg-tertiary/10", currency: "KES", trend: "↑ 12% vs yesterday", trendColor: "text-primary", status: "NORMAL" },
  { label: "Inventory Value", value: "284,000", icon: "account_balance", color: "text-secondary", bg: "bg-secondary/10", currency: "KES", status: "NORMAL" },
];

const inventoryData = [
  { name: "Unga wa Ngano 2kg", category: "Groceries", stock: 45, reorder: 20, price: 180, status: "IN STOCK" },
  { name: "Sugar 1kg", category: "Groceries", stock: 8, reorder: 15, price: 130, status: "LOW STOCK" },
  { name: "Cooking Oil 2L", category: "Groceries", stock: 0, reorder: 10, price: 450, status: "OUT OF STOCK" },
  { name: "Maize Flour 2kg", category: "Groceries", stock: 120, reorder: 30, price: 160, status: "IN STOCK" },
  { name: "Nails 4-inch (1kg)", category: "Hardware", stock: 5, reorder: 10, price: 220, status: "LOW STOCK" },
  { name: "Wire Mesh 1m", category: "Hardware", stock: 32, reorder: 8, price: 850, status: "IN STOCK" },
  { name: "DAP Fertilizer 50kg", category: "Agro-vet", stock: 18, reorder: 5, price: 3200, status: "IN STOCK" },
  { name: "Broiler Feed 50kg", category: "Agro-vet", stock: 3, reorder: 5, price: 2800, status: "LOW STOCK" },
];

export default function DashboardPage() {
  const chartData: ChartData<"bar"> = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Sales",
        data: [12400, 9800, 15600, 11200, 18900, 22100, 16800],
        backgroundColor: "#00694c",
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        grid: {
          color: "#bccac1",
          drawTicks: false,
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 md:ml-[240px] flex flex-col min-w-0">
        <TopBar title="Dashboard" />
        
        <main className="flex-1 p-margin-mobile md:p-lg space-y-xl pb-24 md:pb-lg max-w-7xl mx-auto w-full">
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
            {kpis.map((kpi, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center mb-sm`}>
                  <span className={`material-symbols-outlined ${kpi.color}`}>{kpi.icon}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    {kpi.currency && <span className="text-on-surface-variant text-body-md font-bold">{kpi.currency}</span>}
                    <span className={`text-currency-display ${kpi.status === "OUT OF STOCK" ? "text-error" : "text-on-surface"}`}>{kpi.value}</span>
                  </div>
                  <span className="text-label-caps text-on-surface-variant font-bold uppercase">{kpi.label}</span>
                  {kpi.badge && (
                    <span className={`${kpi.badgeBg} ${kpi.badgeText} text-[10px] font-black uppercase px-xs py-base rounded-full mt-xs inline-block w-fit`}>
                      {kpi.badge}
                    </span>
                  )}
                  {kpi.trend && <span className={`${kpi.trendColor} text-label-caps font-bold mt-1`}>{kpi.trend}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* SALES CHART */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm">
            <div className="flex justify-between items-center mb-md">
              <h2 className="text-h2 font-black text-on-surface">Sales This Week</h2>
              <div className="flex gap-xs bg-surface-container p-1 rounded-full">
                <button className="bg-primary text-on-primary px-sm py-base rounded-full text-label-caps font-bold">7D</button>
                <button className="text-on-surface-variant px-sm py-base rounded-full text-label-caps font-bold hover:bg-surface-container-high transition-colors">30D</button>
                <button className="text-on-surface-variant px-sm py-base rounded-full text-label-caps font-bold hover:bg-surface-container-high transition-colors">3M</button>
              </div>
            </div>
            <div className="h-[240px] md:h-[300px] w-full">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* INVENTORY TABLE */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-md border-b border-outline-variant bg-surface-container-low/30">
              <h2 className="text-h2 font-black text-on-surface">Inventory</h2>
              <div className="flex gap-sm">
                <div className="relative hidden sm:block">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                  <input type="text" placeholder="Search products..." className="h-[40px] pl-10 pr-md bg-surface-container-low rounded-xl border border-outline-variant font-body-md focus:border-primary outline-none transition-all w-48 focus:w-64" />
                </div>
                <button className="h-[40px] px-md bg-primary text-on-primary rounded-xl font-bold text-label-caps flex items-center gap-xs active:scale-95 transition-transform shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Product
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {/* Table Headers (Desktop) */}
              <div className="hidden md:grid grid-cols-6 px-md py-sm bg-surface-container-high border-b border-outline-variant text-label-caps text-on-surface-variant font-black tracking-wider uppercase">
                <span>Product</span>
                <span>Category</span>
                <span>Stock</span>
                <span>Reorder Point</span>
                <span>Unit Price</span>
                <span className="text-right">Status</span>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-outline-variant">
                {inventoryData.map((item, i) => (
                  <div key={i} className="md:grid md:grid-cols-6 px-md py-md md:py-sm items-center hover:bg-surface-container transition-colors cursor-pointer group">
                    <div className="flex justify-between md:block items-center mb-1 md:mb-0">
                      <span className="font-bold text-on-surface md:text-body-md">{item.name}</span>
                      <div className="md:hidden">
                        {item.status === "IN STOCK" && <span className="bg-primary/10 text-primary rounded-full px-xs py-base text-[10px] font-black uppercase">IN STOCK</span>}
                        {item.status === "LOW STOCK" && <span className="bg-tertiary-container/20 text-tertiary rounded-full px-xs py-base text-[10px] font-black uppercase">LOW STOCK</span>}
                        {item.status === "OUT OF STOCK" && <span className="bg-error-container text-on-error-container rounded-full px-xs py-base text-[10px] font-black uppercase">OUT OF STOCK</span>}
                      </div>
                    </div>
                    <span className="hidden md:block text-body-md text-on-surface-variant">{item.category}</span>
                    <div className="flex justify-between md:block items-center">
                      <span className="md:hidden text-label-caps text-on-surface-variant font-bold uppercase">Stock</span>
                      <span className={`text-body-md ${item.stock <= item.reorder ? 'text-error font-bold' : 'text-on-surface'}`}>{item.stock}</span>
                    </div>
                    <div className="flex justify-between md:block items-center">
                      <span className="md:hidden text-label-caps text-on-surface-variant font-bold uppercase">Reorder At</span>
                      <span className="text-body-md text-on-surface-variant">{item.reorder}</span>
                    </div>
                    <div className="flex justify-between md:block items-center">
                      <span className="md:hidden text-label-caps text-on-surface-variant font-bold uppercase">Unit Price</span>
                      <span className="text-body-md font-bold text-on-surface">KES {item.price}</span>
                    </div>
                    <div className="hidden md:flex justify-end items-center gap-md">
                      <div className="opacity-0 group-hover:opacity-100 flex gap-xs transition-opacity">
                        <button className="material-symbols-outlined text-on-surface-variant hover:text-primary p-1">edit</button>
                        <button className="material-symbols-outlined text-on-surface-variant hover:text-error p-1">delete</button>
                      </div>
                      {item.status === "IN STOCK" && <span className="bg-primary/10 text-primary rounded-full px-xs py-base text-[10px] font-black uppercase">IN STOCK</span>}
                      {item.status === "LOW STOCK" && <span className="bg-tertiary-container/20 text-tertiary rounded-full px-xs py-base text-[10px] font-black uppercase">LOW STOCK</span>}
                      {item.status === "OUT OF STOCK" && <span className="bg-error-container text-on-error-container rounded-full px-xs py-base text-[10px] font-black uppercase">OUT OF STOCK</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center px-md py-sm bg-surface-container-high/50 border-t border-outline-variant">
              <span className="text-body-md text-on-surface-variant font-medium">Showing 8 of 248 products</span>
              <div className="flex items-center gap-sm">
                <button className="material-symbols-outlined text-on-surface-variant hover:text-primary disabled:opacity-30" disabled>chevron_left</button>
                <span className="text-label-caps font-bold text-on-surface">1 / 31</span>
                <button className="material-symbols-outlined text-on-surface-variant hover:text-primary">chevron_right</button>
              </div>
            </div>
          </div>

          {/* AI INSIGHTS STRIP */}
          <div className="ai-purple-tint rounded-xl p-md flex flex-col md:flex-row items-center gap-md justify-between shadow-sm">
            <div className="flex items-center gap-md">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-on-secondary shadow-sm">
                <span className="material-symbols-outlined fill-1">auto_awesome</span>
              </div>
              <p className="text-body-md text-on-surface font-medium">
                ✨ <span className="text-secondary font-bold">AI Analysis:</span> You have 3 reorder recommendations ready based on your sales this week.
              </p>
            </div>
            <Link href="/forecasts" className="bg-secondary text-on-secondary h-[40px] px-md rounded-xl font-bold text-label-caps flex items-center justify-center active:scale-95 transition-transform w-full md:w-auto shadow-sm">
              View Recommendations
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
