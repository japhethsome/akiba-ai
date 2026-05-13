"use client";

import React from "react";
import Link from "next/link";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartData } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Sidebar } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/topbar";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const kpis = [
  { label: "Total Products", value: "248", icon: "inventory_2", iconColor: "#00694c", iconBg: "rgba(0,105,76,0.1)" },
  { label: "Low Stock Items", value: "12", icon: "warning", iconColor: "#ba1a1a", iconBg: "rgba(186,26,26,0.1)", badge: "Needs attention", badgeStyle: { background: "#ffdad6", color: "#410002" } },
  { label: "Today's Revenue", value: "18,450", icon: "payments", iconColor: "#805200", iconBg: "rgba(128,82,0,0.1)", currency: "KES", trend: "↑ 12% vs yesterday", trendColor: "#00694c" },
  { label: "Inventory Value", value: "284,000", icon: "account_balance", iconColor: "#584fbc", iconBg: "rgba(88,79,188,0.1)", currency: "KES" },
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    "IN STOCK": { background: "rgba(0,105,76,0.1)", color: "#00694c" },
    "LOW STOCK": { background: "rgba(128,82,0,0.12)", color: "#805200" },
    "OUT OF STOCK": { background: "#ffdad6", color: "#410002" },
  };
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
      style={styles[status] ?? {}}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const chartData: ChartData<"bar"> = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{
      label: "Sales (KES)",
      data: [12400, 9800, 15600, 11200, 18900, 22100, 16800],
      backgroundColor: "#00694c",
      borderRadius: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: "#bccac1" }, border: { display: false } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#f5fbf5" }}>
      <Sidebar />

      <div className="flex-1 md:ml-[240px] flex flex-col min-w-0">
        <TopBar title="Dashboard" />

        <main className="flex-1 p-4 md:p-6 space-y-5 pb-24 md:pb-6 max-w-7xl mx-auto w-full">

          {/* KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-[#bccac1] shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: kpi.iconBg }}>
                  <span className="material-symbols-outlined text-[22px]" style={{ color: kpi.iconColor }}>{kpi.icon}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-1">
                    {kpi.currency && <span className="text-xs text-[#3d4943] font-bold">{kpi.currency}</span>}
                    <span className="text-2xl font-black text-[#171d1a] leading-none">{kpi.value}</span>
                  </div>
                  <span className="text-[10px] text-[#6d7a73] font-black uppercase tracking-wider">{kpi.label}</span>
                  {kpi.badge && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full mt-1 w-fit"
                      style={kpi.badgeStyle}>{kpi.badge}</span>
                  )}
                  {kpi.trend && (
                    <span className="text-[11px] font-black mt-1" style={{ color: kpi.trendColor }}>{kpi.trend}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* SALES CHART */}
          <div className="bg-white rounded-xl p-4 md:p-5 border border-[#bccac1] shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black text-[#171d1a]">Sales This Week</h2>
              <div className="flex gap-1 bg-[#f5fbf5] p-1 rounded-full border border-[#bccac1]">
                {["7D", "30D", "3M"].map((p, i) => (
                  <button key={p} className="px-3 py-1 rounded-full text-xs font-black transition-all"
                    style={i === 0
                      ? { background: "#00694c", color: "white" }
                      : { color: "#6d7a73" }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-56 md:h-72 w-full">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* INVENTORY TABLE */}
          <div className="bg-white rounded-xl border border-[#bccac1] shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#bccac1]">
              <h2 className="text-lg font-black text-[#171d1a]">Inventory</h2>
              <div className="flex gap-2">
                <div className="relative hidden sm:block">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#6d7a73]">search</span>
                  <input type="text" placeholder="Search products…"
                    className="h-10 pl-9 pr-4 bg-[#f5fbf5] rounded-xl border border-[#bccac1] text-sm focus:border-[#00694c] outline-none transition-all w-44 focus:w-60" />
                </div>
                <button className="h-10 px-4 bg-[#00694c] text-white rounded-xl font-black text-xs flex items-center gap-2 active:scale-95 transition-transform shadow-sm hover:bg-[#005a40]">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Product
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <div className="hidden md:grid grid-cols-6 px-4 py-2 bg-[#f5fbf5] border-b border-[#bccac1] text-[10px] text-[#6d7a73] font-black tracking-widest uppercase">
                <span>Product</span>
                <span>Category</span>
                <span>Stock</span>
                <span>Reorder Pt</span>
                <span>Unit Price</span>
                <span className="text-right">Status</span>
              </div>

              <div className="divide-y divide-[#e4eae4]">
                {inventoryData.map((item, i) => (
                  <div key={i} className="md:grid md:grid-cols-6 px-4 py-3 md:py-2.5 items-center hover:bg-[#f5fbf5] transition-colors cursor-pointer group">
                    <div className="flex justify-between md:block items-center mb-1 md:mb-0">
                      <span className="text-sm font-bold text-[#171d1a]">{item.name}</span>
                      <div className="md:hidden"><StatusBadge status={item.status} /></div>
                    </div>
                    <span className="hidden md:block text-sm text-[#6d7a73]">{item.category}</span>
                    <div className="flex justify-between md:block items-center">
                      <span className="md:hidden text-[10px] text-[#6d7a73] font-black uppercase">Stock</span>
                      <span className="text-sm font-bold" style={{ color: item.stock <= item.reorder ? "#ba1a1a" : "#171d1a" }}>{item.stock}</span>
                    </div>
                    <div className="flex justify-between md:block items-center">
                      <span className="md:hidden text-[10px] text-[#6d7a73] font-black uppercase">Reorder At</span>
                      <span className="text-sm text-[#6d7a73]">{item.reorder}</span>
                    </div>
                    <div className="flex justify-between md:block items-center">
                      <span className="md:hidden text-[10px] text-[#6d7a73] font-black uppercase">Price</span>
                      <span className="text-sm font-black text-[#171d1a]">KES {item.price}</span>
                    </div>
                    <div className="hidden md:flex justify-end items-center gap-3">
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button className="material-symbols-outlined text-[18px] text-[#6d7a73] hover:text-[#00694c] p-1">edit</button>
                        <button className="material-symbols-outlined text-[18px] text-[#6d7a73] hover:text-[#ba1a1a] p-1">delete</button>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center px-4 py-2.5 bg-[#f5fbf5] border-t border-[#bccac1]">
              <span className="text-xs text-[#6d7a73]">Showing 8 of 248 products</span>
              <div className="flex items-center gap-2">
                <button className="material-symbols-outlined text-[20px] text-[#6d7a73] opacity-30 cursor-not-allowed">chevron_left</button>
                <span className="text-xs font-black text-[#171d1a]">1 / 31</span>
                <button className="material-symbols-outlined text-[20px] text-[#6d7a73] hover:text-[#00694c]">chevron_right</button>
              </div>
            </div>
          </div>

          {/* AI INSIGHTS STRIP */}
          <div className="rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between shadow-sm"
            style={{ background: "rgba(88,79,188,0.07)", borderLeft: "4px solid #584fbc" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#584fbc" }}>
                <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <p className="text-sm text-[#171d1a] font-medium">
                ✨ <span className="text-[#584fbc] font-black">AI Analysis:</span> You have 3 reorder recommendations ready based on your sales this week.
              </p>
            </div>
            <Link href="/forecasts"
              className="bg-[#584fbc] text-white h-10 px-5 rounded-xl font-black text-xs flex items-center justify-center active:scale-95 transition-transform w-full md:w-auto shadow-sm hover:bg-[#4a42a0] whitespace-nowrap">
              View Recommendations
            </Link>
          </div>

        </main>
      </div>
    </div>
  );
}
