"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

type Language = "en" | "sw";

const translations = {
  en: {
    nav: { home: "Home", features: "Features", pricing: "Pricing" },
    hero: {
      badge: "AI-POWERED INVENTORY",
      title1: "Your Business.",
      title2: "Smarter.",
      title3: "Stronger.",
      desc: "Help SMEs in Uasin Gishu never run out of stock, never lose sales, and always know what to reorder — in English or Kiswahili.",
      cta: "Start Your Free Trial",
      demo: "Watch Demo",
      salesLabel: "Daily Sales"
    },
    challenge: {
      badge: "THE CHALLENGE",
      title: "Running a shop shouldn't feel like guesswork",
      desc: "Most SMEs in Kenya manage inventory with notebooks and gut feeling. That costs them money every single day.",
      cards: [
        { title: "Capital Trapped in Dead Stock", desc: "Ordering by intuition means slow-moving goods pile up, tying up cash that could restock fast-sellers." },
        { title: "Stockouts Kill Daily Revenue", desc: "Fast-moving items run out before you notice. Every empty shelf is a customer walking to your competitor." },
        { title: "No Clarity on Real Profit", desc: "Cash in the till ≠ profit. Without P&L visibility, owners can't tell if the business is actually growing." }
      ]
    },
    features: {
      title: "Built for Kenyan SME Growth",
      bento1: { title: "Real-Time Inventory Tracking", desc: "Track every unit across your store with automated low-stock alerts. Any change, anywhere, syncs instantly.", alert1: "Low Stock: Wheat Flour", alert2: "Restocked: Sugar 1kg" },
      bento2: { title: "QR & Barcode Scanning", desc: "Scan products to log stock instantly. No manual typing, no errors during busy hours." },
      ai: {
        badge: "AI INSIGHT",
        title: "Never miss a Friday rush again.",
        desc: "Our AI analyzes your local trends and predicts that Rice and Sugar demand will increase by 25% this weekend.",
        cta: "Generate Sales Forecast",
        rec: "Recommended Restock",
        match: "AI Best Match",
        cost: "Estimated Cost"
      }
    }
  },
  sw: {
    nav: { home: "Mwanzo", features: "Vipengele", pricing: "Bei" },
    hero: {
      badge: "INVENTORI YA AI",
      title1: "Biashara Yako.",
      title2: "Werevu Zaidi.",
      title3: "Imara Zaidi.",
      desc: "Saidia biashara ndogo ndogo katika Uasin Gishu wasiishiwe na bidhaa, wasipoteze mauzo, na wajue cha kuagiza — kwa Kiingereza au Kiswahili.",
      cta: "Anza Jaribio la Bure",
      demo: "Tazama Maonyesho",
      salesLabel: "Mauzo ya Kila Siku"
    },
    challenge: {
      badge: "CHANGAMOTO",
      title: "Kuendesha duka kusiwe ni kubahatisha",
      desc: "Biashara nyingi nchini Kenya husimamia bidhaa kwa madaftari. Hiyo inawagharimu pesa kila siku.",
      cards: [
        { title: "Mtaji Umekwama kwa Bidhaa Zisizouzika", desc: "Kuagiza kwa hisia kunafanya bidhaa zisizouzika zirundikane, kukwama kwa pesa ambazo zingeweza kununua bidhaa zinazouzika haraka." },
        { title: "Kukosekana kwa Bidhaa Kunaua Mapato", desc: "Bidhaa zinazouzika haraka huisha kabla hujaona. Kila rafu tupu ni mteja anayekwenda kwa mshindani wako." },
        { title: "Hakuna Uwazi wa Faida Halisi", desc: "Pesa kwenye droo sio faida. Bila kuona P&L, wamiliki hawawezi kujua ikiwa biashara inakua kweli." }
      ]
    },
    features: {
      title: "Imeundwa kwa Ukuaji wa Biashara za Kenya",
      bento1: { title: "Ufuatiliaji wa Bidhaa kwa Wakati Halisi", desc: "Fuatilia kila bidhaa dukani mwako kwa arifa za kiotomatiki za bidhaa zinazoisha.", alert1: "Bidhaa Inapungua: Ngano", alert2: "Imeongezwa: Sukari 1kg" },
      bento2: { title: "Skanning ya QR na Barcode", desc: "Skani bidhaa ili kurekodi hisa papo hapo. Hakuna makosa wakati wa masaa yenye shughuli nyingi." },
      ai: {
        badge: "MAONI YA AI",
        title: "Usikose mauzo ya Ijumaa tena.",
        desc: "AI yetu inachanganua mienendo yako na kutabiri kwamba mahitaji ya Mchele na Sukari yataongezeka kwa 25% wikendi hii.",
        cta: "Tengeneza Utabiri wa Mauzo",
        rec: "Agizo Linalopendekezwa",
        match: "AI Inalingana Bora",
        cost: "Gharama Inayokadiriwa"
      }
    }
  }
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<Language>("en");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const t = translations[lang];

  return (
    <div className="flex flex-col min-h-screen bg-[#f5fbf5] overflow-x-hidden">

      {/* TOP APP BAR */}
      <header className={`fixed top-0 left-0 right-0 h-16 z-[100] transition-all duration-300 border-b border-[#bccac1] bg-[#f5fbf5]/80 backdrop-blur-md ${scrolled ? "shadow-md" : ""}`}>
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4 md:px-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-black text-[#00694c]"
          >
            Akiba <span className="text-[#584fbc]">AI</span>
          </motion.div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-[#00694c] font-bold text-sm">{t.nav.home}</Link>
            <Link href="#features" className="text-[#3d4943] hover:text-[#00694c] transition-colors text-sm">{t.nav.features}</Link>
            <Link href="#pricing" className="text-[#3d4943] hover:text-[#00694c] transition-colors text-sm">{t.nav.pricing}</Link>
          </nav>
          <div className="relative">
            <button onClick={() => setLangMenuOpen(!langMenuOpen)} className="flex items-center gap-1 rounded-lg hover:bg-[#eaefea] px-2 py-1 cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-[#3d4943] text-[20px]">globe</span>
              <span className="text-xs text-[#3d4943] font-bold uppercase">{lang === 'en' ? 'English' : 'Kiswahili'}</span>
              <motion.span 
                animate={{ rotate: langMenuOpen ? 180 : 0 }}
                className="material-symbols-outlined text-[#3d4943] text-[20px]"
              >
                expand_more
              </motion.span>
            </button>
            <AnimatePresence>
              {langMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-40 bg-white border border-[#bccac1] rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-[110]"
                >
                  <button onClick={() => { setLang('en'); setLangMenuOpen(false); }} className={`px-3 py-2 text-xs rounded-lg text-left font-bold transition-colors ${lang === 'en' ? 'bg-[#eaefea] text-[#00694c]' : 'text-[#3d4943] hover:bg-[#f5fbf5]'}`}>English</button>
                  <button onClick={() => { setLang('sw'); setLangMenuOpen(false); }} className={`px-3 py-2 text-xs rounded-lg text-left font-bold transition-colors ${lang === 'sw' ? 'bg-[#eaefea] text-[#00694c]' : 'text-[#3d4943] hover:bg-[#f5fbf5]'}`}>Kiswahili</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-4 md:px-6 overflow-hidden">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute top-20 right-0 w-96 h-96 bg-[#68dbae]/10 rounded-full blur-[100px] pointer-events-none"
        />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block bg-[#958dff] text-[#2b1c8f] text-[10px] px-4 py-1.5 rounded-full mb-6 font-black uppercase tracking-widest"
            >
              {t.hero.badge}
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6 text-[#171d1a]">
              {t.hero.title1} <span className="text-[#00694c]">{t.hero.title2}</span> {t.hero.title3}
            </h1>
            <p className="text-lg text-[#3d4943] mb-10 leading-relaxed max-w-xl">
              {t.hero.desc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth" className="bg-[#00694c] text-white h-14 px-8 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-[0.95] hover:scale-[1.02] transition-all shadow-lg hover:shadow-[#00694c]/20">
                {t.hero.cta}
                <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
              </Link>
              <button className="bg-white border-2 border-[#bccac1] text-[#171d1a] h-14 px-8 rounded-2xl font-black active:scale-[0.95] hover:bg-[#eff5ef] transition-all">
                {t.hero.demo}
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring" }}
            className="relative mt-12 md:mt-0 group perspective-1000"
          >
            <div className="absolute -top-12 -right-12 w-80 h-80 bg-[#584fbc]/5 rounded-full blur-[80px] group-hover:bg-[#584fbc]/10 transition-colors" />
            
            <motion.div 
              whileHover={{ rotateX: 5, rotateY: -5, scale: 1.02 }}
              className="relative rounded-[32px] overflow-hidden shadow-2xl border border-[#bccac1] aspect-square bg-white"
            >
              <Image 
                src="/hero.png" 
                alt="Kenyan Shop Owner" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#000]/40 to-transparent pointer-events-none" />
            </motion.div>

            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute -bottom-8 -left-8 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-[#bccac1] flex items-center gap-5"
            >
              <div className="w-14 h-14 rounded-full bg-[#008560] flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-[32px] fill-1">trending_up</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#3d4943] font-black uppercase tracking-widest opacity-60">{t.hero.salesLabel}</span>
                <span className="text-3xl font-black text-[#171d1a]"><span className="text-sm text-[#3d4943] font-bold mr-1">KES</span>42,500</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CHALLENGE SECTION */}
      <section className="py-24 px-4 md:px-6 bg-[#eff5ef]/40 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-[10px] text-[#584fbc] font-black mb-4 block uppercase tracking-[0.3em]"
            >
              {t.challenge.badge}
            </motion.span>
            <h2 className="text-4xl font-black text-[#171d1a] mb-6">{t.challenge.title}</h2>
            <p className="text-base text-[#3d4943] leading-relaxed opacity-80">{t.challenge.desc}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {t.challenge.cards.map((c, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-[24px] border border-[#bccac1] shadow-sm hover:border-[#00694c] hover:shadow-xl transition-all group"
              >
                <div className={`w-12 h-12 ${i === 0 ? 'bg-[#ba1a1a]/10 text-[#ba1a1a]' : i === 1 ? 'bg-[#805200]/10 text-[#805200]' : 'bg-[#584fbc]/10 text-[#584fbc]'} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                  <span className="material-symbols-outlined text-[28px]">{i === 0 ? 'inventory' : i === 1 ? 'remove_shopping_cart' : 'visibility_off'}</span>
                </div>
                <h3 className="text-lg font-black text-[#171d1a] mb-3">{c.title}</h3>
                <p className="text-sm text-[#3d4943] leading-relaxed opacity-70">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BENTO GRID FEATURES */}
      <section id="features" className="py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-4xl font-black text-[#171d1a] mb-12"
          >
            {t.features.title}
          </motion.h2>
          <div className="grid md:grid-cols-12 gap-6">
            {/* Bento 1 */}
            <motion.div 
              whileHover={{ scale: 0.99 }}
              className="md:col-span-8 bg-[#eff5ef] p-8 rounded-[32px] border border-[#bccac1] hover:border-[#00694c] transition-all group relative overflow-hidden min-h-[300px]"
            >
              <div className="w-12 h-12 bg-[#00694c]/10 rounded-xl flex items-center justify-center text-[#00694c] mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">inventory_2</span>
              </div>
              <h3 className="text-xl font-black text-[#171d1a] mb-3">{t.features.bento1.title}</h3>
              <p className="text-base text-[#3d4943] leading-relaxed max-w-sm opacity-80">{t.features.bento1.desc}</p>
              
              <div className="hidden sm:flex absolute top-8 right-8 flex-col gap-3">
                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white p-3 rounded-xl border border-[#bccac1] flex items-center gap-3 shadow-lg"
                >
                  <div className="w-3 h-3 rounded-full bg-[#ba1a1a] animate-pulse" />
                  <span className="text-[11px] text-[#3d4943] font-black uppercase tracking-wider">{t.features.bento1.alert1}</span>
                </motion.div>
                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white p-3 rounded-xl border border-[#bccac1] flex items-center gap-3 shadow-lg"
                >
                  <div className="w-3 h-3 rounded-full bg-[#00694c]" />
                  <span className="text-[11px] text-[#3d4943] font-black uppercase tracking-wider">{t.features.bento1.alert2}</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Bento 2 */}
            <motion.div 
              whileHover={{ rotateY: 10, scale: 1.02 }}
              className="md:col-span-4 bg-[#eff5ef] p-8 rounded-[32px] border border-[#bccac1] hover:border-[#584fbc] transition-all group flex flex-col justify-center perspective-1000"
            >
              <div className="w-12 h-12 bg-[#584fbc]/10 rounded-xl flex items-center justify-center text-[#584fbc] mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
              </div>
              <h3 className="text-xl font-black text-[#171d1a] mb-3">{t.features.bento2.title}</h3>
              <p className="text-base text-[#3d4943] leading-relaxed opacity-80">{t.features.bento2.desc}</p>
            </motion.div>

            {/* Bento 3 - AI */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="md:col-span-12 ai-purple-tint p-10 rounded-[40px] relative overflow-hidden flex flex-col md:flex-row gap-12"
            >
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-[#584fbc] text-[28px]" style={{fontVariationSettings:"'FILL' 1"}}>auto_awesome</span>
                  <span className="text-xs text-[#584fbc] font-black uppercase tracking-[0.3em]">{t.features.ai.badge}</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-[#171d1a] mb-6 leading-tight max-w-lg">{t.features.ai.title}</h2>
                <p className="text-lg text-[#3d4943] max-w-xl mb-10 leading-relaxed opacity-90">
                  {t.features.ai.desc}
                </p>
                <button className="bg-[#584fbc] text-white h-14 px-10 rounded-2xl font-black flex items-center gap-3 active:scale-[0.95] hover:scale-[1.05] transition-all shadow-xl hover:shadow-[#584fbc]/30">
                  {t.features.ai.cta}
                  <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
                </button>
              </div>

              <motion.div 
                whileHover={{ y: -10, rotate: -1 }}
                className="w-full md:w-96 bg-white/90 backdrop-blur-sm p-8 rounded-[32px] shadow-2xl border border-[#bccac1] space-y-6 relative z-10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#3d4943] font-black uppercase tracking-widest opacity-60">{t.features.ai.rec}</span>
                  <span className="text-[#00694c] font-black text-[10px] flex items-center gap-1 bg-[#00694c]/10 px-2 py-1 rounded-full uppercase">
                    <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings:"'FILL' 1"}}>auto_awesome</span>{t.features.ai.match}
                  </span>
                </div>
                <div className="space-y-4">
                  {[["Sugar 1kg","150 Units"],["Wheat Flour 2kg","80 Units"],["Cooking Oil 2L","45 Units"]].map(([name,qty], idx)=>(
                    <motion.div 
                      key={name} 
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + (idx * 0.1) }}
                      className="flex justify-between items-center py-3 border-b border-[#e4eae4] last:border-0"
                    >
                      <span className="text-sm font-bold text-[#171d1a]">{name}</span>
                      <span className="text-sm font-black text-[#00694c]">{qty}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="pt-4 border-t border-[#bccac1] flex justify-between items-center">
                  <span className="text-[10px] text-[#3d4943] font-black uppercase tracking-widest opacity-60">{t.features.ai.cost}</span>
                  <span className="text-2xl font-black text-[#171d1a]"><span className="text-sm text-[#3d4943] font-bold mr-1">KES</span>32,400</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-24 px-4 md:px-6">
        <motion.div 
          whileHover={{ scale: 0.995 }}
          className="max-w-6xl mx-auto bg-[#008560] text-[#f5fff7] p-12 md:p-20 rounded-[48px] relative overflow-hidden shadow-2xl"
        >
          <motion.span 
            animate={{ 
              rotate: [12, 15, 12],
              y: [0, -10, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="material-symbols-outlined absolute -top-10 -right-10 text-[240px] opacity-10"
          >
            rocket_launch
          </motion.span>
          <div className="relative z-10 max-w-2xl text-center md:text-left mx-auto md:mx-0">
            <h2 className="text-5xl md:text-6xl font-black leading-tight mb-8">Ready to grow your SME smarter?</h2>
            <p className="text-xl mb-12 opacity-90 leading-relaxed font-medium">Join 500+ Kenyan businesses using Akiba AI to automate inventory and understand their finances.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start">
              <Link href="/auth" className="bg-[#f5fff7] text-[#00694c] h-16 px-12 rounded-2xl font-black text-lg flex items-center justify-center active:scale-[0.95] hover:scale-[1.05] transition-all shadow-2xl">
                {t.hero.cta}
              </Link>
              <button className="border-2 border-white/40 text-white h-16 px-12 rounded-2xl font-black text-lg hover:bg-white/10 transition-all active:scale-[0.95]">
                Contact Sales
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#171d1a] text-[#dee4de] py-20 px-4 md:px-6 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1">
              <span className="text-3xl font-black text-[#86f8c9] mb-6 block">Akiba <span className="text-[#958dff]">AI</span></span>
              <p className="text-sm opacity-60 mb-8 leading-relaxed max-w-xs">Smart inventory for the modern Kenyan business. Automate, predict, and grow.</p>
              <div className="flex gap-6">
                <Link href="#" className="material-symbols-outlined cursor-pointer hover:text-[#86f8c9] transition-all hover:scale-110">social_leaderboard</Link>
                <Link href="#" className="material-symbols-outlined cursor-pointer hover:text-[#86f8c9] transition-all hover:scale-110">alternate_email</Link>
              </div>
            </div>
            {[
              { title: "Product", links: [
                { name: t.nav.features, href: "#features" },
                { name: t.nav.pricing, href: "#pricing" },
                { name: "Forecasting", href: "/forecasts" },
                { name: "AI Insights", href: "/ai-insights" }
              ] },
              { title: "Support", links: [
                { name: "Help Center", href: "#" },
                { name: "Kiswahili Guide", href: "#" },
                { name: "Contact Us", href: "#" }
              ] },
              { title: "Company", links: [
                { name: "About", href: "#" },
                { name: "Privacy Policy", href: "#" },
                { name: "Terms of Service", href: "#" }
              ] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-black text-white mb-6 uppercase text-[10px] tracking-[0.2em]">{col.title}</h4>
                <ul className="space-y-3 text-sm opacity-60">
                  {col.links.map(l => (
                    <li key={l.name}>
                      <Link href={l.href} className="hover:opacity-100 hover:text-[#86f8c9] cursor-pointer transition-all">
                        {l.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-10 border-t border-white/5 text-center">
            <p className="text-[10px] opacity-30 uppercase tracking-[0.4em] font-black">&copy; 2025 Akiba AI. Secure &amp; Encrypted.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .ai-purple-tint {
          background: linear-gradient(135deg, #f0eeff 0%, #f9f8ff 100%);
          border: 1px solid rgba(88, 79, 188, 0.2);
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
