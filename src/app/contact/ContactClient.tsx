"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { sendContactEmail } from "@/lib/actions/contact";

export default function ContactClient() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simple validation
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      setError("Please fill out all the required fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await sendContactEmail(form);
      if (res.error) {
        setError(res.error);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } },
  } as const;

  return (
    <div className="min-h-screen bg-[#f5fbf5] flex flex-col justify-between relative overflow-x-hidden selection:bg-[#00694c] selection:text-white">
      {/* Decorative gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00694c]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-[#584fbc]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-[#00694c]/10 z-50 flex items-center justify-between px-6 md:px-12 shadow-sm">
        <Link href="/" className="text-xl font-black tracking-tighter flex items-center gap-2">
          <div className="w-7 h-7 bg-[#00694c] rounded-lg flex items-center justify-center">
            <span className="text-white text-lg font-black">A</span>
          </div>
          <span className="text-[#171d1a]">
            Akiba<span className="text-[#00694c]">AI</span>
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

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 bg-white rounded-[32px] sm:rounded-[40px] border border-[#e4eae4] shadow-2xl p-6 sm:p-10 md:p-12"
        >
          {/* Left Column: Contact Information */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-10 md:space-y-0 pr-0 md:pr-4">
            <div>
              <span className="text-[10px] font-black text-[#00694c] uppercase tracking-[0.25em] bg-[#f0fdf4] px-4 py-2 rounded-full border border-[#00694c]/10">
                Get in Touch
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-[#171d1a] tracking-tight mt-6 mb-4">
                Let&apos;s build <br className="hidden md:block"/>something great.
              </h1>
              <p className="text-sm font-medium text-[#6d7a73] leading-relaxed">
                Have questions about how Akiba AI can automate your shop&apos;s inventory, predict stockouts, or sync dynamic payment methods? Our team is here to assist.
              </p>
            </div>

            {/* Contact Details List */}
            <div className="space-y-6">
              {/* Phone Contacts */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 bg-[#f0fdf4] border border-[#d1ebd7] text-[#00694c] rounded-2xl flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">call</span>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#6d7a73]">Call or WhatsApp Us</h4>
                  <div className="mt-1 space-y-1">
                    <a 
                      href="tel:07086633288" 
                      className="block text-sm font-black text-[#171d1a] hover:text-[#00694c] transition-colors"
                    >
                      07086633288
                    </a>
                    <a 
                      href="tel:0708992882" 
                      className="block text-sm font-black text-[#171d1a] hover:text-[#00694c] transition-colors"
                    >
                      0708992882
                    </a>
                  </div>
                </div>
              </div>

              {/* Email Contact */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 bg-[#f4f2ff] border border-[#e0dcff] text-[#584fbc] rounded-2xl flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">mail</span>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#6d7a73]">Email Support</h4>
                  <a 
                    href="mailto:akibaai.eh@gmail.com" 
                    className="block text-sm font-black text-[#171d1a] hover:text-[#00694c] transition-colors mt-1"
                  >
                    akibaai.eh@gmail.com
                  </a>
                </div>
              </div>

              {/* Location Card */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">location_on</span>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#6d7a73]">Main Region</h4>
                  <p className="text-sm font-black text-[#171d1a] mt-1">
                    Eldoret, Uasin Gishu County, Kenya
                  </p>
                </div>
              </div>
            </div>

            {/* Small Footer Signature */}
            <div className="hidden md:block text-[10px] font-black text-[#bccac1] uppercase tracking-[0.2em]">
              &copy; 2026 Akiba AI. Secure Connection.
            </div>
          </div>

          {/* Right Column: Contact Form Panel */}
          <div className="md:col-span-7 bg-[#f8faf9] border border-[#e4eae4] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00a87a]/5 to-transparent rounded-bl-[100px] pointer-events-none" />

            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="contact-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <h3 className="text-lg font-black text-[#171d1a] mb-2">Send us a message</h3>

                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                      {error}
                    </div>
                  )}

                  {/* Name field */}
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">
                        person
                      </span>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. John Mwangi"
                        className="w-full h-12 pl-11 pr-4 bg-white border border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] transition-all"
                      />
                    </div>
                  </div>

                  {/* Email & Phone grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">
                        Email Address
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">
                          mail
                        </span>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="john@example.com"
                          className="w-full h-12 pl-11 pr-4 bg-white border border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] transition-all"
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">
                        Phone Number
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">
                          call
                        </span>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          required
                          placeholder="e.g. 0712345678"
                          className="w-full h-12 pl-11 pr-4 bg-white border border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message field */}
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">
                      Your Message
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-4 text-[18px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">
                        chat_bubble
                      </span>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        placeholder="Tell us about your business or support requests..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[#171d1a] hover:bg-black text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 shadow-lg shadow-black/10 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Inquiry...
                      </>
                    ) : (
                      <>
                        Send Inquiry
                        <span className="material-symbols-outlined text-[16px]">send</span>
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-10 space-y-5"
                >
                  <div className="w-16 h-16 bg-[#f0fdf4] text-[#00694c] border border-[#d1ebd7] rounded-full flex items-center justify-center shadow-md animate-bounce">
                    <span className="material-symbols-outlined text-[32px]">check_circle</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#171d1a]">Message Sent Successfully!</h3>
                    <p className="text-xs text-[#6d7a73] font-medium leading-relaxed max-w-sm mt-2">
                      Thank you for contacting Akiba AI, {form.name}. Our customer support desk will reach back to you at {form.email} or {form.phone} shortly.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setForm({ name: "", email: "", phone: "", message: "" });
                      setSubmitted(false);
                    }}
                    className="bg-[#00a87a]/10 hover:bg-[#00a87a]/20 border border-[#00a87a]/20 text-[#00694c] px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* footer bar */}
      <footer className="w-full bg-[#171d1a] border-t border-white/5 py-6 px-6 text-center text-[10px] text-[#6d7a73] uppercase tracking-[0.25em]">
        Akiba AI &copy; 2026. Designed for Uasin Gishu County SMEs.
      </footer>
    </div>
  );
}
