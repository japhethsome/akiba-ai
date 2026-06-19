"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface FAQ {
  question: string;
  answer: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  faqs: FAQ[];
}

const helpCategories: Category[] = [
  {
    id: "pos",
    name: "POS & Cashier",
    icon: "point_of_sale",
    description: "Learn how to record sales, process payments, and run staff shifts.",
    faqs: [
      {
        question: "How do I log a transaction?",
        answer: "Open the POS tab in the dashboard, select products to add them to your active cart, choose the payment method (Cash or M-Pesa), and click the 'Complete' button. The inventory count will automatically adjust."
      },
      {
        question: "Does the POS work offline?",
        answer: "Yes! Akiba Yangu stores transaction logs locally in your browser storage if the internet connection is lost. It will automatically synchronize all sales records to the database as soon as connection is restored."
      },
      {
        question: "Can my staff use the POS?",
        answer: "Yes, you can register staff members under the 'Staff' tab in your owner dashboard. Attendant accounts have permission to process sales and log inventory, but cannot access profit reports or change billing settings."
      }
    ]
  },
  {
    id: "sourcing",
    name: "Sourcing & Suppliers",
    icon: "local_shipping",
    description: "Manage vendors, track lead times, and order via WhatsApp.",
    faqs: [
      {
        question: "How do I register a supplier?",
        answer: "Navigate to the Suppliers tab and click 'Add Supplier'. Fill in their name, Safaricom phone/WhatsApp contact number, location, and average delivery lead time."
      },
      {
        question: "How does the WhatsApp restocking workflow work?",
        answer: "When a product's stock drops below its reorder level, you will see a restock recommendation. Clicking 'Order via WhatsApp' compiles the required quantity and name of the item into a pre-filled text template, opening a WhatsApp message directly to the registered supplier's phone number."
      },
      {
        question: "How do I link a product to a specific supplier?",
        answer: "Go to your Inventory tab, click on the product you want to modify to open the edit details pane, and select the corresponding supplier from the dropdown list before saving."
      }
    ]
  },
  {
    id: "ai",
    name: "AI Forecasts",
    icon: "auto_awesome",
    description: "Understand demand forecasting and automated restock alerts.",
    faqs: [
      {
        question: "How often does the AI update demand predictions?",
        answer: "Our forecasting models analyze your historical sales records overnight and update calculations daily. They identify weekly trends (like Friday rushes) to predict upcoming demand levels."
      },
      {
        question: "What is the 'Reorder Level' in Inventory?",
        answer: "The reorder level is the safety stock threshold. If stock counts fall to this number, a restock warning is flagged. You can configure this custom value based on how fast the item sells and how long the supplier takes to deliver."
      }
    ]
  },
  {
    id: "payments",
    name: "Payments & PayHero",
    icon: "account_balance_wallet",
    description: "Configure Till/Paybill numbers and checkout validation.",
    faqs: [
      {
        question: "How do I connect my store's M-Pesa Till number?",
        answer: "Go to Settings -> Payment Methods. Add your PayHero API key, username, and register the Till or Paybill number where customer payments should route."
      },
      {
        question: "What should I do if an M-Pesa checkout payment fails?",
        answer: "Transactions with pending verification can be checked against your transaction lists. You can manually request a checkout callback confirmation status in the transactions log or request the customer to pay cash if the network is down."
      }
    ]
  }
];

export default function HelpCenterClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<string | null>(null);

  const toggleFaq = (categoryFaqId: string) => {
    if (expandedFaqIndex === categoryFaqId) {
      setExpandedFaqIndex(null);
    } else {
      setExpandedFaqIndex(categoryFaqId);
    }
  };

  // Filter Categories and FAQs based on search and selected category
  const filteredCategories = helpCategories
    .map((category) => {
      const filteredFaqs = category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...category, faqs: filteredFaqs };
    })
    .filter((category) => {
      const matchesCategory = activeCategory === "all" || category.id === activeCategory;
      const hasMatchingFaqs = category.faqs.length > 0;
      const matchesCategoryDescription =
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && (hasMatchingFaqs || (matchesCategoryDescription && searchQuery !== ""));
    });

  const hasResults = filteredCategories.length > 0;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
  } as const;

  return (
    <div className="min-h-screen bg-[#f5fbf5] flex flex-col justify-between relative overflow-x-hidden selection:bg-[#00694c] selection:text-white">
      {/* Decorative gradient backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00694c]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-[#584fbc]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-[#00694c]/10 z-50 flex items-center justify-between px-6 md:px-12 shadow-sm">
        <Link href="/" className="text-xl font-black tracking-tighter flex items-center gap-2">
          <div className="w-7 h-7 bg-[#00694c] rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-black">A</span>
          </div>
          <span className="text-[#171d1a]">
            Akiba<span className="text-[#00694c]">Yangu</span>
          </span>
        </Link>
        <Link 
          href="/" 
          className="text-xs font-black uppercase tracking-wider text-[#3d4943] hover:text-[#00694c] transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Home
        </Link>
      </nav>

      {/* Main Support Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto pt-28 pb-16 px-4 sm:px-6 lg:px-8 z-10 flex flex-col items-center">
        {/* Banner Section */}
        <div className="text-center max-w-2xl mt-4 mb-10">
          <span className="text-[10px] font-black text-[#00694c] uppercase tracking-[0.25em] bg-[#f0fdf4] px-4 py-2 rounded-full border border-[#00694c]/10">
            Resources & support
          </span>
          <h1 className="text-4xl font-black text-[#171d1a] tracking-tight mt-6 mb-4">
            How can we help you today?
          </h1>
          <p className="text-sm font-medium text-[#6d7a73] leading-relaxed">
            Search our guides or browse categories to find quick answers on inventory management, sales logs, AI restock levels, and payment configs.
          </p>

          {/* Search Input Box */}
          <div className="mt-8 flex items-center bg-white border border-[#e4eae4] rounded-[20px] px-5 h-14 w-full focus-within:border-[#00694c] transition-all focus-within:shadow-xl focus-within:shadow-[#00a87a]/5">
            <span className="material-symbols-outlined text-[#bccac1] text-[22px] mr-3">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help questions, answers, and resources..."
              className="bg-transparent border-none focus:ring-0 text-sm w-full font-medium text-[#171d1a] placeholder-[#bccac1] outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="text-[#bccac1] hover:text-[#171d1a] transition-colors p-1"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 w-full">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeCategory === "all"
                ? "bg-[#171d1a] text-white shadow-md"
                : "bg-white border border-[#e4eae4] text-[#6d7a73] hover:text-[#171d1a] hover:bg-[#f8faf9]"
            }`}
          >
            All Articles
          </button>
          {helpCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                activeCategory === cat.id
                  ? "bg-[#171d1a] text-white shadow-md"
                  : "bg-white border border-[#e4eae4] text-[#6d7a73] hover:text-[#171d1a] hover:bg-[#f8faf9]"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* FAQ Contents */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full space-y-8"
        >
          {hasResults ? (
            filteredCategories.map((category) => (
              <div 
                key={category.id} 
                className="bg-white rounded-[24px] border border-[#e4eae4] shadow-sm p-6 sm:p-8"
              >
                {/* Category Header */}
                <div className="flex items-start gap-4 pb-5 border-b border-[#f0f5f0] mb-6">
                  <div className="w-12 h-12 shrink-0 bg-[#f0fdf4] text-[#00694c] border border-[#d1ebd7] rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">{category.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#171d1a]">{category.name}</h3>
                    <p className="text-xs font-medium text-[#6d7a73] mt-0.5">{category.description}</p>
                  </div>
                </div>

                {/* Question Accordion List */}
                <div className="space-y-4">
                  {category.faqs.map((faq, index) => {
                    const faqId = `${category.id}-${index}`;
                    const isExpanded = expandedFaqIndex === faqId;

                    return (
                      <div 
                        key={index} 
                        className={`border rounded-xl transition-all ${
                          isExpanded 
                            ? "bg-[#f8faf9] border-[#00694c]/20" 
                            : "border-[#e4eae4] hover:bg-[#f8faf9]/50"
                        }`}
                      >
                        <button
                          onClick={() => toggleFaq(faqId)}
                          className="w-full flex items-center justify-between text-left p-4 focus:outline-none"
                        >
                          <span className="text-sm font-bold text-[#171d1a] pr-4">
                            {faq.question}
                          </span>
                          <motion.span
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="material-symbols-outlined text-[#6d7a73] text-[20px] shrink-0"
                          >
                            expand_more
                          </motion.span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 pt-0 text-xs font-medium leading-relaxed text-[#6d7a73] border-t border-[#00694c]/5">
                                {faq.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white border border-[#e4eae4] rounded-[24px] w-full">
              <span className="material-symbols-outlined text-5xl text-[#bccac1] mb-3">search_off</span>
              <h3 className="text-base font-black text-[#171d1a]">No matching answers found</h3>
              <p className="text-xs text-[#6d7a73] mt-1 max-w-sm mx-auto">
                Try querying for different keywords (like POS, Till, Safaricom, or Restock) or select another tab above.
              </p>
            </div>
          )}
        </motion.div>

        {/* CTA Contact Footer */}
        <div className="mt-12 text-center bg-gradient-to-tr from-[#171d1a] to-[#3d4943] text-white rounded-[24px] p-8 w-full shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00a87a]/10 rounded-bl-[100px] pointer-events-none" />
          <h3 className="text-xl font-black mb-2">Still need help?</h3>
          <p className="text-xs text-white/70 max-w-md mx-auto mb-6">
            If you cannot find the answer to your query in our FAQs, please contact our support desk directly. We will get back to you shortly.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 bg-[#00a87a] hover:bg-[#009169] text-white px-6 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-colors shadow-md"
          >
            Contact Support Desk
            <span className="material-symbols-outlined text-[16px]">send</span>
          </Link>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="w-full bg-[#171d1a] border-t border-white/5 py-6 px-6 text-center text-[10px] text-[#6d7a73] uppercase tracking-[0.25em]">
        Akiba Yangu &copy; 2026. Designed for Uasin Gishu County SMEs.
      </footer>
    </div>
  );
}
