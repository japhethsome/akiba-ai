"use client";

import React from "react";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="h-16 bg-white border-b border-[#bccac1] flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4">
        <button className="material-symbols-outlined md:hidden text-[#3d4943] text-[24px]">
          menu
        </button>
        <h1 className="text-xl font-black text-[#171d1a]">{title}</h1>
        <div className="hidden md:flex items-center bg-[#f5fbf5] border border-[#bccac1] rounded-full px-3 py-1 gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#3d4943]">storefront</span>
          <span className="text-xs text-[#3d4943] uppercase font-black tracking-wider">Wanjiku General Store</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer group">
          <span className="material-symbols-outlined text-[#3d4943] group-hover:text-[#00694c] transition-colors">
            notifications_active
          </span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#ba1a1a] rounded-full flex items-center justify-center text-[10px] text-white font-black border-2 border-white">
            3
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#f5fbf5] border border-[#bccac1] px-3 py-1 rounded-full cursor-pointer hover:bg-[#eaefea] transition-colors">
          <span className="material-symbols-outlined text-[18px] text-[#3d4943]">globe</span>
          <span className="text-xs font-black text-[#171d1a]">EN</span>
        </div>

        <div className="w-9 h-9 rounded-full bg-[#008560] text-white font-black text-sm flex items-center justify-center shadow-sm">
          W
        </div>
      </div>
    </header>
  );
}
