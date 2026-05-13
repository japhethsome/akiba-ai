"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TermsPage() {
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
        className="max-w-3xl w-full mt-10 bg-white p-10 md:p-16 rounded-[40px] border border-[#bccac1] shadow-xl"
      >
        <h1 className="text-4xl font-black text-[#171d1a] mb-4">Terms of Service</h1>
        <p className="text-sm text-[#3d4943] opacity-60 mb-10 tracking-widest uppercase font-bold">Last Updated: May 2025</p>
        
        <div className="space-y-8 text-[#3d4943] leading-relaxed">
          <section>
            <h2 className="text-xl font-black text-[#171d1a] mb-3">1. Service Description</h2>
            <p>
              Akiba AI provides an inventory management and forecasting platform for SMEs. We aim for high accuracy 
              in our AI predictions, but these should be used as a guide alongside professional business judgment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#171d1a] mb-3">2. User Accounts</h2>
            <p>
              Owners are responsible for all activity under their store account, including actions taken by 
              Attendants they have added. You must provide accurate information during registration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#171d1a] mb-3">3. Usage Restrictions</h2>
            <p>
              The service must be used for lawful business operations only. Any attempt to compromise the 
              platform's security or integrity is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[#171d1a] mb-3">4. Limitation of Liability</h2>
            <p>
              Akiba AI is not liable for business losses resulting from stockouts, overstocking, or system downtime. 
              We strive for 99.9% uptime but do not guarantee uninterrupted service.
            </p>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-[#f0f4f0] text-center">
          <Link href="/auth" className="text-[#00694c] font-black hover:underline">Accept & Start Trial</Link>
        </footer>
      </motion.div>
    </div>
  );
}
