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
  { icon: "group", label: "Staff", href: "/dashboard/staff" },
  { icon: "bar_chart", label: "Reports", href: "/reports" },
  { icon: "auto_awesome", label: "AI Insights", href: "/ai-insights", isAi: true },
  { icon: "settings", label: "Settings", href: "/settings" },
];

export function Sidebar({ isCollapsed, setIsCollapsed }: { isCollapsed?: boolean, setIsCollapsed?: (val: boolean) => void }) {
  const pathname = usePathname();
  const collapsed = isCollapsed || false;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex fixed left-0 top-0 h-full flex-col z-[60] bg-white border-r border-[#e4eae4] transition-all duration-300 ${collapsed ? 'w-[80px]' : 'w-[240px]'}`}>

        {/* Brand */}
        <div className={`h-[72px] flex items-center px-6 border-b border-[#e4eae4] gap-3 ${collapsed ? 'justify-center px-0' : ''}`}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-[#00694c] to-[#00a87a] shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-white">account_balance_wallet</span>
          </div>
          {!collapsed && (
            <span className="font-black text-xl text-[#171d1a] tracking-tight">
              Akiba<span className="text-[#00a87a]">AI</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-4'} h-11 rounded-xl transition-all text-[13px] font-bold ${
                  isActive 
                    ? "bg-[#f0fdf4] text-[#00694c]" 
                    : item.isAi 
                    ? "text-[#584fbc] hover:bg-[#584fbc]/5" 
                    : "text-[#6d7a73] hover:bg-[#f8faf9] hover:text-[#171d1a]"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.isAi && !isActive && (
                  <span className="ml-auto text-[9px] font-black bg-[#584fbc]/10 text-[#584fbc] px-1.5 py-0.5 rounded-md uppercase tracking-wider">AI</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className={`border-t border-[#e4eae4] p-4 flex items-center gap-3 bg-[#f8faf9]/50 ${collapsed ? 'justify-center flex-col p-2 py-4' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#171d1a] to-[#3d4943] flex items-center justify-center font-black text-xs text-white flex-shrink-0 shadow-sm">A</div>
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[13px] text-[#171d1a] font-bold truncate">Akiba User</span>
              <span className="text-[10px] font-semibold text-[#6d7a73] uppercase tracking-wider">Owner</span>
            </div>
          )}
          <button className={`material-symbols-outlined text-[20px] text-[#bccac1] hover:text-[#ba1a1a] transition-colors p-1.5 rounded-lg hover:bg-[#ba1a1a]/5 ${collapsed ? 'mt-1' : ''}`} title="Logout">
            logout
          </button>
        </div>
        
        {/* Toggle Button */}
        {setIsCollapsed && (
            <button 
                onClick={() => setIsCollapsed(!collapsed)}
                className="absolute -right-3.5 top-7 w-7 h-7 bg-white border border-[#e4eae4] rounded-full flex items-center justify-center text-[#6d7a73] hover:text-[#00694c] shadow-sm transition-transform hover:scale-110 z-10"
            >
                <span className="material-symbols-outlined text-[16px]">{collapsed ? 'chevron_right' : 'chevron_left'}</span>
            </button>
        )}
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-white border-t border-[#e4eae4] flex justify-around items-center z-[100] px-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? "text-[#00694c]" : "text-[#6d7a73]"}`}
            >
              <span className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className="text-[9px] font-bold uppercase">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
        <Link
          href="/ai-insights"
          className="flex flex-col items-center justify-center w-full h-full gap-1 transition-colors text-[#584fbc]"
        >
          <span className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: pathname === "/ai-insights" ? "'FILL' 1" : "'FILL' 0" }}>
            auto_awesome
          </span>
          <span className="text-[9px] font-bold uppercase">AI</span>
        </Link>
      </nav>
    </>
  );
}
