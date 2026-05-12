"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState<"owner" | "attendant">("owner");
  const [lang, setLang] = useState<"english" | "kiswahili">("english");

  return (
    <div className="min-h-screen w-full flex overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── LEFT PANEL: Branding ── */}
      <div className="hidden lg:flex w-[520px] flex-shrink-0 flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #00694c 0%, #004d38 50%, #1a0a6e 100%)" }}>

        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #86f8c9, transparent)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #958dff, transparent)" }} />
        <div className="absolute top-1/2 -right-16 w-64 h-64 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #68dbae, transparent)" }} />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <span className="material-symbols-outlined text-white text-[22px]">account_balance_wallet</span>
            </div>
            <span className="text-white text-xl font-black tracking-tight">
              Akiba <span style={{ color: "#86f8c9" }}>AI</span>
            </span>
          </div>

          {/* Main copy */}
          <div className="mt-auto mb-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6"
              style={{ background: "rgba(134,248,201,0.15)", color: "#86f8c9", border: "1px solid rgba(134,248,201,0.3)" }}>
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              AI-Powered for Kenyan SMEs
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Smart Inventory<br />
              <span style={{ color: "#86f8c9" }}>for Every Shop.</span>
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
              Never run out of stock again. Akiba AI predicts what you need, when you need it — in English or Kiswahili.
            </p>

            {/* Feature pills */}
            <div className="flex flex-col gap-3">
              {[
                { icon: "insights", text: "AI demand forecasting" },
                { icon: "translate", text: "English & Kiswahili support" },
                { icon: "wifi_off", text: "Works fully offline" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(134,248,201,0.15)" }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: "#86f8c9" }}>{f.icon}</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial card */}
          <div className="mt-auto rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div className="text-yellow-300 text-sm mb-2">★★★★★</div>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.85)" }}>
              &ldquo;Akiba AI showed me I was losing KES 12,000 a month to dead stock. I fixed it in a week.&rdquo;
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                style={{ background: "rgba(134,248,201,0.3)", color: "#86f8c9" }}>W</div>
              <div>
                <p className="text-xs font-bold text-white">Wanjiku M.</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>Mini-Mart Owner · Eldoret</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Form ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-white">

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#00694c" }}>
              <span className="material-symbols-outlined text-white text-[18px]">account_balance_wallet</span>
            </div>
            <span className="font-black text-lg" style={{ color: "#00694c" }}>Akiba <span style={{ color: "#584fbc" }}>AI</span></span>
          </Link>
          <Link href="/" className="text-xs font-bold" style={{ color: "#584fbc" }}>← Back to Home</Link>
        </div>

        {/* Form wrapper */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">

            {/* Greeting */}
            <div className="mb-8">
              <h2 className="text-3xl font-black mb-1" style={{ color: "#171d1a" }}>
                {mode === "login" ? "Welcome back 👋" : "Create your account"}
              </h2>
              <p className="text-sm" style={{ color: "#6d7a73" }}>
                {mode === "login"
                  ? "Sign in to manage your inventory with AI."
                  : "Join 500+ Kenyan businesses on Akiba AI."}
              </p>
            </div>

            {/* Tab Toggle */}
            <div className="flex p-1 rounded-xl mb-8" style={{ background: "#f0f4f0" }}>
              <button
                onClick={() => setMode("login")}
                className="flex-1 py-2.5 rounded-lg text-sm font-black transition-all"
                style={mode === "login"
                  ? { background: "white", color: "#00694c", boxShadow: "0 1px 6px rgba(0,0,0,0.12)" }
                  : { color: "#6d7a73" }}>
                Login
              </button>
              <button
                onClick={() => setMode("register")}
                className="flex-1 py-2.5 rounded-lg text-sm font-black transition-all"
                style={mode === "register"
                  ? { background: "white", color: "#00694c", boxShadow: "0 1px 6px rgba(0,0,0,0.12)" }
                  : { color: "#6d7a73" }}>
                Register
              </button>
            </div>

            {mode === "login" ? (
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {/* Phone */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#3d4943" }}>
                    Phone Number (M-Pesa linked)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: "#6d7a73" }}>phone_iphone</span>
                    <input
                      type="tel"
                      placeholder="07XX XXX XXX"
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "#f5fbf5", border: "1.5px solid #bccac1", color: "#171d1a" }}
                      onFocus={e => e.target.style.borderColor = "#00694c"}
                      onBlur={e => e.target.style.borderColor = "#bccac1"}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#3d4943" }}>
                    PIN / Password
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: "#6d7a73" }}>lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your PIN"
                      className="w-full h-12 pl-11 pr-12 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "#f5fbf5", border: "1.5px solid #bccac1", color: "#171d1a" }}
                      onFocus={e => e.target.style.borderColor = "#00694c"}
                      onBlur={e => e.target.style.borderColor = "#bccac1"}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <span className="material-symbols-outlined text-[20px]" style={{ color: "#6d7a73" }}>
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <button type="button" className="text-xs font-bold" style={{ color: "#584fbc" }}>Forgot PIN?</button>
                  </div>
                </div>

                {/* Login button */}
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-xl font-black text-sm text-white mt-2 active:scale-[0.98] transition-transform"
                  style={{ background: "linear-gradient(135deg, #00694c, #008560)", boxShadow: "0 4px 16px rgba(0,105,76,0.35)" }}>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>

                {/* Divider */}
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px" style={{ background: "#dee4de" }} />
                  <span className="text-xs font-bold" style={{ color: "#6d7a73" }}>OR</span>
                  <div className="flex-1 h-px" style={{ background: "#dee4de" }} />
                </div>

                {/* Google */}
                <button type="button"
                  className="flex items-center justify-center gap-3 w-full h-12 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                  style={{ border: "1.5px solid #bccac1", background: "white", color: "#171d1a" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.26 9.77A7.2 7.2 0 0 1 12 4.8c1.73 0 3.3.62 4.53 1.64L19.9 3.07A11.96 11.96 0 0 0 12 0C7.5 0 3.6 2.66 1.6 6.57l3.66 3.2z"/>
                    <path fill="#34A853" d="M16.04 18.01A7.17 7.17 0 0 1 12 19.2c-2.97 0-5.5-1.8-6.7-4.42L1.6 17.97A11.97 11.97 0 0 0 12 24c3.24 0 6.18-1.2 8.42-3.14l-4.38-2.85z"/>
                    <path fill="#FBBC05" d="M19.89 20.86C22.43 18.56 24 15.47 24 12c0-.78-.1-1.55-.24-2.28H12v4.8h6.72a5.84 5.84 0 0 1-2.68 3.5l4.85 2.84z"/>
                    <path fill="#4285F4" d="M5.3 14.78A7.15 7.15 0 0 1 4.8 12c0-.97.18-1.9.5-2.77L1.6 6.57A11.93 11.93 0 0 0 0 12c0 1.92.45 3.72 1.25 5.32l4.05-2.54z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Switch to register */}
                <p className="text-center text-sm" style={{ color: "#6d7a73" }}>
                  New to Akiba AI?{" "}
                  <button type="button" onClick={() => setMode("register")} className="font-black" style={{ color: "#584fbc" }}>
                    Create account
                  </button>
                </p>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#3d4943" }}>Full Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: "#6d7a73" }}>person</span>
                    <input type="text" placeholder="Business owner full name"
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "#f5fbf5", border: "1.5px solid #bccac1", color: "#171d1a" }}
                      onFocus={e => e.target.style.borderColor = "#00694c"}
                      onBlur={e => e.target.style.borderColor = "#bccac1"} />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#3d4943" }}>Phone Number</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: "#6d7a73" }}>phone_iphone</span>
                    <input type="tel" placeholder="07XX XXX XXX"
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "#f5fbf5", border: "1.5px solid #bccac1", color: "#171d1a" }}
                      onFocus={e => e.target.style.borderColor = "#00694c"}
                      onBlur={e => e.target.style.borderColor = "#bccac1"} />
                  </div>
                </div>

                {/* Store Name */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#3d4943" }}>Store Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: "#6d7a73" }}>storefront</span>
                    <input type="text" placeholder="e.g. Wanjiku General Store"
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "#f5fbf5", border: "1.5px solid #bccac1", color: "#171d1a" }}
                      onFocus={e => e.target.style.borderColor = "#00694c"}
                      onBlur={e => e.target.style.borderColor = "#bccac1"} />
                  </div>
                </div>

                {/* Role + Language side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#3d4943" }}>Your Role</label>
                    <div className="flex gap-2">
                      {(["owner", "attendant"] as const).map((r) => (
                        <button key={r} type="button" onClick={() => setRole(r)}
                          className="flex-1 h-9 rounded-full text-xs font-black capitalize transition-all"
                          style={role === r
                            ? { background: "#00694c", color: "white" }
                            : { background: "#f0f4f0", color: "#6d7a73", border: "1px solid #bccac1" }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#3d4943" }}>Language</label>
                    <div className="flex gap-2">
                      {(["EN", "SW"] as const).map((l) => (
                        <button key={l} type="button" onClick={() => setLang(l === "EN" ? "english" : "kiswahili")}
                          className="flex-1 h-9 rounded-full text-xs font-black transition-all"
                          style={(l === "EN" ? lang === "english" : lang === "kiswahili")
                            ? { background: "#584fbc", color: "white" }
                            : { background: "#f0f4f0", color: "#6d7a73", border: "1px solid #bccac1" }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#3d4943" }}>Create PIN / Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: "#6d7a73" }}>lock</span>
                    <input type={showPassword ? "text" : "password"} placeholder="Create a secure PIN"
                      className="w-full h-12 pl-11 pr-12 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "#f5fbf5", border: "1.5px solid #bccac1", color: "#171d1a" }}
                      onFocus={e => e.target.style.borderColor = "#00694c"}
                      onBlur={e => e.target.style.borderColor = "#bccac1"} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <span className="material-symbols-outlined text-[20px]" style={{ color: "#6d7a73" }}>
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#3d4943" }}>Confirm PIN / Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: "#6d7a73" }}>lock_reset</span>
                    <input type={showConfirm ? "text" : "password"} placeholder="Confirm your PIN"
                      className="w-full h-12 pl-11 pr-12 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "#f5fbf5", border: "1.5px solid #bccac1", color: "#171d1a" }}
                      onFocus={e => e.target.style.borderColor = "#00694c"}
                      onBlur={e => e.target.style.borderColor = "#bccac1"} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <span className="material-symbols-outlined text-[20px]" style={{ color: "#6d7a73" }}>
                        {showConfirm ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button type="button"
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-xl font-black text-sm text-white mt-2 active:scale-[0.98] transition-transform"
                  style={{ background: "linear-gradient(135deg, #00694c, #008560)", boxShadow: "0 4px 16px rgba(0,105,76,0.35)" }}>
                  Create My Account
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>

                <p className="text-center text-sm" style={{ color: "#6d7a73" }}>
                  Already have an account?{" "}
                  <button type="button" onClick={() => setMode("login")} className="font-black" style={{ color: "#584fbc" }}>
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {/* AI Accent */}
            <div className="mt-6 flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: "rgba(88,79,188,0.07)", borderLeft: "3px solid #584fbc" }}>
              <span className="material-symbols-outlined text-[20px] mt-0.5 flex-shrink-0" style={{ color: "#584fbc", fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <p className="text-xs leading-relaxed" style={{ color: "#3d4943" }}>
                <span className="font-black" style={{ color: "#584fbc" }}>Akiba AI</span> predicts stock needs, flags dead stock, and explains your P&amp;L in plain language — in English or Kiswahili.
              </p>
            </div>

            {/* Footer note */}
            <p className="text-center text-[11px] mt-6" style={{ color: "#6d7a73" }}>
              &copy; 2025 Akiba AI &nbsp;·&nbsp; Secure &amp; Encrypted &nbsp;·&nbsp;
              <Link href="/" className="hover:underline" style={{ color: "#584fbc" }}>Back to Home</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
