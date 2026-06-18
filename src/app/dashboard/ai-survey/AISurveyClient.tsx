"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const questions = [
  {
    id: 1,
    question: "What is your shop's primary business?",
    options: ["Grocery Store", "Hardware Shop", "Agro-vet", "Chemist / Pharmacy", "Fashion Boutique"],
    icon: "storefront"
  },
  {
    id: 2,
    question: "How do you currently track your stock?",
    options: ["Paper & Pen", "Excel Spreadsheets", "Memory / Eye-balling", "Another POS System"],
    icon: "edit_note"
  },
  {
    id: 3,
    question: "What is your biggest inventory headache?",
    options: ["Running out of fast-movers", "Dead stock / Expired items", "Theft or missing items", "Inconsistent supplier delivery"],
    icon: "error"
  },
  {
    id: 4,
    question: "How many customers do you serve daily?",
    options: ["1 - 20", "20 - 50", "50 - 150", "150+"],
    icon: "groups"
  },
  {
    id: 5,
    question: "What is your primary goal for Akiba AI?",
    options: ["Automated restock alerts", "Sales forecasting", "Financial reporting", "Fraud prevention"],
    icon: "auto_awesome"
  }
];

export default function AISurveyClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const router = useRouter();

  const handleSelect = (option: string) => {
    setAnswers({ ...answers, [questions[currentStep].id]: option });
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalize
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5fbf5] flex items-center justify-center p-4 sm:p-8 text-[#171d1a]">
      <div className="max-w-2xl w-full">
        {/* Progress */}
        <div className="flex gap-2 mb-10 sm:mb-16">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${currentStep >= i ? "bg-[#00694c]" : "bg-[#bccac1]/30"}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 sm:space-y-12 bg-white p-6 sm:p-12 rounded-[28px] sm:rounded-[40px] border border-[#bccac1] shadow-xl shadow-[#00694c]/5"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#00694c]/10 flex items-center justify-center">
                 <span className="material-symbols-outlined text-[#00694c] text-2xl sm:text-3xl">{questions[currentStep].icon}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-[#171d1a] leading-tight tracking-tight">
                {questions[currentStep].question}
              </h1>
              <p className="text-[#6d7a73] font-black uppercase tracking-[0.2em] text-[10px]">
                Question {currentStep + 1} of {questions.length} • AI Training Phase
              </p>
            </div>

            <div className="grid gap-3">
              {questions[currentStep].options.map((option) => (
                <button
                   key={option}
                   onClick={() => handleSelect(option)}
                   className="group p-4 sm:p-6 rounded-[18px] sm:rounded-[24px] bg-[#f5fbf5] border border-[#bccac1]/50 text-left hover:border-[#00694c] hover:bg-white hover:shadow-lg transition-all flex items-center justify-between"
                >
                  <span className="text-sm sm:text-lg font-bold text-[#171d1a]/70 group-hover:text-[#00694c] transition-colors">{option}</span>
                  <span className="material-symbols-outlined text-[#bccac1] group-hover:text-[#00694c] group-hover:translate-x-1 transition-all">arrow_forward</span>
                </button>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-4">
               <button 
                  onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                  className={`text-[10px] font-black uppercase tracking-widest text-[#6d7a73] hover:text-[#00694c] transition-colors flex items-center gap-2 ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
               >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Previous
               </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
