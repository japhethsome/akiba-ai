"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Mambo! I am Akiba AI, your business intelligence assistant. Ask me anything about your inventory, pricing, or restocks!" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
    };
    window.addEventListener("open-ai-chat", handleOpenChat);
    return () => {
      window.removeEventListener("open-ai-chat", handleOpenChat);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setApiError("");

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show the specific error from the server
        const errMsg = data?.error || `Server error (${response.status})`;
        throw new Error(errMsg);
      }

      const aiReply = data?.choices?.[0]?.message?.content;
      if (!aiReply) throw new Error("The AI returned an empty response. Please try again.");

      setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      setApiError(err.message || "Something went wrong.");
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    { icon: "analytics", label: "Stock summary", prompt: "Give me a brief summary of my stock levels and which items are running low." },
    { icon: "sell", label: "Pricing tips", prompt: "What are some effective pricing strategies for a Kenyan retail store?" },
    { icon: "inventory", label: "Restock advice", prompt: "Based on my low-stock items, what should I prioritize restocking first?" },
  ];

  return (
    <>
      {/* Floating Trigger */}
      <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-[150]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#00694c] to-[#004d37] text-white flex items-center justify-center shadow-2xl hover:shadow-emerald-900/30 transition-all relative border border-[#00a87a]/20"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="material-symbols-outlined text-[22px] md:text-[26px]">
                close
              </motion.span>
            ) : (
              <motion.div key="chat" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px] md:text-[26px]">forum</span>
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00a87a] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#00a87a]"></span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed bottom-[152px] right-4 md:bottom-28 md:right-8 z-[150] w-[calc(100vw-32px)] sm:w-[390px] h-[460px] md:h-[520px] bg-white border border-[#e4eae4] rounded-[28px] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-br from-[#171d1a] to-[#252f2a] text-white flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a87a] to-[#00694c] flex items-center justify-center shadow-lg relative shrink-0">
                <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#171d1a] rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  Akiba AI
                  <span className="bg-[#00a87a]/20 border border-[#00a87a]/40 text-[#00a87a] text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded">Smart AI</span>
                </h3>
                <p className="text-[10px] text-[#bccac1] font-bold">Your inventory intelligence assistant</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#bccac1] hover:text-white transition-colors p-1 shrink-0">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8faf9]" style={{ scrollbarWidth: "none" }}>
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-[18px] p-3.5 text-xs leading-relaxed font-semibold shadow-sm ${
                    msg.role === "user"
                      ? "bg-[#171d1a] text-white rounded-br-none"
                      : "bg-white text-[#171d1a] border border-[#e4eae4] rounded-bl-none"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#e4eae4] rounded-[18px] rounded-bl-none p-3.5 flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00694c] animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00694c] animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00694c] animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}

              {apiError && (
                <div className="flex justify-center">
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold rounded-xl px-3 py-2 max-w-[90%] text-center">
                    <span className="material-symbols-outlined text-[14px] text-rose-400">warning</span> {apiError}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts — show only at start */}
            {messages.length === 1 && (
              <div className="px-4 py-2.5 bg-[#f8faf9] border-t border-[#e4eae4] flex gap-2 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
                {quickPrompts.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => setInputValue(q.prompt)}
                    className="bg-white border border-[#e4eae4] hover:border-[#00694c] text-[10px] text-[#6d7a73] font-black px-3 py-2 rounded-xl shrink-0 transition-colors shadow-sm whitespace-nowrap flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px] text-[#00694c]">{q.icon}</span>
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 bg-white border-t border-[#e4eae4] flex gap-2 shrink-0">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Ask about inventory, pricing, restocks..."
                className="flex-1 h-11 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-xs font-bold outline-none focus:border-[#00694c] focus:bg-white transition-all placeholder:text-[#bccac1]"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="h-11 w-11 bg-[#171d1a] hover:bg-black disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
