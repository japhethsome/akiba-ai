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
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[240px] bg-inverse-surface text-inverse-on-surface flex-col z-[60]">
        <div className="h-[64px] flex items-center px-md border-b border-white/10 gap-sm">
          <span className="material-symbols-outlined text-primary-fixed text-[28px] fill-1">
            account_balance_wallet
          </span>
          <span className="text-primary-fixed font-bold text-[18px]">
            Akiba <span className="text-secondary-container">AI</span>
          </span>
        </div>

        <nav className="flex-1 py-lg px-xs space-y-base overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-md px-md h-[48px] rounded-xl cursor-pointer transition-all ${
                  isActive
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                    : item.isAi
                    ? "text-secondary-container hover:bg-white/10"
                    : "text-inverse-on-surface/70 hover:bg-white/10 hover:text-inverse-on-surface"
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'fill-1' : ''} ${item.isAi && !isActive ? 'text-secondary-container' : ''}`}>
                  {item.icon}
                </span>
                <span className="font-body-md">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="user-profile border-t border-white/10 p-md flex items-center gap-sm mt-auto">
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
            W
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-body-md text-inverse-on-surface font-medium truncate">Wanjiku M.</span>
            <span className="text-[10px] text-inverse-on-surface/50 uppercase font-bold tracking-wider">Owner</span>
          </div>
          <button className="material-symbols-outlined text-inverse-on-surface/50 hover:text-error transition-colors">
            logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-surface border-t border-outline-variant flex justify-around items-center z-[100] px-xs">
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-sm px-md transition-colors ${
                isActive ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'fill-1' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold uppercase">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
        <Link
          href="/settings"
          className={`flex flex-col items-center gap-1 py-sm px-md transition-colors ${
            pathname === "/settings" ? "text-primary" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-bold uppercase">Me</span>
        </Link>
      </nav>
    </>
  );
}
