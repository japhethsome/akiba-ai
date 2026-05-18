"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export function DashboardClientUI({ userName, storeCategory, kpis, lowStockCount, priorityActions }: any) {
  React.useEffect(() => {
    // Single-tab session lock handling
    const tabId = Math.random().toString(36).substring(7);
    const sessionKey = "akiba_active_session";
    
    const checkSession = () => {
      const activeTab = localStorage.getItem(sessionKey);
      if (activeTab && activeTab !== tabId) {
        alert("Akiba AI is already open in another tab. Please use that tab or close it to continue here.");
        window.location.href = "/";
      } else {
        localStorage.setItem(sessionKey, tabId);
      }
    };

    checkSession();
    
    // Cleanup on close
    const handleUnload = () => {
      if (localStorage.getItem(sessionKey) === tabId) {
        localStorage.removeItem(sessionKey);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // Format the category string nicely
  const formattedCategory = storeCategory === "other" || !storeCategory 
    ? "shop" 
    : storeCategory.toLowerCase();

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      {/* MASSIVE HERO BENTO (Span 8) */}
      <motion.div variants={item} className="lg:col-span-8 bg-[#171d1a] rounded-[40px] p-8 lg:p-12 relative overflow-hidden text-white flex flex-col justify-between min-h-[380px] shadow-2xl shadow-black/10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00a87a]/15 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
           <h2 className="text-[56px] font-black mb-6 tracking-tighter leading-[0.95]">
              Hello, <span className="text-[#00a87a]">{userName}</span>.<br/>Your {formattedCategory} is thriving.
           </h2>
           <p className="text-[#bccac1] text-lg max-w-md font-medium leading-relaxed">
              DeepSeek AI has analyzed your recent sales. You have <span className="text-white font-bold border-b-2 border-[#00a87a]">{lowStockCount} critical restock actions</span> needed before the weekend rush.
           </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-4 mt-10">
           <Link href="/dashboard/inventory">
             <button className="bg-[#00a87a] text-[#171d1a] px-8 py-4 rounded-2xl font-black text-sm hover:scale-[1.03] active:scale-[0.98] transition-all shadow-xl shadow-[#00a87a]/20">
                Review Restocks
             </button>
           </Link>
           <button className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-white/20 transition-colors border border-white/10">
              View Full Analytics
           </button>
        </div>
      </motion.div>

      {/* AI INTELLIGENCE BENTO (Span 4) */}
      <motion.div variants={item} className="lg:col-span-4 bg-gradient-to-br from-[#584fbc] to-[#3a3385] rounded-[40px] p-10 relative overflow-hidden text-white flex flex-col shadow-2xl shadow-[#584fbc]/20 group">
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
         
         <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-xl">
            <span className="material-symbols-outlined text-[32px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
         </div>
         
         <h3 className="text-3xl font-black mb-3 tracking-tight">Intelligence Layer</h3>
         <p className="text-white/70 text-sm font-medium mb-8 leading-relaxed flex-1">
            Your DeepSeek AI requires full shop context. Complete the onboarding survey to unlock predictive ordering and automated insights.
         </p>
         
         <Link href="/dashboard/ai-survey" className="flex items-center justify-between bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 p-5 rounded-2xl transition-colors mt-auto">
            <span className="text-sm font-black uppercase tracking-wider text-white">Train AI Now</span>
            <span className="material-symbols-outlined text-white group-hover:translate-x-2 transition-transform">arrow_forward</span>
         </Link>
      </motion.div>

      {/* KPI GRID - 4 blocks spanning 3 cols each */}
      {kpis.map((kpi: any, i: number) => (
         <motion.div key={i} variants={item} className="lg:col-span-3 bg-white rounded-[32px] p-8 border border-[#e4eae4] hover:border-[#bccac1] transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-black/5 to-transparent rounded-bl-[100px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: `linear-gradient(to bottom left, ${kpi.color}20, transparent)` }} />
            
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-10 transition-transform duration-500 group-hover:rotate-[10deg] group-hover:scale-110 shadow-sm" style={{ background: kpi.bg }}>
               <span className="material-symbols-outlined text-[26px]" style={{ color: kpi.color }}>{kpi.icon}</span>
            </div>
            
            <div className="flex flex-col gap-1 relative z-10">
               <div className="text-[40px] font-black text-[#171d1a] tracking-tighter leading-none">{kpi.value}</div>
               <div className="text-[11px] font-black text-[#6d7a73] uppercase tracking-[0.2em]">{kpi.label}</div>
            </div>
         </motion.div>
      ))}

      {/* MODERN CHART (Span 8) */}
      <motion.div variants={item} className="lg:col-span-8 bg-white rounded-[40px] p-10 border border-[#e4eae4] flex flex-col shadow-sm">
         <div className="flex justify-between items-center mb-12">
            <div>
               <h3 className="text-2xl font-black text-[#171d1a] tracking-tight">Revenue Velocity</h3>
               <p className="text-xs font-bold text-[#6d7a73] uppercase tracking-widest mt-1">Gross sales over last 7 days</p>
            </div>
            <div className="flex gap-2 bg-[#f8faf9] p-1.5 rounded-2xl border border-[#e4eae4]">
               <button className="px-5 py-2.5 rounded-xl bg-white text-[11px] font-black text-[#171d1a] shadow-sm">7 Days</button>
               <button className="px-5 py-2.5 rounded-xl text-[11px] font-bold text-[#6d7a73] hover:text-[#171d1a] transition-colors">30 Days</button>
            </div>
         </div>
         <div className="flex-1 flex items-end gap-4 px-2 min-h-[200px]">
            {[40, 70, 45, 90, 65, 85, 75].map((h, i) => (
               <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="w-full bg-[#f8faf9] rounded-2xl relative overflow-hidden transition-all group-hover:bg-[#00a87a]/10" style={{ height: `${h}%` }}>
                     <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: "100%" }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.8, type: "spring", bounce: 0.4 }}
                        className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#00694c] to-[#00a87a]" 
                     />
                  </div>
                  <span className="text-[11px] font-black text-[#bccac1] uppercase group-hover:text-[#171d1a] transition-colors">Day {i+1}</span>
               </div>
            ))}
         </div>
      </motion.div>

      {/* QUICK ACTIONS / ALERTS (Span 4) */}
      <motion.div variants={item} className="lg:col-span-4 bg-white rounded-[40px] p-10 border border-[#e4eae4] flex flex-col shadow-sm">
         <h3 className="text-2xl font-black text-[#171d1a] mb-8 tracking-tight">Priority Actions</h3>
         <div className="space-y-4 flex-1">
            {priorityActions.length > 0 ? priorityActions.map((t: any, i: number) => (
               <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-[#e4eae4] bg-[#f8faf9] hover:bg-white hover:border-[#bccac1] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                     <span className="material-symbols-outlined text-[18px]" style={{ color: t.color }}>{t.icon}</span>
                     <span className="text-sm font-black text-[#171d1a] group-hover:translate-x-1 transition-transform max-w-[140px] truncate">{t.item}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg whitespace-nowrap" style={{ background: t.bg, color: t.color }}>{t.status}</span>
               </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#e4eae4] rounded-2xl">
                <span className="material-symbols-outlined text-[40px] text-[#00a87a] mb-4">check_circle</span>
                <p className="text-[#6d7a73] font-medium text-sm">All stock levels are healthy! No critical actions needed.</p>
              </div>
            )}
         </div>
         <Link href="/dashboard/inventory">
            <button className="w-full py-5 mt-6 bg-white border-2 border-dashed border-[#bccac1] rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-[#6d7a73] hover:border-[#00694c] hover:text-[#00694c] transition-all hover:bg-[#00694c]/5">
               View All Inventory
            </button>
         </Link>
      </motion.div>

    </motion.div>
  );
}
