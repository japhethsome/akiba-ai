"use client";

import React, { useState, useMemo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { processCheckout } from "@/lib/actions/pos";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  cartQuantity: number;
}

export function PosClientUI({ initialProducts }: { initialProducts: Product[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isCartMobileOpen, setIsCartMobileOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<CartItem[]>([]);
  const [lastTotal, setLastTotal] = useState(0);

  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [initialProducts, searchQuery]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.stock) return prev; // Cannot exceed stock
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQ = item.cartQuantity + delta;
        if (newQ > item.stock) return item;
        if (newQ <= 0) return item; // Handled by remove button usually, but keep min 1
        return { ...item, cartQuantity: newQ };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const finalTotal = subtotal * (1 - discount);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    startTransition(async () => {
      const payload = cart.map(item => ({
        productId: item.id,
        quantity: item.cartQuantity,
      }));
      
      const res = await processCheckout(payload); // We pass payload, currently discounts aren't recorded in backend DB (TODO for future)
      if (res.success) {
        setLastOrder([...cart]);
        setLastTotal(finalTotal);
        setShowReceipt(true);
        setCart([]);
        setDiscount(0);
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="flex h-full min-h-[calc(100dvh-160px)] lg:min-h-[calc(100vh-80px)] overflow-hidden bg-[#f5fbf5] relative">
      {/* Left Pane - Catalog */}
      <div className="flex-1 flex flex-col p-4 lg:p-8 overflow-hidden relative">
        <div className="mb-4 lg:mb-6">
          <h1 className="text-2xl lg:text-3xl font-black text-[#171d1a] tracking-tight mb-4">Point of Sale</h1>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#bccac1]">search</span>
              <input 
                type="text" 
                placeholder="Search products by name or category..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-white border border-[#e4eae4] rounded-2xl text-sm font-bold focus:border-[#00694c] focus:ring-4 focus:ring-[#00694c]/5 outline-none transition-all shadow-sm"
              />
            </div>
            <button className="h-14 w-14 shrink-0 bg-[#f8faf9] border border-[#e4eae4] rounded-2xl flex items-center justify-center text-[#171d1a] hover:border-[#00694c] hover:text-[#00694c] hover:bg-[#f0fdf4] transition-all shadow-sm group">
               <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">barcode_scanner</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 pb-32 lg:pb-0">
            {filteredProducts.map(product => (
              <motion.button 
                key={product.id}
                whileHover={product.stock > 0 ? { scale: 1.02, y: -2 } : {}}
                whileTap={product.stock > 0 ? { scale: 0.98 } : {}}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`flex flex-col text-left p-4 lg:p-5 rounded-2xl border transition-all ${
                  product.stock > 0 
                    ? "bg-white border-[#e4eae4] hover:border-[#00a87a] shadow-sm hover:shadow-lg" 
                    : "bg-[#f8faf9] border-[#e4eae4] opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-[#6d7a73] mb-1 lg:mb-2">{product.category}</div>
                <div className="font-black text-[#171d1a] text-sm lg:text-lg leading-tight mb-2 flex-1">{product.name}</div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between w-full mt-auto gap-2">
                  <div className="font-black text-[#00694c] text-sm">KES {product.price.toLocaleString()}</div>
                  <div className={`text-[9px] lg:text-[10px] font-bold px-2 py-1 rounded-md self-start lg:self-auto ${
                    product.stock > 10 ? "bg-[#f0fdf4] text-[#166534]" : 
                    product.stock > 0 ? "bg-[#fff1f2] text-[#e11d48]" : "bg-[#f3f4f6] text-[#6d7a73]"
                  }`}>
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Mobile Floating Cart Button */}
        <div className="lg:hidden absolute bottom-6 left-4 right-4 z-20">
           <button 
              onClick={() => setIsCartMobileOpen(true)} 
              className="w-full bg-[#171d1a] hover:bg-black text-white p-4 rounded-[20px] shadow-2xl font-black flex justify-between items-center active:scale-[0.98] transition-transform"
           >
              <div className="flex items-center gap-3">
                 <div className="relative">
                   <span className="material-symbols-outlined text-[24px]">shopping_basket</span>
                   {cart.length > 0 && (
                     <span className="absolute -top-2 -right-2 bg-[#e11d48] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{cart.reduce((s, i) => s + i.cartQuantity, 0)}</span>
                   )}
                 </div>
                 <span className="text-sm">View Cart</span>
              </div>
              <span className="text-lg">KES {finalTotal.toLocaleString()}</span>
           </button>
        </div>
      </div>

      {/* Right Pane - Cart */}
      <AnimatePresence>
        {(isCartMobileOpen || true) && ( // true for desktop lg:flex to handle it via CSS
          <div className={`${isCartMobileOpen ? "fixed inset-0 z-[100] flex animate-in slide-in-from-bottom" : "hidden lg:flex"} lg:relative w-full lg:w-[400px] xl:w-[450px] bg-white lg:border-l border-[#e4eae4] flex-col shadow-2xl`}>
            <div className="p-5 lg:p-6 border-b border-[#e4eae4] bg-[#f8faf9]">
              <h2 className="text-xl font-black text-[#171d1a] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsCartMobileOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center bg-white border border-[#e4eae4] rounded-full text-[#6d7a73]">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  Current Order
                </div>
                <span className="bg-[#00694c] text-white text-xs px-2.5 py-1 rounded-full">{cart.reduce((s, i) => s + i.cartQuantity, 0)} items</span>
              </h2>
            </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {cart.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-[#bccac1]"
              >
                <span className="material-symbols-outlined text-[64px] mb-4 opacity-50">shopping_basket</span>
                <p className="font-bold text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Tap products to add them</p>
              </motion.div>
            ) : (
              cart.map(item => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col gap-3 p-4 bg-[#f8faf9] border border-[#e4eae4] rounded-2xl group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-[#171d1a] leading-tight">{item.name}</h4>
                      <div className="text-[11px] font-bold text-[#6d7a73] mt-1">KES {item.price.toLocaleString()} each</div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-[#bccac1] hover:text-[#e11d48] transition-colors">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 bg-white border border-[#e4eae4] rounded-xl p-1 shadow-sm">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.cartQuantity <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#171d1a] hover:bg-[#f8faf9] disabled:opacity-30 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <span className="font-black text-sm w-4 text-center">{item.cartQuantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={item.cartQuantity >= item.stock}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#171d1a] hover:bg-[#f8faf9] disabled:opacity-30 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                    <div className="font-black text-[#00694c]">
                      KES {(item.price * item.cartQuantity).toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-[#171d1a] text-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative z-20">
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
             <button onClick={() => setDiscount(0)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${discount === 0 ? "bg-[#00a87a] text-[#171d1a]" : "bg-white/10 text-[#bccac1] hover:bg-white/20"}`}>No Discount</button>
             <button onClick={() => setDiscount(0.05)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${discount === 0.05 ? "bg-[#00a87a] text-[#171d1a]" : "bg-white/10 text-[#bccac1] hover:bg-white/20"}`}>5% Off</button>
             <button onClick={() => setDiscount(0.10)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${discount === 0.10 ? "bg-[#00a87a] text-[#171d1a]" : "bg-white/10 text-[#bccac1] hover:bg-white/20"}`}>10% Off</button>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-[#bccac1] uppercase tracking-widest">Total Due</span>
            <div className="text-right">
               {discount > 0 && <div className="text-xs text-[#bccac1] line-through mb-1">KES {subtotal.toLocaleString()}</div>}
               <span className="text-3xl font-black text-[#00a87a]">KES {finalTotal.toLocaleString()}</span>
            </div>
          </div>
          
          <motion.button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isPending}
            whileHover={cart.length > 0 ? { scale: 1.02 } : {}}
            whileTap={cart.length > 0 ? { scale: 0.98 } : {}}
            className="w-full bg-[#00a87a] hover:bg-[#008560] disabled:bg-gray-700 disabled:text-gray-400 text-[#171d1a] h-16 rounded-2xl font-black text-lg transition-colors flex items-center justify-center gap-3 shadow-xl shadow-[#00a87a]/20"
          >
            {isPending ? (
              <span className="material-symbols-outlined animate-spin">refresh</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[24px]">point_of_sale</span>
                Complete Checkout
              </>
            )}
          </motion.button>
        </div>
      </div>
      )}
      </AnimatePresence>
      {/* Success Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-[#00694c] text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-[#00694c]/20">
                <span className="material-symbols-outlined text-[40px]">check_circle</span>
              </div>
              <h2 className="text-2xl font-black text-[#171d1a] mb-2">Payment Successful</h2>
              <p className="text-[#6d7a73] text-sm font-medium mb-8">Transaction completed and inventory updated.</p>
              
              <div className="w-full bg-[#f8faf9] border border-[#e4eae4] border-dashed rounded-2xl p-6 mb-8 text-left">
                 <div className="flex justify-between text-xs font-bold text-[#bccac1] uppercase tracking-widest mb-4">
                    <span>Item</span>
                    <span>Amt</span>
                 </div>
                 <div className="space-y-3 mb-4 max-h-[150px] overflow-y-auto no-scrollbar">
                    {lastOrder.map((item, i) => (
                       <div key={i} className="flex justify-between text-sm font-black text-[#171d1a]">
                          <span className="truncate pr-4">{item.cartQuantity}x {item.name}</span>
                          <span className="shrink-0">{(item.price * item.cartQuantity).toLocaleString()}</span>
                       </div>
                    ))}
                 </div>
                 <div className="border-t border-[#e4eae4] border-dashed pt-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#171d1a] uppercase tracking-widest">Total Paid</span>
                    <span className="text-xl font-black text-[#00694c]">KES {lastTotal.toLocaleString()}</span>
                 </div>
              </div>

              <div className="w-full space-y-3">
                 <button className="w-full h-14 bg-[#171d1a] hover:bg-black text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">print</span>
                    Print Receipt
                 </button>
                 <button onClick={() => setShowReceipt(false)} className="w-full h-14 bg-[#f8faf9] hover:bg-[#e4eae4] text-[#171d1a] rounded-xl font-black text-sm transition-colors">
                    Start New Order
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
