"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileItems = [
  { icon: "home", label: "Home", href: "/dashboard" },
  { icon: "inventory_2", label: "Products", href: "/dashboard/inventory" },
  { icon: "group", label: "Staff", href: "/dashboard/staff" },
  { icon: "bar_chart", label: "Reports", href: "/reports" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-[#e4eae4] flex justify-around items-center z-[100] px-4 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] rounded-t-[32px]">
      {mobileItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${
              isActive ? "text-[#00694c] scale-110" : "text-[#bccac1]"
            }`}
          >
            <div className={`w-12 h-8 rounded-2xl flex items-center justify-center transition-colors ${isActive ? "bg-[#f0fdf4]" : ""}`}>
                <span className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
                </span>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
                {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
