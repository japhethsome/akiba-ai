"use client";

import React from "react";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="h-[64px] bg-surface border-b border-outline-variant flex items-center justify-between px-md sticky top-0 z-50">
      <div className="flex items-center gap-md">
        <button className="material-symbols-outlined md:hidden text-on-surface-variant">
          menu
        </button>
        <h1 className="hidden md:block text-h1 font-black text-on-surface">
          {title}
        </h1>
        <div className="hidden md:flex items-center bg-surface-container rounded-full px-sm py-base gap-xs">
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">storefront</span>
          <span className="font-label-caps text-on-surface-variant uppercase font-bold tracking-wider">
            Wanjiku General Store
          </span>
        </div>
      </div>

      <div className="flex items-center gap-md">
        <div className="relative cursor-pointer group">
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
            notifications_active
          </span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full flex items-center justify-center text-[10px] text-on-error font-bold border-2 border-surface">
            3
          </div>
        </div>
        
        <div className="flex items-center gap-xs bg-surface-container-low border border-outline-variant px-sm py-1 rounded-full cursor-pointer hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">globe</span>
          <span className="text-label-caps font-black text-on-surface">EN</span>
        </div>

        <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container font-black flex items-center justify-center shadow-sm">
          W
        </div>
      </div>
    </header>
  );
}
