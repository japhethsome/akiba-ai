"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5fbf5]">

      {/* TOP APP BAR */}
      <header className={`fixed top-0 left-0 right-0 h-16 z-[100] transition-all duration-300 border-b border-[#bccac1] bg-[#f5fbf5] ${scrolled ? "shadow-md" : ""}`}>
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4 md:px-6">
          <span className="text-2xl font-black text-[#00694c]">Akiba <span className="text-[#584fbc]">AI</span></span>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-[#00694c] font-bold text-sm">Home</Link>
            <Link href="#features" className="text-[#3d4943] hover:text-[#00694c] transition-colors text-sm">Features</Link>
            <Link href="#pricing" className="text-[#3d4943] hover:text-[#00694c] transition-colors text-sm">Pricing</Link>
          </nav>
          <div className="relative">
            <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="flex items-center gap-1 rounded-lg hover:bg-[#eaefea] px-2 py-1 cursor-pointer">
              <span className="material-symbols-outlined text-[#3d4943] text-[20px]">globe</span>
              <span className="text-xs text-[#3d4943] font-bold">English</span>
              <span className="material-symbols-outlined text-[#3d4943] text-[20px]">expand_more</span>
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-[#bccac1] rounded-xl shadow-lg p-1 flex flex-col gap-1 z-[110]">
                <button className="px-3 py-1 text-xs text-[#00694c] bg-[#eaefea] rounded-lg text-left font-bold">English</button>
                <button className="px-3 py-1 text-xs text-[#3d4943] hover:bg-[#eaefea] rounded-lg text-left">Kiswahili</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-28 pb-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-block bg-[#958dff] text-[#2b1c8f] text-xs px-4 py-1.5 rounded-full mb-4 font-bold uppercase tracking-wider">
              AI-POWERED INVENTORY
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4 text-[#171d1a]">
              Your Business. <span className="text-[#00694c]">Smarter.</span> Stronger.
            </h1>
            <p className="text-base text-[#3d4943] mb-8 leading-relaxed w-full">
              Help SMEs in Uasin Gishu never run out of stock, never lose sales,
              and always know what to reorder — in English or Kiswahili.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth" className="bg-[#00694c] text-white h-12 px-6 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm">
                Start Your Free Trial
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
              <button className="bg-[#e4eae4] text-[#171d1a] h-12 px-6 rounded-xl font-bold active:scale-[0.98] transition-transform">
                Watch Demo
              </button>
            </div>
          </div>
          <div className="relative mt-8 md:mt-0">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#68dbae]/20 rounded-full blur-3xl"></div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#bccac1] aspect-video bg-[#e4eae4] flex items-center justify-center">
              <span className="material-symbols-outlined text-[80px] text-[#00694c]/30">storefront</span>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-[#bccac1] flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#008560] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#f5fff7] text-[24px]">trending_up</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#3d4943] font-bold uppercase tracking-wider">Daily Sales</span>
                <span className="text-2xl font-black text-[#171d1a]"><span className="text-sm text-[#3d4943] font-bold mr-1">KES</span>42,500</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-16 px-4 md:px-6 bg-[#eff5ef]/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="text-xs text-[#584fbc] font-black mb-2 block uppercase tracking-widest">THE CHALLENGE</span>
            <h2 className="text-3xl font-black text-[#171d1a] mb-4">Running a shop shouldn&apos;t feel like guesswork</h2>
            <p className="text-sm text-[#3d4943] leading-relaxed">Most SMEs in Kenya manage inventory with notebooks and gut feeling. That costs them money every single day.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: "inventory", color: "text-[#ba1a1a]", bg: "bg-[#ba1a1a]/10", title: "Capital Trapped in Dead Stock", desc: "Ordering by intuition means slow-moving goods pile up, tying up cash that could restock fast-sellers." },
              { icon: "remove_shopping_cart", color: "text-[#805200]", bg: "bg-[#805200]/10", title: "Stockouts Kill Daily Revenue", desc: "Fast-moving items run out before you notice. Every empty shelf is a customer walking to your competitor." },
              { icon: "visibility_off", color: "text-[#584fbc]", bg: "bg-[#584fbc]/10", title: "No Clarity on Real Profit", desc: "Cash in the till ≠ profit. Without P&L visibility, owners can't tell if the business is actually growing." },
            ].map((c, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-[#bccac1] shadow-sm hover:border-[#00694c] transition-colors group">
                <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center ${c.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined">{c.icon}</span>
                </div>
                <h3 className="text-base font-bold text-[#171d1a] mb-2">{c.title}</h3>
                <p className="text-sm text-[#3d4943] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENTO GRID FEATURES */}
      <section id="features" className="py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-[#171d1a] mb-8">Built for Kenyan SME Growth</h2>
          <div className="grid md:grid-cols-12 gap-4">
            {/* Bento 1 */}
            <div className="md:col-span-8 bg-[#eff5ef] p-6 rounded-xl border border-[#bccac1] hover:border-[#00694c] transition-colors group relative overflow-hidden">
              <div className="w-10 h-10 bg-[#00694c]/10 rounded-lg flex items-center justify-center text-[#00694c] mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <h3 className="text-base font-bold text-[#171d1a] mb-2">Real-Time Inventory Tracking</h3>
              <p className="text-sm text-[#3d4943] leading-relaxed max-w-sm">Track every unit across your store with automated low-stock alerts. Any change, anywhere, syncs instantly.</p>
              <div className="hidden sm:block absolute top-4 right-4 space-y-2">
                <div className="bg-white p-2 rounded-lg border border-[#bccac1] flex items-center gap-2 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse"></div>
                  <span className="text-[11px] text-[#3d4943] font-medium">Low Stock: Unga wa Ngano</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#bccac1] flex items-center gap-2 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#00694c]"></div>
                  <span className="text-[11px] text-[#3d4943] font-medium">Restocked: Sugar 1kg</span>
                </div>
              </div>
            </div>
            {/* Bento 2 */}
            <div className="md:col-span-4 bg-[#eff5ef] p-6 rounded-xl border border-[#bccac1] hover:border-[#584fbc] transition-colors group">
              <div className="w-10 h-10 bg-[#584fbc]/10 rounded-lg flex items-center justify-center text-[#584fbc] mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">qr_code_scanner</span>
              </div>
              <h3 className="text-base font-bold text-[#171d1a] mb-2">QR &amp; Barcode Scanning</h3>
              <p className="text-sm text-[#3d4943] leading-relaxed">Scan products to log stock instantly. No manual typing, no errors during busy hours.</p>
            </div>
            {/* Bento 3 - AI */}
            <div className="md:col-span-12 ai-purple-tint p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[#584fbc]" style={{fontVariationSettings:"'FILL' 1"}}>auto_awesome</span>
                  <span className="text-xs text-[#584fbc] font-black uppercase tracking-widest">AI INSIGHT</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-[#171d1a] mb-3 leading-tight">Never miss a Friday rush again.</h2>
                <p className="text-sm text-[#3d4943] max-w-xl mb-6 leading-relaxed">
                  Our AI analyzes your local trends and predicts that <span className="font-bold text-[#171d1a]">Rice and Sugar</span> demand will increase by 25% this weekend based on your last 30 days of sales data.
                </p>
                <button className="bg-[#584fbc] text-white h-12 px-6 rounded-xl font-bold flex items-center gap-2 active:scale-[0.98] transition-transform shadow-sm">
                  Generate Sales Forecast
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                </button>
              </div>
              <div className="w-full md:w-80 bg-white p-4 rounded-xl shadow-sm border border-[#bccac1] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#3d4943] font-bold uppercase tracking-wider">Recommended Restock</span>
                  <span className="text-[#00694c] font-black text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings:"'FILL' 1"}}>auto_awesome</span>AI Best Match
                  </span>
                </div>
                {[["Sugar 1kg","150 Units"],["Unga wa Ngano 2kg","80 Units"],["Cooking Oil 2L","45 Units"]].map(([name,qty])=>(
                  <div key={name} className="flex justify-between items-center py-2 border-b border-[#bccac1] last:border-0">
                    <span className="text-sm text-[#171d1a]">{name}</span>
                    <span className="text-sm font-black text-[#171d1a]">{qty}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#bccac1] flex justify-between items-center">
                  <span className="text-xs text-[#3d4943] font-bold uppercase tracking-wider">Estimated Cost</span>
                  <span className="text-xl font-black text-[#171d1a]"><span className="text-sm text-[#3d4943] font-bold mr-1">KES</span>32,400</span>
                </div>
              </div>
            </div>
            {/* Bentos 4-6 */}
            {[
              { col: 4, icon: "wifi_off", color: "text-[#00694c]", bg: "bg-[#00694c]/10", border: "hover:border-[#00694c]", title: "Works Without Internet", desc: "Built as a Progressive Web App. Record sales and update stock even when your network is unstable or down." },
              { col: 4, icon: "translate", color: "text-[#805200]", bg: "bg-[#805200]/10", border: "hover:border-[#805200]", title: "English & Kiswahili", desc: "AI summaries and alerts in the language you're most comfortable with. Tumia lugha yako." },
              { col: 4, icon: "bar_chart", color: "text-[#584fbc]", bg: "bg-[#584fbc]/10", border: "hover:border-[#584fbc]", title: "Plain-Language P&L Reports", desc: "See your profit and loss explained in simple terms. Know if your business made or lost money this week." },
            ].map((b, i) => (
              <div key={i} className={`md:col-span-${b.col} bg-[#eff5ef] p-6 rounded-xl border border-[#bccac1] ${b.border} transition-colors group`}>
                <div className={`w-10 h-10 ${b.bg} rounded-lg flex items-center justify-center ${b.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined">{b.icon}</span>
                </div>
                <h3 className="text-base font-bold text-[#171d1a] mb-2">{b.title}</h3>
                <p className="text-sm text-[#3d4943] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 px-4 md:px-6 bg-[#eff5ef]/60">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-[#171d1a] text-center mb-12">From guesswork to clarity in 3 steps</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { n: "1", icon: "add_box", color: "text-[#00694c]", bg: "bg-[#00694c]", title: "Add Your Products", desc: "Digitize your current inventory in minutes. Scan barcodes or type manually — one product at a time." },
              { n: "2", icon: "point_of_sale", color: "text-[#584fbc]", bg: "bg-[#584fbc]", title: "Record Daily Sales", desc: "Your clerk logs each sale. Stock levels drop automatically. No more end-of-day stocktaking errors." },
              { n: "3", icon: "auto_awesome", color: "text-[#584fbc]", bg: "bg-[#584fbc]", title: "Get AI Insights", desc: "The system forecasts what you'll need, flags slow movers, and explains your finances in plain language." },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className={`w-12 h-12 ${s.bg} text-white rounded-full font-black flex items-center justify-center mb-4 shadow-lg text-lg`}>{s.n}</div>
                <span className={`material-symbols-outlined ${s.color} text-[48px] mb-4`}>{s.icon}</span>
                <h3 className="text-base font-bold text-[#171d1a] mb-2">{s.title}</h3>
                <p className="text-sm text-[#3d4943] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-[#171d1a] text-center mb-12">Trusted by SMEs across Uasin Gishu</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { quote: "Akiba AI showed me I was over-ordering cooking oil every month. I saved over KES 8,000 in the first two weeks.", name: "Wanjiku M.", role: "Mini-Mart Owner, Eldoret" },
              { quote: "The AI told me to restock unga before the end-month rush. I didn't run out for the first time in 3 months.", name: "Kipchoge A.", role: "Hardware Store, Turbo" },
              { quote: "Nilikuwa natumia daftari tu. Sasa ninaona faida yangu kila siku. Mfumo huu ni wa bei nafuu sana.", name: "Aisha O.", role: "Agro-vet, Kapsabet" },
            ].map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-[#bccac1] shadow-sm flex flex-col">
                <div className="text-[#a16900] flex gap-1 mb-4 text-lg">★★★★★</div>
                <p className="text-base text-[#171d1a] italic flex-1 mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#008560] flex items-center justify-center text-[#f5fff7] font-black">{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-[#171d1a]">{t.name}</p>
                    <p className="text-xs text-[#3d4943] font-bold uppercase tracking-wider">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-16 px-4 md:px-6 bg-[#f5fbf5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#171d1a] mb-2">Simple, Affordable Pricing</h2>
            <p className="text-sm text-[#3d4943]">No hidden fees. No technical setup required. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-[#eff5ef] p-8 rounded-xl border border-[#bccac1] flex flex-col">
              <span className="text-xs text-[#00694c] font-black uppercase tracking-widest mb-4">FREE</span>
              <div className="mb-4">
                <span className="text-sm text-[#3d4943] font-bold">KES</span>
                <span className="text-4xl font-black text-[#171d1a] ml-1">0</span>
                <span className="text-sm text-[#3d4943] font-bold ml-1">/ month</span>
              </div>
              <p className="text-sm text-[#3d4943] leading-relaxed flex-1 mb-8">
                Get started at no cost with support for up to 50 products, basic daily sales logging, and automated low-stock alerts. Available in both English and Kiswahili so your whole team can use it comfortably from day one.
              </p>
              <button className="bg-[#e4eae4] text-[#171d1a] h-12 w-full rounded-xl font-bold active:scale-[0.98] transition-transform">Get Started Free</button>
            </div>
            <div className="bg-[#008560] text-[#f5fff7] p-8 rounded-xl border-2 border-[#00694c] relative overflow-hidden flex flex-col">
              <div className="absolute top-4 right-4 bg-[#00694c] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Most Popular</div>
              <span className="text-xs font-black uppercase tracking-widest mb-4 opacity-80">PRO</span>
              <div className="mb-4">
                <span className="text-sm font-bold opacity-70">KES</span>
                <span className="text-4xl font-black ml-1">999</span>
                <span className="text-sm font-bold ml-1 opacity-70">/ month</span>
              </div>
              <p className="text-sm opacity-90 leading-relaxed flex-1 mb-8">
                Unlock the full power of Akiba AI with unlimited products, AI-driven demand forecasting, and plain-language P&amp;L reports. Includes a bilingual AI chatbot, multi-user access, full offline PWA capability, and supplier management — everything you need to scale with confidence.
              </p>
              <button className="bg-[#f5fff7] text-[#00694c] h-12 w-full rounded-xl font-black text-lg active:scale-[0.98] transition-transform">Start 14-Day Free Trial</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto bg-[#008560] text-[#f5fff7] p-10 rounded-[32px] relative overflow-hidden">
          <span className="material-symbols-outlined absolute top-4 right-4 text-[120px] opacity-10 rotate-12">rocket_launch</span>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-black leading-tight mb-4">Ready to grow your SME smarter?</h2>
            <p className="text-base mb-8 opacity-90 leading-relaxed">Join 500+ Kenyan businesses using Akiba AI to automate inventory and understand their finances.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth" className="bg-[#f5fff7] text-[#00694c] h-12 px-8 rounded-xl font-black flex items-center justify-center active:scale-[0.98] transition-transform shadow-lg">Start Your Free Trial</Link>
              <button className="border-2 border-[#f5fff7] text-[#f5fff7] h-12 px-8 rounded-xl font-black active:scale-[0.98] transition-transform">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#2c322e] text-[#dee4de] py-12 px-4 md:px-6 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <span className="text-2xl font-black text-[#86f8c9] mb-3 block">Akiba <span className="text-[#958dff]">AI</span></span>
              <p className="text-sm opacity-70 mb-4 leading-relaxed">Smart inventory for the modern Kenyan business.</p>
              <div className="flex gap-4">
                <span className="material-symbols-outlined cursor-pointer hover:text-[#86f8c9] transition-colors">social_leaderboard</span>
                <span className="material-symbols-outlined cursor-pointer hover:text-[#86f8c9] transition-colors">alternate_email</span>
              </div>
            </div>
            {[
              { title: "Product", links: ["Features", "Inventory", "Forecasting", "AI Insights"] },
              { title: "Support", links: ["Help Center", "Kiswahili Guide", "Contact Us"] },
              { title: "Company", links: ["About", "Privacy Policy", "Terms of Service"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-black text-[#ecf2ed] mb-4 uppercase text-xs tracking-widest">{col.title}</h4>
                <ul className="space-y-2 text-sm opacity-70">
                  {col.links.map(l => <li key={l} className="hover:opacity-100 cursor-pointer transition-opacity">{l}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-xs opacity-40 uppercase tracking-widest">&copy; 2025 Akiba AI. Secure &amp; Encrypted.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}
