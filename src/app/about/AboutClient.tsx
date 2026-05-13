"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const team = [
  { name: "Sandra Chelangat", role: "Frontend Developer & Designer", icon: "brush" },
  { name: "Timothy Kipchirchir", role: "Frontend Developer", icon: "code_blocks" },
  { name: "Brian Mwaura", role: "Backend Developer", icon: "database" },
  { name: "Japheth Some", role: "Backend Developer", icon: "terminal" },
  { name: "Fred Ondonga", role: "Backend Developer", icon: "settings_ethernet" },
  { name: "Berryline Kemunto", role: "Backend Developer", icon: "storage" },
  { name: "Wiclife Ongo", role: "Testing and AI", icon: "precision_manufacturing" },
];

export default function AboutClient() {
  return (
    <div className="min-h-screen bg-[#f5fbf5] flex flex-col items-center py-20 px-6">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-[#bccac1] z-50 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="text-2xl font-black text-[#00694c]">
          Akiba <span className="text-[#584fbc]">AI</span>
        </Link>
        <div className="flex gap-6 items-center">
            <Link href="/" className="text-sm font-bold text-[#3d4943] hover:text-[#00694c]">Home</Link>
            <Link href="/auth" className="bg-[#00694c] text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform">
            Get Started
            </Link>
        </div>
      </nav>

      <article className="max-w-4xl w-full mt-10">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl md:text-6xl font-black text-[#171d1a] mb-8 leading-tight text-center">
            The Brains Behind <br/> <span className="text-[#00694c]">Akiba AI</span>
          </h1>
          <p className="text-xl text-[#3d4943] leading-relaxed text-center mb-16 opacity-80">
            We are a group of developers, designers, and thinkers dedicated to digitizing the Kenyan SME landscape through high-fidelity AI solutions.
          </p>
        </motion.header>
        
        <div className="space-y-12 text-lg text-[#3d4943] leading-relaxed mb-20">
          <section>
            <h2 className="text-3xl font-black text-[#171d1a] mb-6">Our Mission</h2>
            <p>
              Akiba AI was born from a simple observation: running a shop in Kenya shouldn't be a game of guesswork. 
              Millions of small business owners lose revenue every day because they either run out of their best-selling stock 
              or have their capital trapped in items that don't move.
            </p>
          </section>

          {/* TEAM SECTION */}
          <section className="py-10">
            <h2 className="text-3xl font-black text-[#171d1a] mb-10 text-center">Meet the Team</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.map((member, i) => (
                <motion.div 
                  key={member.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white p-6 rounded-[24px] border border-[#bccac1] shadow-sm hover:border-[#00694c] hover:shadow-xl transition-all group"
                >
                  <div className="w-12 h-12 bg-[#eff5ef] rounded-xl flex items-center justify-center text-[#00694c] mb-4 group-hover:bg-[#00694c] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">{member.icon}</span>
                  </div>
                  <h3 className="font-black text-[#171d1a] text-lg">{member.name}</h3>
                  <p className="text-sm opacity-60 font-bold">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-black text-[#171d1a] mb-6">Our Vision</h2>
            <p>
              We envision a future where every SME in Africa has the digital tools to thrive, scale, and contribute 
              meaningfully to their local economies. Akiba AI is just the beginning of that journey.
            </p>
          </section>
        </div>

        <footer className="py-10 border-t border-[#bccac1] text-center">
          <Link href="/" className="text-sm font-black text-[#584fbc] hover:underline">Back to Home</Link>
        </footer>
      </article>
    </div>
  );
}
