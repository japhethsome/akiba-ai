"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  savedAt?: string;
  streaming?: boolean;
}

function formatMessageContent(content: string, role: "user" | "assistant"): React.ReactNode {
  if (role === "user") {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  // Preprocessor: Ensure hashtags have newlines before them if they are preceded by non-newlines
  let processed = content.replace(/([^\n])\s*(#{1,6})\s+/g, "$1\n\n$2 ");

  // Also replace multiple consecutive newlines with exactly two newlines to normalize paragraph spaces
  processed = processed.replace(/\n{3,}/g, "\n\n");

  const lines = processed.split("\n");
  const renderedElements: React.ReactNode[] = [];

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong key={index} className="font-extrabold text-[#00694c]">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  let inTable = false;
  let tableRows: string[][] = [];
  let tableKey = 0;

  const flushList = () => {
    if (inList && listItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${listKey++}`} className="list-disc pl-5 my-2 space-y-1 text-[#171d1a]">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const headers = tableRows[0];
      const dataRows = tableRows.slice(1);
      renderedElements.push(
        <div key={`table-${tableKey++}`} className="overflow-x-auto my-3 border border-[#e4eae4] rounded-xl shadow-sm">
          <table className="min-w-full divide-y divide-[#e4eae4] text-xs text-left bg-white">
            <thead className="bg-[#f4fbf7]">
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} className="px-3 py-2 text-[10px] sm:text-[11px] font-bold text-[#00694c] uppercase tracking-wider">
                    {parseBoldText(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4eae4] text-[#171d1a]">
              {dataRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-[#f5fbf5]/50 transition-colors">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-3 py-2 font-medium">
                      {parseBoldText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      flushTable();
      renderedElements.push(<div key={`spacer-${i}`} className="h-2" />);
      continue;
    }

    // Check for tables
    if (line.startsWith("|") && line.endsWith("|")) {
      flushList();
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      const isDivider = cells.every((c) => /^:?-+:?$/.test(c));
      if (isDivider) {
        inTable = true;
        continue;
      }
      tableRows.push(cells);
      inTable = true;
      continue;
    } else {
      flushTable();
    }

    // Check for headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      renderedElements.push(
        <div
          key={`heading-${i}`}
          className={`font-black uppercase text-[#00694c] mt-3 mb-1.5 ${
            level === 1 ? "text-sm" : level === 2 ? "text-[11px]" : "text-[10px]"
          }`}
        >
          {parseBoldText(text)}
        </div>
      );
      continue;
    }

    // Check for bullet list items
    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      inList = true;
      const text = bulletMatch[1];
      listItems.push(
        <li key={`li-${i}`} className="pl-1 text-[#171d1a] marker:text-[#00694c]">
          {parseBoldText(text)}
        </li>
      );
      continue;
    }

    // Check for numbered list items
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      flushList();
      const num = numberedMatch[1];
      const text = numberedMatch[2];
      renderedElements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-1.5 pl-1">
          <span className="font-extrabold text-[#00694c] shrink-0">{num}.</span>
          <span className="text-[#171d1a]">{parseBoldText(text)}</span>
        </div>
      );
      continue;
    }

    // Normal paragraph line
    flushList();
    renderedElements.push(
      <p key={`p-${i}`} className="mb-2 text-[#171d1a] last:mb-0">
        {parseBoldText(line)}
      </p>
    );
  }

  flushList();
  flushTable();
  return <div className="space-y-1">{renderedElements}</div>;
}

function formatTimestamp(isoString?: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

export function AiChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Mambo! I am Akiba AI, your business intelligence assistant. I have live access to your store's inventory, suppliers, and sales data. Ask me anything!",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendMessageRef = useRef<((text?: string) => Promise<void>) | null>(null);

  useEffect(() => {
    sendMessageRef.current = handleSendMessage;
  });

  // Load conversation history on mount
  useEffect(() => {
    if (historyLoaded) return;
    setHistoryLoaded(true);
    fetch("/api/ai/chat")
      .then((r) => r.json())
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          setMessages([
            {
              role: "assistant",
              content: "Mambo! I am Akiba AI. Here is our recent conversation history — feel free to continue where we left off!",
            },
            ...data.messages,
          ]);
        }
      })
      .catch(() => {/* silently fail — default greeting already set */});
  }, [historyLoaded]);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isTyping, scrollToBottom]);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.prompt) {
        sendMessageRef.current?.(customEvent.detail.prompt);
      }
    };
    window.addEventListener("open-ai-chat", handleOpenChat);
    return () => {
      window.removeEventListener("open-ai-chat", handleOpenChat);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleClearChat = async () => {
    if (!confirm("Clear all conversation history? This cannot be undone.")) return;
    setIsClearing(true);
    try {
      await fetch("/api/ai/chat", { method: "DELETE" });
      setMessages([
        {
          role: "assistant",
          content: "Chat cleared! I am Akiba AI, your business intelligence assistant. How can I help you today?",
        },
      ]);
      setApiError("");
      setRateLimitRemaining(null);
    } catch {
      /* silently fail */
    } finally {
      setIsClearing(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = textToSend !== undefined ? textToSend : inputValue;
    if (!promptText.trim() || isTyping) return;

    const userMessage = promptText.trim();
    if (textToSend === undefined) {
      setInputValue("");
    }
    setApiError("");

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsTyping(true);

    // Add placeholder streaming assistant message
    const streamPlaceholderIdx = newMessages.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

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
        const errMsg = data?.error || `Server error (${response.status})`;
        throw new Error(errMsg);
      }

      if (data.rateLimitRemaining !== undefined) {
        setRateLimitRemaining(data.rateLimitRemaining);
      }

      const aiReply = data?.choices?.[0]?.message?.content;
      if (!aiReply) throw new Error("The AI returned an empty response. Please try again.");

      // Simulate streaming: reveal text progressively
      const receivedAt = new Date().toISOString();
      const words = aiReply.split(" ");
      let displayed = "";

      setMessages((prev) => {
        const updated = [...prev];
        updated[streamPlaceholderIdx] = { role: "assistant", content: "", streaming: true, savedAt: receivedAt };
        return updated;
      });

      for (let i = 0; i < words.length; i++) {
        displayed += (i === 0 ? "" : " ") + words[i];
        const partial = displayed;
        setMessages((prev) => {
          const updated = [...prev];
          updated[streamPlaceholderIdx] = {
            role: "assistant",
            content: partial,
            streaming: i < words.length - 1,
            savedAt: receivedAt,
          };
          return updated;
        });
        // Stagger word reveal (faster for long messages)
        if (words.length > 60) {
          await new Promise((r) => setTimeout(r, 8));
        } else {
          await new Promise((r) => setTimeout(r, 18));
        }
      }
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      setApiError(err.message || "Something went wrong.");
      // Remove streaming placeholder on error
      setMessages((prev) => prev.filter((_, idx) => idx !== streamPlaceholderIdx));
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    { icon: "analytics", label: "Stock summary", prompt: "Give me a brief summary of my current stock levels and which items are running critically low." },
    { icon: "sell", label: "Pricing tips", prompt: "Based on my current buying prices, what selling prices would give me a healthy 30–40% margin?" },
    { icon: "inventory", label: "Restock priority", prompt: "Which items should I restock first today and from which supplier? Include their contact." },
    { icon: "trending_up", label: "Today's sales", prompt: "How are my sales performing today? What is today's revenue and what sold the most?" },
    { icon: "chat", label: "Draft PO message", prompt: "Draft a professional WhatsApp reorder message to my supplier for the items that are low in stock." },
  ];

  const showQuickPrompts = messages.length === 1 || messages.length === 2;

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
            className="fixed bottom-[152px] right-4 md:bottom-28 md:right-8 z-[150] w-[calc(100vw-32px)] sm:w-[400px] h-[500px] md:h-[560px] bg-white border border-[#e4eae4] rounded-[28px] overflow-hidden shadow-2xl flex flex-col"
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
                  <span className="bg-[#00a87a]/20 border border-[#00a87a]/40 text-[#00a87a] text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded">Live Data</span>
                </h3>
                <p className="text-[10px] text-[#bccac1] font-bold">
                  {rateLimitRemaining !== null ? `${rateLimitRemaining} messages left this hour` : "Business intelligence assistant"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  disabled={isClearing}
                  className="p-1.5 text-[#bccac1] hover:text-rose-400 transition-colors rounded-lg hover:bg-white/10"
                  title="Clear chat history"
                >
                  <span className="material-symbols-outlined text-[16px]">{isClearing ? "hourglass_empty" : "delete_sweep"}</span>
                </button>
                <button onClick={() => setIsOpen(false)} className="text-[#bccac1] hover:text-white transition-colors p-1 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8faf9]" style={{ scrollbarWidth: "none" }}>
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="flex flex-col gap-1 max-w-[88%]">
                    <div
                      className={`rounded-[18px] p-3.5 text-xs leading-relaxed font-semibold shadow-sm ${
                        msg.role === "user"
                          ? "bg-[#171d1a] text-white rounded-br-none"
                          : "bg-white text-[#171d1a] border border-[#e4eae4] rounded-bl-none"
                      }`}
                    >
                      {msg.content
                        ? formatMessageContent(msg.content, msg.role)
                        : msg.streaming
                        ? <span className="inline-block w-1 h-3.5 bg-[#00694c] animate-pulse rounded-sm" />
                        : null}
                    </div>
                    {msg.role === "assistant" && msg.savedAt && !msg.streaming && (
                      <span className="text-[9px] text-[#bccac1] font-bold pl-1">{formatTimestamp(msg.savedAt)}</span>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && !messages.some((m) => m.streaming) && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#e4eae4] rounded-[18px] rounded-bl-none px-4 py-3 flex items-center gap-2 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00694c] animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00694c] animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00694c] animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    <span className="text-[10px] font-bold text-[#6d7a73] ml-1">Akiba AI is thinking...</span>
                  </div>
                </div>
              )}

              {apiError && (
                <div className="flex justify-center">
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-bold rounded-xl px-3 py-2 max-w-[90%] text-center flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-rose-400">warning</span>
                    {apiError}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {showQuickPrompts && (
              <div className="px-3 py-2.5 bg-[#f8faf9] border-t border-[#e4eae4] flex gap-2 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
                {quickPrompts.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => handleSendMessage(q.prompt)}
                    className="bg-white border border-[#e4eae4] hover:border-[#00694c] hover:bg-[#f0fdf4] text-[10px] text-[#6d7a73] font-black px-3 py-2 rounded-xl shrink-0 transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5"
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
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Ask about inventory, pricing, restocks..."
                className="flex-1 h-11 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-xs font-bold outline-none focus:border-[#00694c] focus:bg-white transition-all placeholder:text-[#bccac1]"
              />
              <button
                onClick={() => handleSendMessage()}
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
