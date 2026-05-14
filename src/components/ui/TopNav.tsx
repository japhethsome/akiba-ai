"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";

const navItems = [
  { label: "Home", href: "/dashboard" },
  { label: "Inventory", href: "/inventory" },
  { label: "Transactions", href: "/transactions" },
  { label: "Staff", href: "/dashboard/staff" },
  { label: "Forecasts", href: "/forecasts" },
  { label: "Reports", href: "/reports" },
];

export function TopNav() {
  const pathname = usePathname();

  const handleLogout = async () => {
     await logout();
  };

  return (
    <nav className="h-20 bg-white border-b border-[#e4eae4] px-10 flex items-center justify-between sticky top-0 z-[100] shadow-sm">
      <div className="flex items-center gap-12">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[12px] bg-gradient-to-tr from-[#171d1a] to-[#3d4943] flex items-center justify-center shadow-lg shadow-black/10">
            <span className="material-symbols-outlined text-[20px] text-white">account_balance_wallet</span>
          </div>
          <span className="font-black text-2xl text-[#171d1a] tracking-tighter">Akiba<span className="text-[#00a87a]">AI</span></span>
        </Link>

        {/* Links */}
        <div className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-5 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-300 ${
                  isActive 
                    ? "bg-[#171d1a] text-white shadow-xl shadow-black/10" 
                    : "text-[#6d7a73] hover:text-[#171d1a] hover:bg-[#f8faf9]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center bg-[#f8faf9] border border-[#e4eae4] rounded-[18px] px-4 h-12 w-72 group focus-within:border-[#00a87a] transition-all focus-within:bg-white focus-within:shadow-lg focus-within:shadow-[#00a87a]/5">
             <span className="material-symbols-outlined text-[#bccac1] text-[20px] group-focus-within:text-[#00a87a] transition-colors">search</span>
             <input 
                type="text" 
                placeholder="Search resources..." 
                className="bg-transparent border-none focus:ring-0 text-sm w-full font-medium text-[#171d1a] placeholder-[#bccac1]" 
             />
          </div>
          
          <div className="flex items-center gap-3">
             <button className="w-11 h-11 rounded-[16px] border border-[#e4eae4] flex items-center justify-center text-[#6d7a73] hover:text-[#171d1a] hover:bg-[#f8faf9] transition-all relative">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <div className="absolute top-3 right-3 w-2 h-2 bg-[#ba1a1a] rounded-full border-2 border-white" />
             </button>
             <button onClick={handleLogout} className="w-11 h-11 rounded-[16px] border border-[#e4eae4] flex items-center justify-center text-[#6d7a73] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/5 transition-all">
                <span className="material-symbols-outlined text-[22px]">logout</span>
             </button>
             <div className="w-11 h-11 rounded-[16px] bg-[#171d1a] flex items-center justify-center text-white font-black text-xs shadow-lg shadow-black/10 cursor-pointer hover:scale-105 transition-transform">
                A
             </div>
          </div>
      </div>
    </nav>
  );
}
