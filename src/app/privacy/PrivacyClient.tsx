"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f5fbf5] flex flex-col items-center py-20 px-6">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-[#bccac1] z-50 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="text-2xl font-black text-[#00694c]">
          Akiba <span className="text-[#584fbc]">AI</span>
        </Link>
        <Link href="/" className="text-sm font-black text-[#3d4943] hover:text-[#00694c]">Home</Link>
      </nav>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full mt-10 bg-white p-6 sm:p-10 md:p-16 rounded-[28px] md:rounded-[40px] border border-[#bccac1] shadow-xl"
      >
        <h1 className="text-4xl font-black text-[#171d1a] mb-4">Privacy Policy</h1>
        <p className="text-sm text-[#3d4943] opacity-60 mb-10 tracking-widest uppercase font-bold">Last Updated: May 2026</p>
        
        <div className="space-y-8 text-[#3d4943] leading-relaxed">
          <section>
            <h2 className="text-xl font-black text-[#171d1a] mb-3">1. Data We Collect</h2>
            <p>
              We collect information necessary to manage your inventory and store operations, including your name, 
              phone number (linked to M-Pesa for transactions), email address, and store-specific sales data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#171d1a] mb-3">2. How We Use Your Data</h2>
            <p>
              Your inventory and sales data are used to generate AI insights and demand forecasts. We do not sell 
              your individual business data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#171d1a] mb-3">3. Data Security</h2>
            <p>
              We implement industry-standard encryption to protect your data. Your account is secured via PIN/Password, 
              and we recommend keeping these credentials confidential.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#171d1a] mb-3">4. Owner Control</h2>
            <p>
              Store Owners have full control over their business data and the staff (Attendants) they add to the platform. 
              Owners can request data deletion at any time by contacting support.
            </p>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-[#f0f4f0] text-center">
          <p className="text-xs opacity-50">&copy; 2026 Akiba AI. Built for the future of Kenyan retail.</p>
        </footer>
      </motion.div>
    </div>
  );
}
