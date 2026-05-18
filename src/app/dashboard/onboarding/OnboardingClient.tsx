"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { completeOnboarding, OnboardingProduct } from "@/lib/actions/onboarding";

// ─── AI Inventory Templates ───────────────────────────────────────────────────
const TEMPLATES: Record<string, { label: string; sw: string; icon: string; products: OnboardingProduct[] }> = {
  grocery: {
    label: "Grocery / Retail", sw: "Mboga & Duka", icon: "local_grocery_store",
    products: [
      { name: "Jogoo Unga 2kg", category: "Flour", unit_price: 165, stock_quantity: 50, reorder_level: 15 },
      { name: "Sugar 1kg (Mumias)", category: "Sugar", unit_price: 145, stock_quantity: 40, reorder_level: 10 },
      { name: "Cooking Oil 1L (Elianto)", category: "Oil", unit_price: 220, stock_quantity: 30, reorder_level: 8 },
      { name: "Safari Pure Tea 250g", category: "Tea", unit_price: 120, stock_quantity: 25, reorder_level: 5 },
      { name: "Broadways Bread", category: "Bread", unit_price: 55, stock_quantity: 20, reorder_level: 5 },
      { name: "Blue Band 250g", category: "Spreads", unit_price: 115, stock_quantity: 20, reorder_level: 5 },
    ],
  },
  hardware: {
    label: "Hardware / Mijengo", sw: "Vifaa vya Ujenzi", icon: "construction",
    products: [
      { name: "Cement 50kg (Bamburi)", category: "Cement", unit_price: 900, stock_quantity: 100, reorder_level: 20 },
      { name: "Steel Nails 2-inch (1kg)", category: "Nails", unit_price: 120, stock_quantity: 60, reorder_level: 15 },
      { name: "Gloss Paint 4L", category: "Paint", unit_price: 1100, stock_quantity: 20, reorder_level: 5 },
      { name: "G-Clamp 6-inch", category: "Clamps", unit_price: 350, stock_quantity: 15, reorder_level: 3 },
      { name: "Key Lock (Standard)", category: "Locks", unit_price: 280, stock_quantity: 25, reorder_level: 5 },
      { name: "Hammer (Steel Head)", category: "Tools", unit_price: 450, stock_quantity: 12, reorder_level: 3 },
    ],
  },
  chemist: {
    label: "Chemist / Dawa", sw: "Duka la Dawa", icon: "medication",
    products: [
      { name: "Panadol Actifast 24s", category: "Painkillers", unit_price: 95, stock_quantity: 60, reorder_level: 15 },
      { name: "Band-Aid Box 20s", category: "First Aid", unit_price: 85, stock_quantity: 40, reorder_level: 10 },
      { name: "Antiseptic Liquid 500ml", category: "Antiseptics", unit_price: 180, stock_quantity: 25, reorder_level: 5 },
      { name: "Vitamin C 1000mg 30s", category: "Vitamins", unit_price: 350, stock_quantity: 30, reorder_level: 8 },
      { name: "Cough Syrup 100ml", category: "Cough & Cold", unit_price: 120, stock_quantity: 20, reorder_level: 5 },
      { name: "ORS Sachet (Lemon)", category: "Rehydration", unit_price: 30, stock_quantity: 80, reorder_level: 20 },
    ],
  },
  boutique: {
    label: "Boutique / Nguo", sw: "Duka la Nguo", icon: "checkroom",
    products: [
      { name: "Men's T-Shirt (S-XL)", category: "Tops", unit_price: 650, stock_quantity: 30, reorder_level: 5 },
      { name: "Ladies Blouse", category: "Tops", unit_price: 850, stock_quantity: 20, reorder_level: 5 },
      { name: "Denim Jeans (Unisex)", category: "Bottoms", unit_price: 1500, stock_quantity: 15, reorder_level: 3 },
      { name: "Kitenge Dress", category: "Dresses", unit_price: 1200, stock_quantity: 10, reorder_level: 3 },
      { name: "Sandals (Size 36-44)", category: "Footwear", unit_price: 950, stock_quantity: 20, reorder_level: 5 },
      { name: "Ankara Head Wrap", category: "Accessories", unit_price: 250, stock_quantity: 25, reorder_level: 5 },
    ],
  },
  agrovet: {
    label: "Agro-vet / Shamba", sw: "Duka la Shamba", icon: "grass",
    products: [
      { name: "DAP Fertilizer 10kg", category: "Fertilizer", unit_price: 2800, stock_quantity: 20, reorder_level: 5 },
      { name: "Maize Seeds 2kg (H614D)", category: "Seeds", unit_price: 450, stock_quantity: 30, reorder_level: 8 },
      { name: "Cattle Mineral Lick 5kg", category: "Animal Feed", unit_price: 650, stock_quantity: 15, reorder_level: 4 },
      { name: "Pesticide Spray 1L", category: "Pesticides", unit_price: 780, stock_quantity: 20, reorder_level: 5 },
      { name: "Poultry Starter Feed 10kg", category: "Animal Feed", unit_price: 1100, stock_quantity: 15, reorder_level: 3 },
      { name: "Urea Fertilizer 10kg", category: "Fertilizer", unit_price: 2200, stock_quantity: 20, reorder_level: 5 },
    ],
  },
  other: {
    label: "Other", sw: "Nyingine", icon: "storefront",
    products: [
      { name: "Product 1", category: "General", unit_price: 100, stock_quantity: 20, reorder_level: 5 },
      { name: "Product 2", category: "General", unit_price: 200, stock_quantity: 20, reorder_level: 5 },
      { name: "Product 3", category: "General", unit_price: 300, stock_quantity: 20, reorder_level: 5 },
    ],
  },
};

const AI_MESSAGES = [
  "Analyzing East African retail demand patterns...",
  "Running Monte Carlo inventory simulations...",
  "Mapping safety stock thresholds for your category...",
  "Configuring AI reorder triggers in Kiswahili...",
  "Calibrating profit margin alerts...",
  "Building your personalized demand forecast model...",
];

type Lang = "en" | "sw";
type CategoryKey = keyof typeof TEMPLATES;

interface Props { storeId: string; storeName: string; ownerName: string; }

export default function OnboardingClient({ storeName, ownerName }: Props) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [products, setProducts] = useState<OnboardingProduct[]>([]);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [aiMsgIdx, setAiMsgIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sw = lang === "sw";

  // Load template products
  const loadTemplate = (key: CategoryKey) => {
    setProducts(TEMPLATES[key].products.map(p => ({ ...p })));
    setTemplateLoaded(true);
  };

  const updateProduct = (idx: number, field: keyof OnboardingProduct, value: string | number) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const removeProduct = (idx: number) => {
    setProducts(prev => prev.filter((_, i) => i !== idx));
  };

  const addProduct = () => {
    setProducts(prev => [...prev, { name: "", category: category ? TEMPLATES[category].label : "General", unit_price: 0, stock_quantity: 0, reorder_level: 5 }]);
  };

  // Step 2 → Step 3: run AI animation then submit
  const handleFinish = async () => {
    if (!category) return;
    if (products.length < 1) { setError(sw ? "Ongeza bidhaa angalau 1" : "Add at least 1 product"); return; }
    setStep(3);
    setSubmitting(true);
    setError(null);

    // Cycle AI messages
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % AI_MESSAGES.length;
      setAiMsgIdx(idx);
    }, 900);

    const result = await completeOnboarding(category, products);
    clearInterval(interval);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || "Something went wrong.");
      setStep(2);
      return;
    }
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-[#0b120e] flex flex-col" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <span className="text-white font-black text-lg">
          Akiba<span style={{ color: "#4ade80" }}>AI</span>
        </span>
        <div className="flex bg-white/10 p-1 rounded-full gap-1">
          {(["en", "sw"] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${lang === l ? "bg-[#00a87a] text-white" : "text-white/50"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 px-5 pt-5">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? "bg-[#00a87a]" : "bg-white/10"}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Choose Category ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                <div>
                  <p className="text-[#4ade80] text-xs font-black uppercase tracking-widest mb-1">{sw ? "Hatua 1 kati ya 3" : "Step 1 of 3"}</p>
                  <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    {sw ? `Karibu, ${ownerName}! 👋` : `Welcome, ${ownerName}! 👋`}
                  </h1>
                  <p className="text-white/50 mt-2 text-sm">
                    {sw ? "Duka lako linafanya biashara gani?" : `What type of business is "${storeName}"?`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(TEMPLATES) as CategoryKey[]).map(key => {
                    const t = TEMPLATES[key];
                    const selected = category === key;
                    return (
                      <button key={key} onClick={() => setCategory(key)}
                        className={`p-4 rounded-2xl border text-left transition-all active:scale-95 ${selected ? "border-[#00a87a] bg-[#00a87a]/10" : "border-white/10 bg-white/5 hover:border-white/30"}`}>
                        <span className={`material-symbols-outlined text-2xl mb-2 block ${selected ? "text-[#4ade80]" : "text-white/40"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {t.icon}
                        </span>
                        <p className={`text-sm font-black ${selected ? "text-white" : "text-white/70"}`}>{lang === "sw" ? t.sw : t.label}</p>
                      </button>
                    );
                  })}
                </div>

                <button onClick={() => { if (category) { loadTemplate(category); setStep(2); } }}
                  disabled={!category}
                  className="w-full h-14 rounded-2xl font-black text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: category ? "linear-gradient(135deg,#00694c,#00a87a)" : "#1a1a1a", color: "white" }}>
                  {sw ? "Endelea" : "Continue"} →
                </button>
              </motion.div>
            )}

            {/* ── STEP 2: Products ── */}
            {step === 2 && category && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                <div>
                  <p className="text-[#4ade80] text-xs font-black uppercase tracking-widest mb-1">{sw ? "Hatua 2 kati ya 3" : "Step 2 of 3"}</p>
                  <h1 className="text-2xl font-black text-white">{sw ? "Bidhaa za Awali" : "Starting Inventory"}</h1>
                  <p className="text-white/50 text-sm mt-1">
                    {templateLoaded
                      ? (sw ? "Hariri bei na hesabu kama unavyotaka." : "Edit prices & quantities to match your store.")
                      : (sw ? "Tumia kiolezo au ongeza mwenyewe." : "Use an AI template or add products manually.")}
                  </p>
                </div>

                {/* Template pill */}
                {!templateLoaded && (
                  <button onClick={() => loadTemplate(category)}
                    className="w-full p-4 rounded-2xl border border-dashed border-[#00a87a]/50 bg-[#00a87a]/5 text-[#4ade80] text-sm font-black flex items-center gap-3 hover:bg-[#00a87a]/10 transition-all">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    {sw ? `Pakia Kiolezo cha AI — ${TEMPLATES[category].sw}` : `Load AI Template — ${TEMPLATES[category].label}`}
                  </button>
                )}

                {/* Product list */}
                {products.length > 0 && (
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {products.map((p, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
                        <div className="flex gap-2 items-start">
                          <input value={p.name} onChange={e => updateProduct(i, "name", e.target.value)}
                            placeholder={sw ? "Jina la bidhaa" : "Product name"}
                            className="flex-1 bg-transparent text-white text-sm font-bold outline-none border-b border-white/10 focus:border-[#00a87a] pb-1 min-w-0" />
                          <button onClick={() => removeProduct(i)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { field: "unit_price" as const, label: sw ? "Bei (KES)" : "Price (KES)" },
                            { field: "stock_quantity" as const, label: sw ? "Hesabu" : "Stock" },
                            { field: "reorder_level" as const, label: sw ? "Kiwango cha Chini" : "Reorder" },
                          ].map(({ field, label }) => (
                            <div key={field}>
                              <p className="text-white/30 text-[9px] font-black uppercase mb-1">{label}</p>
                              <input type="number" value={p[field]} onChange={e => updateProduct(i, field, parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-white text-sm font-bold outline-none border-b border-white/10 focus:border-[#00a87a] pb-1" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={addProduct}
                  className="w-full h-11 rounded-2xl border border-dashed border-white/20 text-white/50 text-sm font-bold hover:border-white/40 hover:text-white/70 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  {sw ? "Ongeza Bidhaa" : "Add Product"}
                </button>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">{error}</div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)}
                    className="h-14 w-14 rounded-2xl border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <button onClick={handleFinish} disabled={products.length === 0}
                    className="flex-1 h-14 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98] disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg,#00694c,#00a87a)" }}>
                    {sw ? "Kamilisha Usajili" : "Complete Setup"} →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: AI Loading ── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8 py-12">
                <div className="relative w-24 h-24 mx-auto">
                  <motion.div className="absolute inset-0 rounded-full border-4 border-[#00a87a]/20" />
                  <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00a87a]"
                    animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[36px] text-[#4ade80]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black text-white mb-3">{sw ? "AI inasanidi duka lako..." : "AI is setting up your store..."}</h2>
                  <motion.p key={aiMsgIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="text-[#4ade80]/80 text-sm font-medium">
                    {AI_MESSAGES[aiMsgIdx]}
                  </motion.p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Success ── */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
                  className="w-24 h-24 rounded-full bg-[#00a87a]/20 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[48px] text-[#4ade80]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </motion.div>
                <div>
                  <h1 className="text-3xl font-black text-white">{sw ? "Umefanikiwa! 🎉" : "You're all set! 🎉"}</h1>
                  <p className="text-white/50 text-sm mt-2 max-w-xs mx-auto">
                    {sw
                      ? `Duka lako "${storeName}" lina bidhaa ${products.length} tayari. AI iko tayari kukusaidia!`
                      : `"${storeName}" is live with ${products.length} products. Your AI inventory engine is ready!`}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2">
                  {[
                    { icon: "inventory_2", text: sw ? `Bidhaa ${products.length} zimeongezwa` : `${products.length} products added to inventory` },
                    { icon: "auto_awesome", text: sw ? "AI imewekwa kulingana na biashara yako" : "AI calibrated for your business type" },
                    { icon: "notifications_active", text: sw ? "Tahadhari za stoki zimeanzishwa" : "Low-stock alerts are now active" },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-[#4ade80]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                      <span className="text-white/80 text-sm font-medium">{text}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => router.push("/dashboard")}
                  className="w-full h-14 rounded-2xl font-black text-white text-sm shadow-2xl shadow-[#00694c]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{ background: "linear-gradient(135deg,#00694c,#00a87a)" }}>
                  {sw ? "Fungua Dashibodi Yangu →" : "Launch My Dashboard →"}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
