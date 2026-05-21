"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { registerOwner, loginUser, registerAttendant, loginUserWithGoogle } from "@/lib/actions/auth";
import { useRouter, useSearchParams } from "next/navigation";

type Language = "en" | "sw";

const translations = {
  en: {
    branding: {
      badge: "AI-Powered for Kenyan SMEs",
      title: "Smart Inventory",
      subtitle: "for Every Shop.",
      desc: "Never run out of stock again. Akiba AI predicts what you need, when you need it — in English or Kiswahili.",
      features: [
        { icon: "insights", text: "AI demand forecasting" },
        { icon: "translate", text: "English & Kiswahili support" },
        { icon: "wifi_off", text: "Works fully offline" },
      ],
      testimonial: "Akiba AI showed me I was losing KES 12,000 a month to dead stock. I fixed it in a week.",
      owner: "Wanjiku M.",
      location: "Mini-Mart Owner · Eldoret"
    },
    form: {
      loginGreeting: "Welcome back",
      registerGreeting: "Create your account",
      loginDesc: "Sign in to manage your inventory with AI.",
      registerDesc: "Join 500+ Kenyan businesses on Akiba AI.",
      loginTab: "Login",
      registerTab: "Register",
      phoneLabel: "Phone Number (M-Pesa linked)",
      emailLabel: "Business Email",
      pinLabel: "PIN / Password",
      forgotPin: "Forgot PIN?",
      signInBtn: "Sign In",
      createAccountBtn: "Create My Account",
      or: "OR",
      googleBtn: "Continue with Google",
      newTo: "New to Akiba AI?",
      alreadyHave: "Already have an account?",
      fullName: "Full Name",
      storeName: "Store Name",
      role: "Your Role",
      langLabel: "Language",
      ownerRole: "Owner",
      attendantRole: "Attendant",
      backHome: "Back to Home",
      aiAccent: "Akiba AI predicts stock needs, flags dead stock, and explains your P&L in plain language — in English or Kiswahili."
    }
  },
  sw: {
    branding: {
      badge: "Inatumia AI kwa Biashara za Kenya",
      title: "Inventori ya Kidijitali",
      subtitle: "kwa Kila Duka.",
      desc: "Usiishiwe na bidhaa tena. Akiba AI inatabiri unachohitaji, wakati unapokihitaji — kwa Kiingereza au Kiswahili.",
      features: [
        { icon: "insights", text: "Utabiri wa mahitaji wa AI" },
        { icon: "translate", text: "Msaada wa Kiingereza na Kiswahili" },
        { icon: "wifi_off", text: "Inafanya kazi bila mtandao" },
      ],
      testimonial: "Akiba AI ilinionyesha nilikuwa nikipoteza KES 12,000 kila mwezi kwa bidhaa zisizouzika. Nilirekebisha kwa wiki moja tu.",
      owner: "Wanjiku M.",
      location: "Mmiliki wa Mini-Mart · Eldoret"
    },
    form: {
      loginGreeting: "Karibu tena",
      registerGreeting: "Fungua akaunti yako",
      loginDesc: "Ingia ili usimamie bidhaa zako kwa AI.",
      registerDesc: "Jiunge na biashara 500+ za Kenya kwenye Akiba AI kama mmiliki.",
      loginTab: "Ingia",
      registerTab: "Jisajili",
      phoneLabel: "Nambari ya Simu (M-Pesa)",
      emailLabel: "Barua Pepe ya Biashara",
      pinLabel: "PIN / Nenosiri",
      forgotPin: "Umesahau PIN?",
      signInBtn: "Ingia",
      createAccountBtn: "Fungua Akaunti Yangu",
      or: "AU",
      googleBtn: "Endelea na Google",
      newTo: "Mgeni kwenye Akiba AI?",
      alreadyHave: "Tayari una akaunti?",
      fullName: "Jina Kamili",
      storeName: "Jina la Duka",
      role: "Wajibu Wako",
      langLabel: "Lugha",
      ownerRole: "Mmiliki",
      attendantRole: "Mhudumu",
      backHome: "Rudi Mwanzo",
      aiAccent: "Akiba AI inatabiri mahitaji ya bidhaa, inaonyesha bidhaa zisizouzika, na kuelezea faida na hasara kwa lugha rahisi."
    }
  }
};

export default function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const modeParam = searchParams.get("mode");
  
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<Language>("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nameVal, setNameVal] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleInfoMsg, setGoogleInfoMsg] = useState<string | null>(null);

  const [password, setPassword] = useState("");

  // Parse JWT token safely
  function parseJwt(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  const handleGoogleCallback = async (response: any) => {
    const decoded = parseJwt(response.credential);
    if (!decoded) {
      setError("Failed to decode Google account details.");
      return;
    }

    const { email, name } = decoded;

    if (mode === "login") {
      setLoading(true);
      setError(null);
      try {
        const res = await loginUserWithGoogle(email);
        if (res.error) {
          setError(res.error);
        } else if (res.success) {
          router.push("/dashboard");
        }
      } catch (err: any) {
        setError(err.message || "Failed to log in with Google.");
      } finally {
        setLoading(false);
      }
    } else {
      setNameVal(name || "");
      setEmailVal(email || "");
      setGoogleEmail(email || "");
      setGoogleInfoMsg("Google Account connected! Please enter your M-Pesa phone number and Store Name to complete registration.");
      setError(null);

      // Focus phone number input
      setTimeout(() => {
        const phoneInput = document.getElementsByName("phone")[0] as HTMLInputElement;
        if (phoneInput) {
          phoneInput.focus();
        }
      }, 200);
    }
  };

  // Clear Google details if user toggles mode manually
  useEffect(() => {
    setGoogleEmail("");
    setGoogleInfoMsg(null);
    setNameVal("");
    setEmailVal("");
  }, [mode]);

  // Load Google script and button
  useEffect(() => {
    const initGoogle = () => {
      const g = (window as any).google;
      if (!g) return;

      g.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1036071473667-27bblb266m502s5i9vsqbdf5iicq53f6.apps.googleusercontent.com",
        callback: handleGoogleCallback,
      });

      const btnParent = document.getElementById("google-signin-btn");
      if (btnParent) {
        g.accounts.id.renderButton(btnParent, {
          theme: "outline",
          size: "large",
          width: btnParent.clientWidth || 360,
          text: "continue_with",
          shape: "pill",
        });
      }
    };

    if (typeof window !== "undefined") {
      const g = (window as any).google;
      if (!g) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        document.body.appendChild(script);
      } else {
        const timeout = setTimeout(initGoogle, 100);
        return () => clearTimeout(timeout);
      }
    }
  }, [mode, googleEmail]);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    number: false,
    special: false,
    case: false
  });

  const validatePassword = (pass: string) => {
    setPassword(pass);
    setPasswordStrength({
      length: pass.length >= 8,
      number: /[0-9]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass),
      case: /[A-Z]/.test(pass) && /[a-z]/.test(pass),
    });
  };

  useEffect(() => {
    if (inviteToken) {
      setMode("register");
    } else if (modeParam === "register") {
      setMode("register");
    }
  }, [inviteToken, modeParam]);

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (googleEmail) {
      formData.append("isGoogleRegister", "true");
    }
    
    let result;
    if (mode === "register") {
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const phone = formData.get("phone") as string;

      if (!name || name.trim().length < 3) {
        setLoading(false);
        setError("Name must be at least 3 characters long");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setLoading(false);
        setError("Please enter a valid email address");
        return;
      }

      // Phone validation (Kenyan formats: 07..., 01..., 254...)
      const cleanPhone = phone.trim().replace(/\s/g, "");
      const phoneRegex = /^(07|01|2547|2541)\d{8}$/;
      if (!phoneRegex.test(cleanPhone)) {
        setLoading(false);
        setError("Please enter a valid Kenyan phone number (e.g., 0712345678)");
        return;
      }

      if (!googleEmail) {
        const passwordVal = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        // Password strength validation
        const isPassStrong = passwordVal.length >= 8 &&
                             /[0-9]/.test(passwordVal) &&
                             /[^A-Za-z0-9]/.test(passwordVal) &&
                             /[A-Z]/.test(passwordVal) &&
                             /[a-z]/.test(passwordVal);

        if (!isPassStrong) {
          setLoading(false);
          setError("Password is too weak. It must be at least 8 characters and include uppercase, lowercase, a number, and a special character.");
          return;
        }

        if (passwordVal !== confirmPassword) {
          setLoading(false);
          setError("Passwords do not match");
          return;
        }
      }

      if (inviteToken) {
        formData.append("inviteToken", inviteToken);
        result = await registerAttendant(formData);
      } else {
        result = await registerOwner(formData);
      }
    } else {
      result = await loginUser(formData);
    }

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-white" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── LEFT PANEL: Branding ── */}
      <div className="hidden lg:flex w-[520px] flex-shrink-0 flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #00694c 0%, #004d38 50%, #1a0a6e 100%)" }}>

        {/* Floating 3D Elements */}
        {[
          { size: 96, top: -24, left: -24, color: "#86f8c9", delay: 0 },
          { size: 80, bottom: 0, right: 0, color: "#958dff", delay: 1 },
          { size: 64, top: "50%", right: -16, color: "#68dbae", delay: 2 },
        ].map((circle: { size: number, top?: number | string, bottom?: number | string, left?: number | string, right?: number | string, color: string, delay: number }, i: number) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 6 + i, 
              repeat: Infinity, 
              delay: circle.delay,
              ease: "easeInOut"
            }}
            className="absolute rounded-full opacity-20 pointer-events-none"
            style={{ 
              width: circle.size * 4, 
              height: circle.size * 4, 
              top: circle.top, 
              left: circle.left, 
              right: circle.right, 
              bottom: circle.bottom,
              background: `radial-gradient(circle, ${circle.color}, transparent)` 
            }}
          />
        ))}

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5 mb-4"
          >
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px]">wallet</span>
            </div>
            <span className="text-white font-black tracking-tight">Akiba<span style={{ color: "#86f8c9" }}>AI</span></span>
          </motion.div>

          {/* Main copy */}
          <div className="mt-auto mb-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 bg-[#86f8c9]/20 text-[#86f8c9] border border-[#86f8c9]/30"
            >
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              {t.branding.badge}
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-black text-white leading-tight mb-4"
            >
              {t.branding.title}<br />
              <span style={{ color: "#86f8c9" }}>{t.branding.subtitle}</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base leading-relaxed mb-8 text-white/70"
            >
              {t.branding.desc}
            </motion.p>

            <div className="flex flex-col gap-4">
              {t.branding.features.map((f: { icon: string; text: string }, i: number) => (
                <motion.div 
                  key={f.text} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/10 group-hover:bg-[#86f8c9]/20 transition-colors">
                    <span className="material-symbols-outlined text-[20px]" style={{ color: "#86f8c9" }}>{f.icon}</span>
                  </div>
                  <span className="text-sm font-bold text-white/90">{f.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-auto bg-white/10 backdrop-blur-xl rounded-[24px] p-6 border border-white/20 shadow-2xl"
          >
            <div className="text-yellow-400 text-sm mb-3">★★★★★</div>
            <p className="text-sm font-medium leading-relaxed mb-4 text-white/90 italic">
              &ldquo;{t.branding.testimonial}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black bg-[#86f8c9]/30 text-[#86f8c9]">W</div>
              <div>
                <p className="text-xs font-black text-white">{t.branding.owner}</p>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">{t.branding.location}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Form ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">

        {/* Language & Nav Header */}
        <div className="flex items-center justify-between px-6 py-6 lg:px-10">
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <span className="text-xl font-black text-[#00694c]">Akiba <span className="text-[#584fbc]">AI</span></span>
          </Link>
          <div className="hidden lg:block">
            <Link href="/" className="text-xs font-black text-[#584fbc] hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              {t.form.backHome}
            </Link>
          </div>
          <div className="flex bg-[#f0f4f0] p-1 rounded-full border border-[#bccac1]">
            <button 
              onClick={() => setLang("en")}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${lang === "en" ? "bg-[#00694c] text-white shadow-md" : "text-[#6d7a73] hover:text-[#00694c]"}`}
            >EN</button>
            <button 
              onClick={() => setLang("sw")}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${lang === "sw" ? "bg-[#00694c] text-white shadow-md" : "text-[#6d7a73] hover:text-[#00694c]"}`}
            >SW</button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >

            {/* Greeting */}
            <div className="mb-10 text-center">
              <motion.h2 
                key={mode}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-black mb-3 text-[#171d1a]"
              >
                {mode === "login" ? t.form.loginGreeting : t.form.registerGreeting}
              </motion.h2>
              <p className="text-base text-[#6d7a73] font-medium leading-relaxed">
                {mode === "login" ? t.form.loginDesc : t.form.registerDesc}
              </p>
            </div>

            {/* Tab Toggle */}
            <div className="flex p-1.5 bg-[#f0f4f0] rounded-[18px] mb-8 border border-[#bccac1]">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${mode === "login" ? "bg-white text-[#00694c] shadow-lg shadow-black/5" : "text-[#6d7a73]"}`}
              >
                {t.form.loginTab}
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${mode === "register" ? "bg-white text-[#00694c] shadow-lg shadow-black/5" : "text-[#6d7a73]"}`}
              >
                {t.form.registerTab}
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </motion.div>
              )}
              {googleInfoMsg && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {googleInfoMsg}
                </motion.div>
              )}
              {mode === "register" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">{t.form.fullName}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">person</span>
                      <input type="text" placeholder="Wanjiku Maina" name="name" required
                        value={nameVal}
                        onChange={(e) => setNameVal(e.target.value)}
                        readOnly={!!googleEmail}
                        className={`w-full h-14 pl-12 pr-4 border-2 border-[#bccac1] rounded-2xl text-sm font-medium outline-none focus:border-[#00694c] focus:bg-white transition-all shadow-sm ${
                          googleEmail ? "bg-[#e4eae4] cursor-not-allowed" : "bg-[#f5fbf5]"
                        }`} />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">{t.form.emailLabel}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">mail</span>
                      <input type="email" placeholder="wanjiku@gmail.com" name="email" required
                        value={emailVal}
                        onChange={(e) => setEmailVal(e.target.value)}
                        readOnly={!!googleEmail}
                        className={`w-full h-14 pl-12 pr-4 border-2 border-[#bccac1] rounded-2xl text-sm font-medium outline-none focus:border-[#00694c] focus:bg-white transition-all shadow-sm ${
                          googleEmail ? "bg-[#e4eae4] cursor-not-allowed" : "bg-[#f5fbf5]"
                        }`} />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">Phone Number</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">call</span>
                      <input type="tel" placeholder="0712345678" name="phone" required
                        className="w-full h-14 pl-12 pr-4 bg-[#f5fbf5] border-2 border-[#bccac1] rounded-2xl text-sm font-medium outline-none focus:border-[#00694c] focus:bg-white transition-all shadow-sm" />
                    </div>
                  </div>
                  {!googleEmail && (
                    <>
                      <div className="group">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">{t.form.pinLabel}</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">lock</span>
                          <input type={showPassword ? "text" : "password"} placeholder="••••••••" name="password" required={!googleEmail}
                            value={password}
                            onChange={(e) => validatePassword(e.target.value)}
                            className="w-full h-14 pl-12 pr-12 bg-[#f5fbf5] border-2 border-[#bccac1] rounded-2xl text-sm font-medium outline-none focus:border-[#00694c] focus:bg-white transition-all shadow-sm" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bccac1] hover:text-[#00694c] transition-colors">
                            <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                          </button>
                        </div>
                        {/* Password Strength Indicators */}
                        {password.length > 0 && (
                          <div className="mt-2.5 p-3.5 bg-[#f8faf9] border border-[#e4eae4] rounded-2xl space-y-1.5 text-[11px] font-bold text-[#6d7a73] transition-all">
                            <p className="text-[10px] font-black uppercase tracking-wider text-[#3d4943] mb-1">Password Requirements:</p>
                            <div className="flex items-center gap-2">
                              <span className={`material-symbols-outlined text-[14px] ${passwordStrength.length ? "text-emerald-600 font-bold" : "text-rose-500"}`}>
                                {passwordStrength.length ? "check_circle" : "cancel"}
                              </span>
                              <span className={passwordStrength.length ? "text-[#171d1a]" : "text-[#6d7a73]"}>At least 8 characters</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`material-symbols-outlined text-[14px] ${passwordStrength.case ? "text-emerald-600 font-bold" : "text-rose-500"}`}>
                                {passwordStrength.case ? "check_circle" : "cancel"}
                              </span>
                              <span className={passwordStrength.case ? "text-[#171d1a]" : "text-[#6d7a73]"}>Uppercase & lowercase letters</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`material-symbols-outlined text-[14px] ${passwordStrength.number ? "text-emerald-600 font-bold" : "text-rose-500"}`}>
                                {passwordStrength.number ? "check_circle" : "cancel"}
                              </span>
                              <span className={passwordStrength.number ? "text-[#171d1a]" : "text-[#6d7a73]"}>At least one number</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`material-symbols-outlined text-[14px] ${passwordStrength.special ? "text-emerald-600 font-bold" : "text-rose-500"}`}>
                                {passwordStrength.special ? "check_circle" : "cancel"}
                              </span>
                              <span className={passwordStrength.special ? "text-[#171d1a]" : "text-[#6d7a73]"}>At least one special character</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="group">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">Confirm Password</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">lock_reset</span>
                          <input type={showPassword ? "text" : "password"} placeholder="••••••••" name="confirmPassword" required={!googleEmail}
                            className="w-full h-14 pl-12 pr-12 bg-[#f5fbf5] border-2 border-[#bccac1] rounded-2xl text-sm font-medium outline-none focus:border-[#00694c] focus:bg-white transition-all shadow-sm" />
                        </div>
                      </div>
                    </>
                  )}
                  {!inviteToken && (
                    <div className="group">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">{t.form.storeName}</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">storefront</span>
                        <input type="text" placeholder="Eldo Groceries" name="storeName" required={!inviteToken}
                          className="w-full h-14 pl-12 pr-4 bg-[#f5fbf5] border-2 border-[#bccac1] rounded-2xl text-sm font-medium outline-none focus:border-[#00694c] focus:bg-white transition-all shadow-sm" />
                      </div>
                    </div>
                  )}

                </motion.div>
              )}

              {mode === "login" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">{t.form.emailLabel}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">mail</span>
                      <input type="email" placeholder="owner@business.com" name="email" required
                        className="w-full h-14 pl-12 pr-4 bg-[#f5fbf5] border-2 border-[#bccac1] rounded-2xl text-sm font-medium outline-none focus:border-[#00694c] focus:bg-white transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">{t.form.pinLabel}</label>
                      <button type="button" className="text-[10px] font-black uppercase tracking-widest text-[#584fbc] hover:underline">{t.form.forgotPin}</button>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">lock</span>
                      <input type={showPassword ? "text" : "password"} placeholder="••••" name="password" required
                        className="w-full h-14 pl-12 pr-12 bg-[#f5fbf5] border-2 border-[#bccac1] rounded-2xl text-xl font-black outline-none focus:border-[#00694c] focus:bg-white transition-all shadow-sm tracking-[0.4em]" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bccac1] hover:text-[#00694c] transition-colors">
                        <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              <button type="submit" disabled={loading} className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#00694c] to-[#008560] shadow-xl shadow-[#00694c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100">
                {loading ? "..." : (mode === "login" ? t.form.signInBtn : t.form.createAccountBtn)}
                {!loading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#dee4de]"></div></div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-[#6d7a73]">{t.form.or}</span></div>
              </div>

              <div className="w-full flex justify-center">
                <div id="google-signin-btn" className="w-full flex justify-center"></div>
              </div>

              <p className="text-center text-sm font-medium text-[#6d7a73]">
                {mode === "login" ? t.form.newTo : t.form.alreadyHave}{" "}
                <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-black text-[#584fbc] hover:underline">
                  {mode === "login" ? t.form.registerTab : t.form.loginTab}
                </button>
              </p>
            </form>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 p-5 rounded-2xl bg-[#584fbc]/5 border-l-4 border-[#584fbc] flex gap-4"
            >
              <span className="material-symbols-outlined text-[24px] text-[#584fbc] fill-1 flex-shrink-0">auto_awesome</span>
              <p className="text-[11px] font-medium leading-relaxed text-[#3d4943]">
                {t.form.aiAccent}
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div className="py-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-[#bccac1]">
          &copy; 2026 Akiba AI &nbsp;·&nbsp; Secure &amp; Encrypted
        </div>
      </div>
    </div>
  );
}
