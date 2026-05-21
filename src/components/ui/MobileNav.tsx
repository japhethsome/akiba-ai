"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { hasPermission, Permission } from "@/lib/permissions";

const mobileItems: Array<{ icon: string; label: string; href: string; permission: Permission | null }> = [
  { icon: "home", label: "Home", href: "/dashboard", permission: null },
  { icon: "point_of_sale", label: "POS", href: "/dashboard/pos", permission: "pos" },
  { icon: "inventory_2", label: "Stock", href: "/dashboard/inventory", permission: "inventory_view" },
  { icon: "receipt_long", label: "Sales", href: "/transactions", permission: "transactions" },
  { icon: "local_shipping", label: "Suppliers", href: "/dashboard/suppliers", permission: "suppliers" },
  { icon: "group", label: "Staff", href: "/dashboard/staff", permission: "staff" },
];

export function MobileNav({ userRole = "owner" }: { userRole?: string }) {
  const pathname = usePathname();
  const visibleItems = mobileItems.filter(item => {
    if (item.permission === null) {
      return userRole === "owner";
    }
    return hasPermission(userRole, item.permission);
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e4eae4] z-[100] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-[28px]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", height: "72px" }}
    >
      <div className="flex justify-around items-center h-full px-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative group"
            >
              {/* Active pill background */}
              {isActive && (
                <span className="absolute top-1 inset-x-1.5 h-8 bg-[#00694c]/10 rounded-2xl" />
              )}
              <span
                className={`material-symbols-outlined relative z-10 transition-all duration-200 ${
                  isActive ? "text-[#00694c] text-[22px]" : "text-[#a0b3a8] text-[20px]"
                }`}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className={`text-[8px] font-black uppercase tracking-tighter relative z-10 leading-none transition-colors duration-200 ${
                isActive ? "text-[#00694c]" : "text-[#a0b3a8]"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
