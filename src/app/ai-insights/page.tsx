"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/topbar";

const quickPrompts = [
  "📊 Show my P&L",
  "⚠️ What's low on stock?",
  "🏆 Best seller this month",
  "💀 Show dead stock",
  "📦 What should I reorder?",
  "💰 Am I making profit?",
  "📈 Sales trend this week",
  "🛒 Slow-moving products",
];

const topSellers = [
  { rank: 1, name: "Sugar 1kg", amount: "12,400" },
  { rank: 2, name: "Unga wa Ngano", amount: "10,800" },
  { rank: 3, name: "Cooking Oil 2L", amount: "9,200" },
  { rank: 4, name: "Broiler Feed 50kg", amount: "8,100" },
  { rank: 5, name: "DAP Fertilizer", amount: "6,900" },
];

interface Message {
  role: "ai" | "user";
  text: string;
  time: string;
  type?: "analysis" | "table" | "warning";
  data?: any;
}

export default function AIInsightsPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Habari! 👋 Mimi ni StockSense AI. Ninaweza kukusaidia kuelewa biashara yako. Ask me anything about your inventory, sales, or finances — in English or Kiswahili!",
      time: "Just now",
    },
    {
      role: "user",
      text: "What was my best-selling item this week?",
      time: "2 min ago",
    },
    {
      role: "ai",
      type: "analysis",
      text: "Your top performer this week was Sugar 1kg with 96 units sold, generating KES 12,480 in revenue. This is 23% higher than last week — consider ordering an extra 50 units before the weekend rush.",
      time: "2 min ago",
      data: { label: "Sugar 1kg", progress: 85 },
    },
    {
      role: "user",
      text: "Je, kuna bidhaa zinazoisha hivi sasa?",
      time: "1 min ago",
    },
    {
      role: "ai",
      type: "warning",
      text: "Ndiyo! Kuna bidhaa 3 zinazohitaji restock haraka:\n• Cooking Oil 2L — imekwisha kabisa (0 units)\n• Nails 4-inch — units 5 zimebaki (chini ya kiwango cha 10)\n• Broiler Feed 50kg — units 3 zimebaki\nNapendekeza uagize leo ili usipoteze mauzo ya kesho.",
      time: "1 min ago",
    },
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      role: "user",
      text: text,
      time: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    // Mock AI response
    setTimeout(() => {
      setIsThinking(false);
      let aiResponse: Message = {
        role: "ai",
        text: "I'm analyzing your data now. Based on your recent transactions, everything looks stable, but I've noticed a slight drop in weekend traffic. Would you like a more detailed P&L breakdown?",
        time: "Just now",
      };

      if (text.toLowerCase().includes("dead") || text.toLowerCase().includes("slow")) {
        aiResponse = {
          role: "ai",
          type: "table",
          text: "Here are products that haven't sold in the last 90+ days:",
          time: "Just now",
          data: [
            { p: "Wire Mesh 1m", l: "97 days ago", s: "32 units", c: "27,200" },
            { p: "Cement 50kg", l: "112 days ago", s: "8 units", c: "32,000" },
          ]
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
    }, 2000);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 md:ml-[240px] flex flex-col min-w-0">
        <TopBar title="AI Insights" />

        <main className="flex-1 p-margin-mobile md:p-lg grid md:grid-cols-[320px_1fr] gap-md max-w-7xl mx-auto w-full h-[calc(100vh-64px)] overflow-hidden">
          {/* LEFT PANEL: QUICK INSIGHTS */}
          <div className="hidden md:flex bg-surface-container-lowest rounded-xl border border-outline-variant h-full flex-col p-md overflow-y-auto shadow-sm">
            <h2 className="text-h2 font-black text-on-surface mb-md">Quick Insights</h2>

            {/* P&L Summary Card */}
            <div className="bg-primary-container text-on-primary-container p-md rounded-xl mb-md shadow-sm">
              <span className="text-label-caps font-black opacity-80 mb-sm block uppercase tracking-wider">This Week&apos;s Performance</span>
              <div className="grid grid-cols-3 gap-xs text-center">
                <div className="flex flex-col">
                  <span className="text-[16px] font-black">84.2K</span>
                  <span className="text-[10px] font-bold opacity-70 uppercase">Rev</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[16px] font-black">61.4K</span>
                  <span className="text-[10px] font-bold opacity-70 uppercase">Costs</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[16px] font-black text-primary-fixed">22.8K</span>
                  <span className="text-[10px] font-bold opacity-70 uppercase">Profit</span>
                </div>
              </div>
              <div className="mt-md pt-sm border-t border-white/10 flex justify-center">
                <span className="text-primary-fixed font-black text-label-caps">↑ 8% vs last week</span>
              </div>
            </div>

            <span className="text-label-caps text-on-surface-variant font-black uppercase mb-sm tracking-widest text-[10px]">Ask a question:</span>
            <div className="flex flex-wrap gap-xs mb-md">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="bg-surface-container border border-outline-variant rounded-full px-sm py-base text-label-caps font-bold text-on-surface hover:bg-secondary-container hover:text-on-secondary-container hover:border-secondary transition-all active:scale-95 shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <span className="text-label-caps text-on-surface-variant font-black uppercase mb-sm tracking-widest text-[10px]">Top 5 Sellers</span>
            <div className="space-y-xs">
              {topSellers.map((item) => (
                <div key={item.rank} className="flex items-center justify-between py-xs border-b border-outline-variant/30 last:border-0">
                  <div className="flex items-center gap-sm">
                    <div className="w-6 h-6 rounded-full bg-primary text-on-primary font-black text-[11px] flex items-center justify-center">
                      {item.rank}
                    </div>
                    <span className="text-body-md font-medium text-on-surface">{item.name}</span>
                  </div>
                  <span className="text-body-md font-black text-on-surface">KES {item.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL: CHAT INTERFACE */}
          <div className="flex flex-col h-full bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
            <header className="flex items-center justify-between px-md py-sm border-b border-outline-variant bg-surface-container-low/50">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-on-secondary fill-1 text-[20px]">auto_awesome</span>
                </div>
                <div>
                  <h2 className="text-body-lg font-black text-on-surface leading-none">Akiba AI</h2>
                  <span className="text-primary font-black text-[10px] uppercase tracking-widest">● Online</span>
                </div>
              </div>
              <div className="bg-surface-container rounded-full flex p-0.5 border border-outline-variant">
                <button className="px-sm py-base font-black text-[10px] bg-primary text-on-primary rounded-full uppercase transition-all">EN</button>
                <button className="px-sm py-base font-black text-[10px] text-on-surface-variant rounded-full uppercase hover:bg-surface-container-high transition-all">SW</button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-md py-md space-y-md bg-background/30 scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}>
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center mr-sm mt-1 shadow-sm flex-shrink-0">
                      <span className="material-symbols-outlined text-on-secondary text-[16px] fill-1">auto_awesome</span>
                    </div>
                  )}
                  <div className={`max-w-[85%] md:max-w-[80%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`p-md rounded-[16px] shadow-sm ${
                        msg.role === "user"
                          ? "bg-primary text-on-primary rounded-tr-[4px]"
                          : "bg-surface-container-lowest border border-outline-variant text-on-surface rounded-tl-[4px]"
                      }`}
                    >
                      {msg.type === "analysis" && (
                        <div className="inline-flex items-center gap-xs bg-secondary/10 text-secondary font-black text-[10px] rounded-full px-sm py-base mb-sm uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[14px] fill-1">auto_awesome</span>
                          AI Analysis
                        </div>
                      )}
                      
                      <div className="whitespace-pre-wrap text-body-md font-medium leading-relaxed">{msg.text}</div>

                      {msg.data && msg.type === "analysis" && (
                        <div className="mt-md space-y-xs">
                          <div className="flex justify-between text-[10px] font-black uppercase opacity-70">
                            <span>{msg.data.label}</span>
                            <span>{msg.data.progress}% Trend</span>
                          </div>
                          <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${msg.data.progress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {msg.type === "table" && (
                        <div className="mt-md overflow-hidden rounded-xl border border-outline-variant">
                          <table className="w-full text-[11px] border-collapse">
                            <thead className="bg-surface-container-high border-b border-outline-variant">
                              <tr>
                                <th className="p-xs text-left font-black uppercase">Product</th>
                                <th className="p-xs text-left font-black uppercase">Last Sold</th>
                                <th className="p-xs text-right font-black uppercase">Stock</th>
                                <th className="p-xs text-right font-black uppercase">Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                              {msg.data.map((row: any, ri: number) => (
                                <tr key={ri} className="bg-white">
                                  <td className="p-xs font-bold">{row.p}</td>
                                  <td className="p-xs opacity-70">{row.l}</td>
                                  <td className="p-xs text-right">{row.s}</td>
                                  <td className="p-xs text-right font-bold">KES {row.c}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-sm bg-surface-container-low flex flex-col gap-sm">
                             <p className="text-[11px] font-medium text-on-surface-variant italic">Consider running a 10-15% clearance on these to free up KES 59,200.</p>
                             <button className="bg-secondary text-on-secondary rounded-lg h-[36px] px-sm font-black text-[10px] uppercase tracking-wider shadow-sm active:scale-95 transition-transform">Suggest a clearance strategy</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase mt-xs ${msg.role === "user" ? "text-on-surface-variant" : "text-on-surface-variant opacity-60"}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start animate-fade-in-up">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center mr-sm mt-1 shadow-sm">
                    <span className="material-symbols-outlined text-on-secondary text-[16px] fill-1">auto_awesome</span>
                  </div>
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-[16px] rounded-tl-[4px] p-md flex items-center gap-xs h-[44px] shadow-sm">
                    <div className="w-2 h-2 bg-on-surface-variant/40 rounded-full animate-bounce [animation-delay:0s]"></div>
                    <div className="w-2 h-2 bg-on-surface-variant/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-on-surface-variant/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-outline-variant bg-surface p-md">
              <form 
                className="flex items-end gap-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                  placeholder="Ask about your stock, sales, or profit..."
                  className="flex-1 min-h-[48px] max-h-[120px] resize-none bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all overflow-y-auto"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  className="w-[48px] h-[48px] bg-primary text-on-primary rounded-xl flex items-center justify-center hover:opacity-90 active:scale-[0.95] transition-all disabled:opacity-30 shadow-sm flex-shrink-0"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
