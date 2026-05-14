"use client";
import React from "react";
import { TopNav } from "./TopNav";
import { MobileNav } from "./MobileNav";

export function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8faf9] text-[#171d1a] font-sans selection:bg-[#00a87a]/20 relative">
      <TopNav />
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0">
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
