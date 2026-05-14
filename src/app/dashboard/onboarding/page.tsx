"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleComplete = () => {
    // In a real app, we would call a server action here to update 'onboarded' to true
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0a100d] flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? "bg-[#00a87a]" : "bg-white/10"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-white">What type of store do you run?</h1>
                <p className="text-white/40 font-medium">This helps Akiba AI predict demand patterns specifically for your business.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {["Grocery", "Hardware", "Chemist", "Boutique", "Agro-vet", "Other"].map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setStep(2)}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 text-white font-black hover:border-[#00a87a] hover:bg-[#00a87a]/10 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#00a87a]/20">
                       <span className="material-symbols-outlined text-white/40 group-hover:text-[#00a87a]">storefront</span>
                    </div>
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-white">Add your first products</h1>
                <p className="text-white/40 font-medium">Let's seed the database with at least 3 items to get the AI started.</p>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-3 gap-4">
                    <input type="text" placeholder="Product Name" className="bg-transparent text-white outline-none text-sm font-bold border-b border-white/10 focus:border-[#00a87a] pb-1" />
                    <input type="number" placeholder="Stock" className="bg-transparent text-white outline-none text-sm font-bold border-b border-white/10 focus:border-[#00a87a] pb-1" />
                    <input type="number" placeholder="Price" className="bg-transparent text-white outline-none text-sm font-bold border-b border-white/10 focus:border-[#00a87a] pb-1" />
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setStep(3)}
                className="w-full h-14 bg-[#00a87a] text-white rounded-2xl font-black shadow-lg shadow-[#00a87a]/20 hover:bg-[#00c08b] active:scale-[0.98] transition-all"
              >
                Continue to Final Step
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 text-center"
            >
              <div className="w-24 h-24 bg-[#00a87a]/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="material-symbols-outlined text-[48px] text-[#00a87a]">verified</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-white">You're all set!</h1>
                <p className="text-white/40 font-medium max-w-sm mx-auto">Akiba AI is now ready to help you optimize your inventory and grow your business.</p>
              </div>

              <button 
                onClick={handleComplete}
                className="w-full h-14 bg-gradient-to-r from-[#00694c] to-[#00a87a] text-white rounded-2xl font-black shadow-xl shadow-[#00694c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-8"
              >
                Unlock My Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
