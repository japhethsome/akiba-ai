"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "ai", content: "Hi! I'm your OpenAI Akiba Assistant. How can I help you manage your store today?" }]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
     if (!input.trim()) return;
     
     const newMessages = [...messages, { role: "user", content: input }];
     setMessages([...newMessages, { role: "ai", content: "Thinking..." }]);
     setInput("");
     
     try {
        const res = await fetch("/api/ai/chat", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ messages: newMessages })
        });
        const data = await res.json();
        
        if (data.reply) {
           setMessages([...newMessages, { role: "ai", content: data.reply }]);
        } else {
           setMessages([...newMessages, { role: "ai", content: "Sorry, I encountered an error connecting to OpenAI." }]);
        }
     } catch (err) {
        setMessages([...newMessages, { role: "ai", content: "Network error. Please try again." }]);
     }
  };

  return (
    <>
       <AnimatePresence>
          {isOpen && (
             <motion.div 
               initial={{ opacity: 0, y: 50, scale: 0.9 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 50, scale: 0.9 }}
               transition={{ type: "spring", stiffness: 300, damping: 25 }}
               className="fixed bottom-24 right-6 w-[380px] h-[500px] bg-white rounded-3xl shadow-2xl shadow-black/20 border border-[#e4eae4] z-[100] flex flex-col overflow-hidden"
             >
                {/* Header */}
                <div className="bg-[#171d1a] text-white p-4 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-tr from-[#00694c] to-[#00a87a] rounded-xl flex items-center justify-center">
                         <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                      </div>
                      <div>
                         <h3 className="font-black text-sm tracking-tight">OpenAI Intelligence</h3>
                         <p className="text-[10px] text-[#bccac1] uppercase tracking-wider font-bold">Store Expert</p>
                      </div>
                   </div>
                   <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                   </button>
                </div>
                
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#f8faf9]">
                   {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] font-medium leading-relaxed ${
                            msg.role === 'user' 
                               ? 'bg-[#00694c] text-white rounded-tr-sm shadow-sm' 
                               : 'bg-white border border-[#e4eae4] text-[#171d1a] rounded-tl-sm shadow-sm'
                         }`}>
                            {msg.content}
                         </div>
                      </div>
                   ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[#e4eae4] bg-white flex gap-2 items-center">
                   <input 
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder="Ask about your inventory..."
                      className="flex-1 h-11 bg-[#f8faf9] border border-[#e4eae4] rounded-xl px-4 text-[13px] font-medium focus:outline-none focus:border-[#00694c] transition-colors"
                   />
                   <button onClick={handleSend} className="w-11 h-11 bg-[#171d1a] text-white rounded-xl flex items-center justify-center hover:bg-[#00a87a] transition-colors shadow-lg shadow-black/10">
                      <span className="material-symbols-outlined text-[18px]">send</span>
                   </button>
                </div>
             </motion.div>
          )}
       </AnimatePresence>

       {/* Floating Toggle Button */}
       <motion.button
         whileHover={{ scale: 1.05 }}
         whileTap={{ scale: 0.95 }}
         onClick={() => setIsOpen(!isOpen)}
         className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-[#171d1a] to-[#3d4943] rounded-full flex items-center justify-center text-white shadow-xl shadow-black/20 z-[100] border-2 border-transparent hover:border-[#00a87a] transition-colors"
       >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
             {isOpen ? 'close' : 'chat'}
          </span>
       </motion.button>
    </>
  );
}
