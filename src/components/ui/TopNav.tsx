"use client";
import React, { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { searchAllResources, SearchResult, getNotifications } from "@/lib/actions/search";
import { hasPermission, Permission } from "@/lib/permissions";

const navItems: Array<{ label: string; href: string; permission: Permission | null }> = [
  { label: "Home", href: "/dashboard", permission: null },
  { label: "POS", href: "/dashboard/pos", permission: "pos" },
  { label: "Inventory", href: "/dashboard/inventory", permission: "inventory_view" },
  { label: "Suppliers", href: "/dashboard/suppliers", permission: "suppliers" },
  { label: "Transactions", href: "/transactions", permission: "transactions" },
  { label: "Staff", href: "/dashboard/staff", permission: "staff" },
  { label: "Forecasts", href: "/forecasts", permission: "reports" },
  { label: "Reports", href: "/reports", permission: "reports" },
];

export function TopNav({ userRole = "owner", userName = "", avatar = "" }: { userRole?: string; userName?: string; avatar?: string }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; content: string; created_at: string }>>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
     await logout();
  };

  // Fetch notifications on mount
  useEffect(() => {
    async function loadNotifications() {
      const res = await getNotifications();
      if (res.success && res.logs) {
        setNotifications(res.logs);
      }
    }
    loadNotifications();
  }, []);

  // Debounced search logic
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setIsDropdownOpen(false);
      return;
    }

    const delayDebounce = setTimeout(() => {
      startTransition(async () => {
        const res = await searchAllResources(query);
        if (res.data) {
          setResults(res.data);
          setIsDropdownOpen(true);
        } else {
          setResults(null);
        }
      });
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Parse log message safely
  function getLogMessage(log: { type: string; content: string }): string {
    try {
      const parsed = JSON.parse(log.content);
      if (typeof parsed === "object" && parsed !== null) {
        if (parsed.message) return parsed.message;
        if (parsed.content) return parsed.content;
        if (parsed.name && parsed.message) return `Contact from ${parsed.name}: ${parsed.message}`;
      }
    } catch (e) {
      // Not JSON, return directly
    }
    return log.content;
  }

  return (
    <nav className="h-20 bg-white border-b border-[#e4eae4] px-4 md:px-10 flex items-center justify-between fixed top-0 left-0 right-0 w-full z-[100] shadow-sm">
      <div className="flex items-center gap-4 md:gap-12">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
          <img
            src="/main.webp"
            alt="Akiba Yangu Logo"
            className="h-[56px] w-auto object-contain"
          />
        </Link>
 
        {/* Links */}
        <div className="hidden lg:flex items-center gap-2">
          {navItems.filter(item => {
            if (item.permission === null) {
              return userRole === "owner";
            }
            return hasPermission(userRole, item.permission);
          }).map((item) => {
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
      <div className="flex items-center gap-2 sm:gap-6">
          {/* Search container */}
          <div ref={searchRef} className="relative hidden md:block">
            <div className="flex items-center bg-[#f8faf9] border border-[#e4eae4] rounded-[18px] px-4 h-12 w-72 group focus-within:border-[#00a87a] transition-all focus-within:bg-white focus-within:shadow-lg focus-within:shadow-[#00a87a]/5">
               <span className="material-symbols-outlined text-[#bccac1] text-[20px] group-focus-within:text-[#00a87a] transition-colors">
                 {isPending ? "sync" : "search"}
               </span>
               <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (query.trim().length >= 2) setIsDropdownOpen(true); }}
                  placeholder="Search resources..." 
                  className={`bg-transparent border-none focus:ring-0 text-sm w-full font-medium text-[#171d1a] placeholder-[#bccac1] focus:outline-none ${isPending ? "animate-pulse" : ""}`} 
               />
               {query && (
                 <button onClick={() => { setQuery(""); setResults(null); setIsDropdownOpen(false); }} className="text-[#bccac1] hover:text-[#171d1a] transition-colors p-1">
                   <span className="material-symbols-outlined text-[16px]">close</span>
                 </button>
               )}
            </div>

            {/* Floating Dropdown Results */}
            {isDropdownOpen && results && (
              <div className="absolute top-14 left-0 right-0 z-50 bg-white border border-[#e4eae4] rounded-[20px] shadow-2xl p-4 max-h-[350px] overflow-y-auto space-y-4 w-80">
                {/* 1. Pages & Tabs */}
                {results.pages.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-[#00694c] bg-[#f0fdf4] px-2.5 py-1 rounded-md inline-block mb-2">
                      Navigation & Tools
                    </h4>
                    <div className="space-y-1">
                      {results.pages.map((p, idx) => (
                        <Link 
                          key={idx} 
                          href={p.path} 
                          onClick={() => { setQuery(""); setIsDropdownOpen(false); }}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold text-[#3d4943] hover:text-[#171d1a] hover:bg-[#f8faf9] transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px] text-[#bccac1]">dashboard</span>
                          {p.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Products */}
                {results.products.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-[#584fbc] bg-[#f4f2ff] px-2.5 py-1 rounded-md inline-block mb-2">
                      Products
                    </h4>
                    <div className="space-y-1">
                      {results.products.map((p) => (
                        <Link 
                          key={p.id} 
                          href={p.path} 
                          onClick={() => { setQuery(""); setIsDropdownOpen(false); }}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-[#3d4943] hover:text-[#171d1a] hover:bg-[#f8faf9] transition-all"
                        >
                          <span className="flex items-center gap-2 overflow-hidden">
                            <span className="material-symbols-outlined text-[16px] text-[#bccac1]">inventory_2</span>
                            <span className="truncate">{p.name}</span>
                          </span>
                          <span className="text-[#00694c] font-black shrink-0 text-[10px]">KES {p.price}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Suppliers */}
                {results.suppliers.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md inline-block mb-2">
                      Suppliers
                    </h4>
                    <div className="space-y-1">
                      {results.suppliers.map((s) => (
                        <Link 
                          key={s.id} 
                          href={s.path} 
                          onClick={() => { setQuery(""); setIsDropdownOpen(false); }}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-[#3d4943] hover:text-[#171d1a] hover:bg-[#f8faf9] transition-all"
                        >
                          <span className="flex items-center gap-2 overflow-hidden">
                            <span className="material-symbols-outlined text-[16px] text-[#bccac1]">local_shipping</span>
                            <span className="truncate">{s.name}</span>
                          </span>
                          <span className="text-[#6d7a73] font-medium text-[9px] shrink-0">{s.contact}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Help Articles */}
                {results.help.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-[#6d7a73] bg-[#f0f3f1] px-2.5 py-1 rounded-md inline-block mb-2">
                      Help & FAQs
                    </h4>
                    <div className="space-y-1">
                      {results.help.map((h, idx) => (
                        <Link 
                          key={idx} 
                          href={h.path} 
                          onClick={() => { setQuery(""); setIsDropdownOpen(false); }}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold text-[#3d4943] hover:text-[#171d1a] hover:bg-[#f8faf9] transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px] text-[#bccac1]">help</span>
                          {h.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* No matching results fallback */}
                {results.pages.length === 0 && results.products.length === 0 && results.suppliers.length === 0 && results.help.length === 0 && (
                  <div className="text-center py-6">
                    <span className="material-symbols-outlined text-3xl text-[#bccac1] mb-1">search_off</span>
                    <p className="text-xs text-[#6d7a73] font-bold">No resources match search.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Notifications Bell */}
              <div ref={notificationsRef} className="relative">
                 <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`w-11 h-11 rounded-[16px] border flex items-center justify-center text-[#6d7a73] hover:text-[#171d1a] hover:bg-[#f8faf9] transition-all relative shrink-0 ${isNotificationsOpen ? "bg-[#f8faf9] border-[#bccac1]" : "border-[#e4eae4]"}`}
                 >
                    <span className="material-symbols-outlined text-[22px]">notifications</span>
                    {notifications.length > 0 && (
                      <div className="absolute top-3 right-3 w-2 h-2 bg-[#ba1a1a] rounded-full border-2 border-white" />
                    )}
                 </button>

                 {/* Notifications Dropdown */}
                 {isNotificationsOpen && (
                   <div className="absolute top-14 right-0 z-50 bg-white border border-[#e4eae4] rounded-[20px] shadow-2xl p-4 w-80 max-h-[420px] overflow-y-auto space-y-3">
                     <div className="flex items-center justify-between pb-2 border-b border-[#e4eae4]">
                       <span className="text-[11px] font-black uppercase tracking-wider text-[#171d1a]">System Alerts & Logs</span>
                       <span className="bg-[#00a87a]/15 text-[#00a87a] text-[9px] font-black px-2 py-0.5 rounded-full">
                         {notifications.length} alerts
                       </span>
                     </div>
                     
                     {notifications.length === 0 ? (
                       <div className="py-8 text-center text-xs text-[#6d7a73] font-bold">
                         <span className="material-symbols-outlined text-2xl text-[#bccac1] mb-1">notifications_off</span>
                         <p>All quiet! No notifications yet.</p>
                       </div>
                     ) : (
                       <div className="space-y-2.5">
                         {notifications.map((log) => {
                           const message = getLogMessage(log);
                           let typeColor = "text-[#6d7a73] bg-[#f0f3f1]";
                           let icon = "notifications";
                           
                           if (log.type === "LOW_STOCK_ALERT") {
                             typeColor = "text-rose-700 bg-rose-50 border border-rose-100";
                             icon = "warning";
                           } else if (log.type === "AI_INVENTORY_REPORT") {
                             typeColor = "text-[#584fbc] bg-[#f4f2ff] border border-[#e8e4ff]";
                             icon = "auto_awesome";
                           } else if (log.type === "STORE_ONBOARDED") {
                             typeColor = "text-emerald-700 bg-emerald-50 border border-emerald-100";
                             icon = "storefront";
                           } else if (log.type === "CONTACT_FORM_SUBMISSION") {
                             typeColor = "text-sky-700 bg-sky-50 border border-sky-100";
                             icon = "mail";
                           }
                           
                           const dateStr = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
                                           " " + new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

                           return (
                             <div key={log.id} className={`p-3 rounded-xl flex gap-2.5 items-start ${typeColor} text-left transition-all hover:scale-[1.01]`}>
                               <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">{icon}</span>
                               <div className="min-w-0 flex-1">
                                 <p className="text-[11px] font-bold leading-relaxed break-words">{message}</p>
                                 <span className="text-[9px] opacity-60 font-medium block mt-1">{dateStr}</span>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     )}
                   </div>
                 )}
              </div>



              <Link href="/dashboard/settings" className="block shrink-0">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    className="w-11 h-11 rounded-[16px] object-cover shadow-lg shadow-black/10 cursor-pointer hover:scale-105 transition-transform border border-[#e4eae4]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-[16px] bg-[#171d1a] flex items-center justify-center text-white font-black text-xs shadow-lg shadow-black/10 cursor-pointer hover:scale-105 transition-transform uppercase">
                     {userName ? userName.charAt(0) : "A"}
                  </div>
                )}
              </Link>
          </div>
      </div>
    </nav>
  );
}
