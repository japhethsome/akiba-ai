"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { TopBar } from "@/components/ui/topbar";

const quickPrompts = [
  "Show my P&L", "What's low on stock?",
  "Best seller this month", "Show dead stock",
  "What should I reorder?", "Am I making profit?",
  "Sales trend this week", "Slow-moving products",
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
    { role: "ai", text: "Habari! Mimi ni Akiba Yangu. Ninaweza kukusaidia kuelewa biashara yako. Ask me anything about your inventory, sales, or finances — in English or Kiswahili!", time: "Just now" },
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ephemeral in-memory chat session: history is not persisted/loaded from DB
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const newMsg: Message = { role: "user", text, time: new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setIsThinking(true);

    try {
      // Build full chat payload to send to Gemini
      const chatPayload = [
        ...messages.map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text
        })),
        { role: "user", content: text }
      ];

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatPayload }),
      });

      setIsThinking(false);

      if (response.ok) {
        const data = await response.json();
        const aiReply = data.choices?.[0]?.message?.content || "No response received.";
        
        // Check if reply format is tables or recommendations
        const isTable = aiReply.includes("Product") && (aiReply.includes("Value") || aiReply.includes("Stock"));
        const isAnalysis = aiReply.includes("AI Analysis") || aiReply.includes("Analysis") || aiReply.includes("profit") || aiReply.includes("margin");

        setMessages(prev => [...prev, {
          role: "ai",
          text: aiReply,
          type: isTable ? "table" : isAnalysis ? "analysis" : undefined,
          time: new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "ai",
          text: "I encountered an issue communicating with the AI server. Please check your internet connection and try again.",
          time: new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })
        }]);
      }
    } catch (err) {
      setIsThinking(false);
      setMessages(prev => [...prev, {
        role: "ai",
        text: "An unexpected error occurred. Please try again.",
        time: new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })
      }]);
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#f5fbf5" }}>
      <Sidebar />
      <div className="flex-1 md:ml-[240px] flex flex-col min-w-0">
        <TopBar title="AI Insights" />

        <main className="flex-1 p-4 md:p-5 grid md:grid-cols-[300px_1fr] gap-4 max-w-7xl mx-auto w-full overflow-hidden h-[calc(100vh-132px)] md:h-[calc(100vh-64px)]">

          {/* LEFT PANEL */}
          <div className="hidden md:flex bg-white rounded-xl border border-[#bccac1] h-full flex-col p-4 overflow-y-auto shadow-sm gap-4">
            <h2 className="text-base font-black text-[#171d1a]">Quick Insights</h2>

            {/* P&L Card */}
            <div className="p-4 rounded-xl shadow-sm" style={{ background: "#008560", color: "#f5fff7" }}>
              <span className="text-[10px] font-black opacity-70 block uppercase tracking-widest mb-3">This Week&apos;s Performance</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[["84.2K", "Rev"], ["61.4K", "Costs"], ["22.8K", "Profit"]].map(([v, l]) => (
                  <div key={l} className="flex flex-col">
                    <span className="text-lg font-black" style={{ color: l === "Profit" ? "#86f8c9" : "white" }}>{v}</span>
                    <span className="text-[9px] font-black uppercase opacity-60">{l}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t flex justify-center" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                <span className="text-[11px] font-black" style={{ color: "#86f8c9" }}>↑ 8% vs last week</span>
              </div>
            </div>

            <span className="text-[10px] text-[#6d7a73] font-black uppercase tracking-widest">Ask a question:</span>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button key={prompt} onClick={() => handleSend(prompt)}
                  className="bg-[#f5fbf5] border border-[#bccac1] rounded-full px-3 py-1 text-xs font-bold text-[#171d1a] hover:border-[#584fbc] hover:bg-[#f0eeff] transition-all active:scale-95">
                  {prompt}
                </button>
              ))}
            </div>

            <span className="text-[10px] text-[#6d7a73] font-black uppercase tracking-widest">Top 5 Sellers</span>
            <div className="space-y-1">
              {topSellers.map((item) => (
                <div key={item.rank} className="flex items-center justify-between py-1.5 border-b border-[#e4eae4] last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#00694c] text-white font-black text-[11px] flex items-center justify-center">{item.rank}</div>
                    <span className="text-sm font-medium text-[#171d1a]">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-[#171d1a]">KES {item.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL: CHAT */}
          <div className="flex flex-col h-full bg-white rounded-xl border border-[#bccac1] overflow-hidden shadow-sm">
            <header className="flex items-center justify-between px-4 py-3 border-b border-[#bccac1] bg-[#f5fbf5]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "#584fbc" }}>
                  <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                </div>
                <div>
                  <h2 className="text-sm font-black text-[#171d1a] leading-none">Akiba Yangu</h2>
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#00694c" }}>● Online</span>
                </div>
              </div>
              <div className="flex gap-1 p-0.5 rounded-full border border-[#bccac1] bg-white">
                <button className="px-3 py-1 text-[10px] font-black rounded-full uppercase transition-all" style={{ background: "#00694c", color: "white" }}>EN</button>
                <button className="px-3 py-1 text-[10px] font-black rounded-full uppercase text-[#6d7a73] hover:bg-[#f5fbf5] transition-all">SW</button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth" style={{ background: "#f9fcf9" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  style={{ animation: "fadeInUp 0.3s ease-out" }}>
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mr-2 mt-1 shadow-sm flex-shrink-0"
                      style={{ background: "#584fbc" }}>
                      <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                  )}
                  <div className={`max-w-[85%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className="p-3 rounded-2xl shadow-sm text-sm leading-relaxed"
                      style={msg.role === "user"
                        ? { background: "#00694c", color: "white", borderTopRightRadius: "4px" }
                        : { background: "white", border: "1px solid #bccac1", color: "#171d1a", borderTopLeftRadius: "4px" }}>
                      {msg.type === "analysis" && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-black rounded-full px-2 py-0.5 mb-2 uppercase tracking-wider"
                          style={{ background: "rgba(88,79,188,0.1)", color: "#584fbc" }}>
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                          AI Analysis
                        </div>
                      )}
                      <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                      {msg.data && msg.type === "analysis" && (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase opacity-70">
                            <span>{msg.data.label}</span><span>{msg.data.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-[#e4eae4] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${msg.data.progress}%`, background: "#00694c" }} />
                          </div>
                        </div>
                      )}
                      {msg.type === "table" && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-[#bccac1]">
                          <table className="w-full text-[11px]">
                            <thead className="bg-[#f5fbf5] border-b border-[#bccac1]">
                              <tr>{["Product","Last Sold","Stock","Value"].map(h=><th key={h} className="p-1.5 text-left font-black uppercase text-[#6d7a73]">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-[#e4eae4]">
                              {msg.data.map((row: any, ri: number) => (
                                <tr key={ri} className="bg-white">
                                  <td className="p-1.5 font-bold">{row.p}</td>
                                  <td className="p-1.5 text-[#6d7a73]">{row.l}</td>
                                  <td className="p-1.5">{row.s}</td>
                                  <td className="p-1.5 font-bold">KES {row.c}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-2 bg-[#f5fbf5] flex flex-col gap-2">
                            <p className="text-[11px] text-[#6d7a73] italic">Consider a 10-15% clearance to free up KES 59,200.</p>
                            <button className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider text-white active:scale-95 transition-transform" style={{ background: "#584fbc" }}>Suggest a clearance strategy</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase mt-1" style={{ color: "#6d7a73" }}>{msg.time}</span>
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mr-2 mt-1 shadow-sm" style={{ background: "#584fbc" }}>
                    <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <div className="bg-white border border-[#bccac1] rounded-2xl rounded-tl-[4px] p-3 flex items-center gap-1.5 h-11 shadow-sm">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div key={i} className="w-2 h-2 bg-[#bccac1] rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-[#bccac1] bg-white p-3">
              <form className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); handleSend(input); }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(input); } }}
                  placeholder="Ask about your stock, sales, or profit…"
                  className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl px-3 py-2.5 text-sm outline-none transition-all overflow-y-auto"
                  style={{ background: "#f5fbf5", border: "1.5px solid #bccac1", color: "#171d1a" }}
                  onFocus={e => e.target.style.borderColor = "#00694c"}
                  onBlur={e => e.target.style.borderColor = "#bccac1"}
                />
                <button type="submit" disabled={!input.trim() || isThinking}
                  className="w-11 h-11 rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-sm flex-shrink-0 disabled:opacity-30"
                  style={{ background: "#00694c", color: "white" }}>
                  <span className="material-symbols-outlined text-[22px]">send</span>
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
