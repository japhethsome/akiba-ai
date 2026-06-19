"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { logout } from "@/lib/actions/auth";

type Language = "en" | "sw";

const translations = {
  en: {
    nav: { home: "Home", features: "Features", aiFeatures: "AI Features", pricing: "Pricing" },
    hero: {
      badge: "AI-POWERED INVENTORY",
      aiBadge: "NEW AI FEATURES: VOICE POS & DEMAND FORECASTING",
      title1: "Your Business.",
      title2: "Smarter.",
      title3: "Stronger.",
      desc: "Help SMEs in Uasin Gishu never run out of stock, never lose sales, and always know what to reorder — in English or Kiswahili.",
      cta: "Start Your Free Trial",
      aiCta: "Explore AI Features",
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
      },
      aiFeatures: {
        badge: "AI-POWERED TOOLS",
        title: "Intelligent tools to run your shop",
        cards: [
          { icon: "mic", title: "AI Voice POS", desc: "Just speak to sell. 'Uza chupa mbili za maji'. The AI automatically adds items to your cart." },
          { icon: "monitoring", title: "Smart Demand Forecasting", desc: "AI analyzes weather, seasons, and trends to tell you exactly what to restock and when." },
          { icon: "chat_bubble", title: "AI Business Coach", desc: "Ask questions like 'What made the most profit today?' and get instant, plain-language advice." },
          { icon: "photo_camera", title: "AI Shelf Auditing", desc: "Take a photo of your shelves. The AI vision instantly counts products and reconciles stock." }
        ]
      }
    }
  },
  sw: {
    nav: { home: "Mwanzo", features: "Vipengele", aiFeatures: "Vipengele vya AI", pricing: "Bei" },
    hero: {
      badge: "INVENTORI YA AI",
      aiBadge: "VIPENGELE VYA AI: POS YA SAUTI & UTABIRI MAHIRI",
      title1: "Biashara Yako.",
      title2: "Werevu Zaidi.",
      title3: "Imara Zaidi.",
      desc: "Saidia biashara ndogo ndogo katika Uasin Gishu wasiishiwe na bidhaa, wasipoteze mauzo, na wajue cha kuagiza — kwa Kiingereza au Kiswahili.",
      cta: "Anza Jaribio la Bure",
      aiCta: "Vinjari Zana za AI",
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
      },
      aiFeatures: {
        badge: "ZANA ZA AI",
        title: "Zana za akili kuendesha duka lako",
        cards: [
          { icon: "mic", title: "POS ya Sauti", desc: "Ongea tu kuuza. 'Uza chupa mbili za maji'. AI inaongeza bidhaa kwenye kikapu chako." },
          { icon: "monitoring", title: "Utabiri Mahiri", desc: "AI inachanganua hali ya hewa na mienendo kukuambia nini cha kuagiza na lini." },
          { icon: "chat_bubble", title: "Kocha wa Biashara", desc: "Uliza maswali kama 'Nini kilileta faida zaidi leo?' na upate ushauri wa papo hapo." },
          { icon: "photo_camera", title: "Ukaguzi wa Rafu", desc: "Piga picha rafu zako. Maono ya AI huhesabu bidhaa na kusawazisha hisa papo hapo." }
        ]
      }
    }
  }
};

const heroImages = [
  "/hero.webp",
  "/hero1.webp",
  "/hero2.webp",
  "/hero3.webp",
  "/hero4.webp",
  "/hero5.webp"
];

export default function LandingPage({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    // Auto-logout when reaching landing page as requested
    const performLogout = async () => {
      if (isLoggedIn) {
        await logout();
      }
    };
    performLogout();
  }, [isLoggedIn]);

  const [lang, setLang] = useState<Language>("en");
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 3000); // 3-second intervals
    return () => clearInterval(timer);
  }, []);
  
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

  const handleLogout = async () => {
    await logout();
  };

  const t = translations[lang];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fff9] overflow-x-hidden selection:bg-[#00694c] selection:text-white">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00694c]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-[#584fbc]/5 rounded-full blur-[100px]" />
      </div>

      {/* TOP APP BAR */}
      <header className={`fixed top-0 left-0 right-0 h-16 z-[100] transition-all duration-500 ${scrolled ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-[#00694c]/10" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6 md:px-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Image
              src="/main.webp"
              alt="Akiba Yangu Logo"
              width={180}
              height={58}
              className="h-[58px] w-auto object-contain"
              priority
            />
          </motion.div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-[#00694c] font-bold text-sm">{t.nav.home}</Link>
            <Link href="#features" className="text-[#3d4943] hover:text-[#00694c] transition-colors text-sm">{t.nav.features}</Link>
            <Link href="#ai-features" className="text-[#3d4943] hover:text-[#00694c] transition-colors text-sm flex items-center gap-1 group">
              <span className="material-symbols-outlined text-[16px] text-[#584fbc] group-hover:animate-pulse">auto_awesome</span>
              <span className="text-[#584fbc] font-bold">{t.nav.aiFeatures}</span>
            </Link>
            <Link href="#pricing" className="text-[#3d4943] hover:text-[#00694c] transition-colors text-sm">{t.nav.pricing}</Link>
          </nav>
          <div className="flex items-center gap-4">
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
 
            {isLoggedIn ? (
               <div className="flex items-center gap-3">
                  <Link href="/dashboard" className="bg-[#00694c] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[#00694c]/20 hover:scale-105 transition-transform">Dashboard</Link>
               </div>
            ) : (
               <Link href="/auth" className="bg-[#00694c] text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-[#00694c]/20 hover:scale-105 transition-transform">Login</Link>
            )}
          </div>
        </div>
      </header>
 
      {/* HERO */}
      <section ref={heroRef} className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >

            <h1 className="text-4xl lg:text-6xl font-black leading-[1] mb-6 text-[#171d1a] tracking-tight">
              {t.hero.title1} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00694c] to-[#00a87a]">{t.hero.title2}</span> <br/>
              {t.hero.title3}
            </h1>
            <p className="text-base text-[#3d4943] mb-8 leading-relaxed max-w-sm font-medium opacity-70">
              {t.hero.desc}
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link href={isLoggedIn ? "/dashboard" : "/auth?mode=register"} className="bg-[#00694c] text-white h-16 px-10 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-[0.95] hover:bg-[#005a40] transition-all shadow-2xl shadow-[#00694c]/20 group">
                {isLoggedIn ? "Go to Dashboard" : t.hero.cta}
                <span className="material-symbols-outlined text-[24px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          </motion.div>
 
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-[#00694c]/20 to-[#584fbc]/10 rounded-[40px] blur-2xl opacity-50" />
            
            <motion.div 
              animate={{ 
                y: [0, -20, 0],
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="relative rounded-[40px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,105,76,0.25)] border border-white/50 aspect-square bg-white"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full"
                >
                  <Image 
                    src={heroImages[currentImageIndex]} 
                    alt="Kenyan Shop Owner" 
                    fill 
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#00694c]/20 via-transparent to-transparent pointer-events-none z-10" />
            </motion.div>

            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, type: "spring" }}
              className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white flex items-center gap-5 z-20"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#00694c] flex items-center justify-center shadow-lg shadow-[#00694c]/30">
                <span className="material-symbols-outlined text-white text-[32px] fill-1">insights</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#00694c] font-black uppercase tracking-[0.2em]">{t.hero.salesLabel}</span>
                <span className="text-3xl font-black text-[#171d1a] tracking-tight">
                  <span className="text-sm text-[#3d4943] font-bold mr-1 opacity-50">KES</span>42,500
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CHALLENGE SECTION */}
      <section className="py-32 px-6 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[#00694c]/[0.02] pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <motion.span 
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-[#00694c] font-black mb-4 block uppercase tracking-[0.3em]"
            >
              {t.challenge.badge}
            </motion.span>
            <h2 className="text-3xl lg:text-4xl font-black text-[#171d1a] mb-5 tracking-tight">{t.challenge.title}</h2>
            <p className="text-base text-[#3d4943] leading-relaxed opacity-70 font-medium">{t.challenge.desc}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {t.challenge.cards.map((c, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -12, scale: 1.02 }}
                className="bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[32px] border border-[#00694c]/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-[#00694c] hover:shadow-[0_20px_50px_rgba(0,105,76,0.1)] transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#00694c]/5 rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-14 h-14 ${i === 0 ? 'bg-[#ba1a1a]/10 text-[#ba1a1a]' : i === 1 ? 'bg-[#805200]/10 text-[#805200]' : 'bg-[#00694c]/10 text-[#00694c]'} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-[32px]">{i === 0 ? 'inventory' : i === 1 ? 'remove_shopping_cart' : 'visibility_off'}</span>
                </div>
                <h3 className="text-xl font-black text-[#171d1a] mb-4 tracking-tight">{c.title}</h3>
                <p className="text-base text-[#3d4943] leading-relaxed opacity-60 font-medium">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BENTO GRID FEATURES */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black text-[#171d1a] mb-12 tracking-tight"
          >
            {t.features.title}
          </motion.h2>
          <div className="grid md:grid-cols-12 gap-8">
            {/* Bento 1 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-8 bg-[#f0f9f3] p-6 sm:p-10 rounded-[28px] sm:rounded-[40px] border border-[#00694c]/10 hover:border-[#00694c] transition-all group relative overflow-hidden min-h-[350px]"
            >
              <div className="w-14 h-14 bg-[#00694c] rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-[#00694c]/20">
                <span className="material-symbols-outlined text-[32px]">inventory_2</span>
              </div>
              <h3 className="text-2xl font-black text-[#171d1a] mb-4 tracking-tight">{t.features.bento1.title}</h3>
              <p className="text-lg text-[#3d4943] leading-relaxed max-w-sm opacity-70 font-medium">{t.features.bento1.desc}</p>
              
              <div className="hidden lg:flex absolute bottom-[-20%] right-[-5%] w-[60%] aspect-video bg-white rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.1)] border-t border-x border-[#00694c]/10 p-6 flex-col gap-4 group-hover:bottom-0 transition-all duration-500">
                <div className="flex items-center justify-between border-b border-[#00694c]/5 pb-4">
                   <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#ba1a1a]" />
                     <div className="w-3 h-3 rounded-full bg-[#805200]" />
                     <div className="w-3 h-3 rounded-full bg-[#00694c]" />
                   </div>
                   <div className="text-[10px] font-black text-[#00694c] uppercase tracking-widest">Live Inventory</div>
                </div>
                <div className="space-y-3">
                   <div className="h-10 bg-[#f8fff9] rounded-xl border border-[#00694c]/5 w-full animate-pulse" />
                   <div className="h-10 bg-[#f8fff9] rounded-xl border border-[#00694c]/5 w-[80%] animate-pulse" />
                </div>
              </div>
            </motion.div>

            {/* Bento 2 */}
            <motion.div 
              whileHover={{ rotateY: 10, scale: 1.02 }}
              className="md:col-span-4 bg-[#eff5ef] p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-[#bccac1] hover:border-[#584fbc] transition-all group flex flex-col justify-center perspective-1000"
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
              className="md:col-span-12 ai-purple-tint p-6 sm:p-10 rounded-[28px] sm:rounded-[40px] relative overflow-hidden flex flex-col md:flex-row gap-12"
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
                className="w-full md:w-96 bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl border border-[#bccac1] space-y-6 relative z-10"
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

      {/* AI FEATURES SHOWCASE */}
      <section id="ai-features" className="py-24 px-6 bg-gradient-to-b from-[#f8fff9] via-[#f5f3ff]/40 to-[#f8fff9] relative overflow-hidden scroll-mt-20">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00694c]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] bg-[#584fbc]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-[10px] text-[#584fbc] font-black mb-4 block uppercase tracking-[0.3em] bg-[#f5f3ff] border border-[#584fbc]/10 rounded-full py-1.5 px-4 w-fit mx-auto shadow-sm animate-pulse"
            >
              {t.features.aiFeatures.badge}
            </motion.span>
            <h2 className="text-3xl lg:text-4xl font-black text-[#171d1a] mb-5 tracking-tight">{t.features.aiFeatures.title}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.features.aiFeatures.cards.map((c, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white p-8 rounded-[32px] border border-[#00694c]/10 shadow-xl shadow-[#00694c]/5 hover:border-[#584fbc] hover:shadow-2xl hover:shadow-[#584fbc]/15 transition-all group relative overflow-hidden flex flex-col items-start"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#584fbc]/5 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="flex w-full items-center justify-between mb-6 z-10">
                  <div className="w-14 h-14 bg-[#f5f3ff] text-[#584fbc] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <span className="material-symbols-outlined text-[28px]">{c.icon}</span>
                  </div>
                  <span className="text-[9px] font-black text-[#584fbc] bg-[#584fbc]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Akiba Yangu
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#171d1a] mb-3 tracking-tight z-10">{c.title}</h3>
                <p className="text-sm text-[#3d4943] leading-relaxed opacity-70 font-medium z-10">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA BANNER */}
      <section className="py-24 px-6">
        <motion.div 
          whileHover={{ scale: 0.998 }}
          className="max-w-7xl mx-auto bg-[#171d1a] text-white p-6 sm:p-10 md:p-16 rounded-[28px] sm:rounded-[48px] relative overflow-hidden shadow-[0_40px_100px_rgba(0,105,76,0.25)]"
        >
          <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-[#00694c]/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 grid lg:grid-cols-2 items-center gap-12">
            <div>
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                className="w-12 h-12 bg-[#00694c] rounded-xl flex items-center justify-center mb-8 shadow-xl shadow-[#00694c]/20"
              >
                <span className="material-symbols-outlined text-white text-2xl">rocket_launch</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-black leading-[1.1] mb-6 tracking-tight">Ready to grow <br/> smarter?</h2>
              <p className="text-base md:text-lg mb-10 text-white/70 leading-relaxed font-medium max-w-lg">Join 500+ Kenyan businesses using Akiba Yangu to automate inventory and understand their profits.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={isLoggedIn ? "/dashboard" : "/auth?mode=register"} className="bg-[#00694c] text-white h-14 px-10 rounded-2xl font-black text-base flex items-center justify-center active:scale-[0.95] hover:bg-[#005a40] transition-all">
                  {isLoggedIn ? "Go to Dashboard" : t.hero.cta}
                </Link>
                <button className="bg-white/5 backdrop-blur-md border border-white/10 text-white h-14 px-10 rounded-2xl font-black text-base hover:bg-white/10 transition-all active:scale-[0.95]">
                  Contact Sales
                </button>
              </div>
            </div>

            {/* Floating Visuals beside the text */}
            <div className="hidden lg:flex relative h-[300px] items-center justify-center">
              <div className="absolute inset-0 bg-[#00694c]/20 blur-[100px] rounded-full" />
              
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl relative z-10 flex flex-col gap-4"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00694c] flex items-center justify-center">
                       <span className="material-symbols-outlined text-white">trending_up</span>
                    </div>
                    <div>
                       <div className="text-[9px] text-white/50 font-black uppercase tracking-widest">Revenue Growth</div>
                       <div className="text-xl font-black text-white">+32.4%</div>
                    </div>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: "75%" }}
                      className="h-full bg-[#00694c]" 
                    />
                 </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-4 -right-4 bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-2xl shadow-xl z-20"
              >
                 <div className="text-[9px] text-white/50 font-black uppercase tracking-widest mb-1">Active Shops</div>
                 <div className="text-lg font-black text-white">500+</div>
              </motion.div>

              <motion.div 
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-4 -left-4 bg-[#00694c]/20 backdrop-blur-lg border border-[#00694c]/20 p-4 rounded-2xl shadow-xl z-0"
              >
                 <div className="text-[9px] text-[#00694c] font-black uppercase tracking-widest mb-1">AI Accuracy</div>
                 <div className="text-lg font-black text-white">99%</div>
              </motion.div>
            </div>
          </div>
          
          <div className="absolute bottom-[-10%] right-[-5%] opacity-10 pointer-events-none">
             <span className="material-symbols-outlined text-[400px] text-white rotate-[-12deg]">auto_awesome</span>
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
                { name: "Help Center", href: "/help-center" },
                { name: "Kiswahili Guide", href: "#" },
                { name: "Contact Us", href: "/contact" }
              ] },
              { title: "Company", links: [
                { name: "About", href: "/about" },
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms of Service", href: "/terms" }
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
            <p className="text-[10px] opacity-30 uppercase tracking-[0.4em] font-black">&copy; 2026 Akiba Yangu. Secure &amp; Encrypted.</p>
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
