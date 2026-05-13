"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  { icon: "inventory_2", label: "Products", href: "/inventory" },
  { icon: "point_of_sale", label: "Transactions", href: "/transactions" },
  { icon: "insights", label: "Forecasts", href: "/forecasts" },
  { icon: "local_shipping", label: "Suppliers", href: "/suppliers" },
  { icon: "bar_chart", label: "Reports", href: "/reports" },
  { icon: "auto_awesome", label: "AI Insights", href: "/ai-insights", isAi: true },
  { icon: "settings", label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[240px] flex-col z-[60]"
        style={{ background: "linear-gradient(180deg, #1a2e24 0%, #111c16 100%)" }}>

        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b gap-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(134,248,201,0.15)" }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: "#86f8c9" }}>account_balance_wallet</span>
          </div>
          <span className="font-black text-lg text-white">
            Akiba <span style={{ color: "#86f8c9" }}>AI</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 h-11 rounded-xl transition-all text-sm font-bold"
                style={isActive
                  ? { background: "#00694c", color: "white" }
                  : item.isAi
                  ? { color: "#958dff" }
                  : { color: "rgba(255,255,255,0.65)" }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.isAi && !isActive && (
                  <span className="ml-auto text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(149,141,255,0.2)", color: "#958dff" }}>AI</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="border-t p-4 flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
            style={{ background: "#008560", color: "#f5fff7" }}>W</div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm text-white font-bold truncate">Wanjiku M.</span>
            <span className="text-[10px] uppercase font-black tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Owner</span>
          </div>
          <button className="material-symbols-outlined text-[20px] transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#ba1a1a"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"}>
            logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#bccac1] flex justify-around items-center z-[100] px-2">
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 px-3 transition-colors"
              style={{ color: isActive ? "#00694c" : "#6d7a73" }}
            >
              <span className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className="text-[10px] font-black uppercase">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
        <Link
          href="/ai-insights"
          className="flex flex-col items-center gap-1 py-2 px-3 transition-colors"
          style={{ color: pathname === "/ai-insights" ? "#584fbc" : "#6d7a73" }}
        >
          <span className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: pathname === "/ai-insights" ? "'FILL' 1" : "'FILL' 0" }}>
            auto_awesome
          </span>
          <span className="text-[10px] font-black uppercase">AI</span>
        </Link>
      </nav>
    </>
  );
}
