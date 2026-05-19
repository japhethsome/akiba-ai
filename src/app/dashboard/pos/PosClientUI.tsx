"use client";

import React, { useState, useMemo, useTransition, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { processCheckout, processBulkCheckouts } from "@/lib/actions/pos";

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

interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
}

interface CashLog {
  id: string;
  type: "in" | "out" | "sale";
  amount: number;
  reason: string;
  timestamp: Date;
}

interface OfflineOrder {
  cart: { productId: string; quantity: number }[];
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  totalPaid: number;
  timestamp: string;
  itemsSummary: string;
}

export function PosClientUI({ 
  initialProducts, 
  currentUser = { name: "Attendant", role: "attendant" }
}: { 
  initialProducts: Product[];
  currentUser?: { name: string; role: string };
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"register" | "dashboard" | "cash-drawer" | "ai-insights">("register");

  // Network & Sync States
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Discount & Clearance States
  const [discount, setDiscount] = useState(0); // decimal e.g. 0.05
  const [customDiscountOpen, setCustomDiscountOpen] = useState(false);
  const [customDiscountInput, setCustomDiscountInput] = useState("");
  const [clearancePin, setClearancePin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isClearedAsManager, setIsClearedAsManager] = useState(currentUser.role.toLowerCase() === "owner");

  // Barcode Camera Mock States
  const [isScanning, setIsScanning] = useState(false);
  const [scanLaserActive, setScanLaserActive] = useState(false);
  const [scannedMessage, setScannedMessage] = useState("");

  // Customer & Loyalty States
  const [customers, setCustomers] = useState<Customer[]>([
    { id: "cust-1", name: "John Mwangi", phone: "+254712345678", points: 150 },
    { id: "cust-2", name: "Fatuma Ali", phone: "+254722987654", points: 80 },
    { id: "cust-3", name: "David Ochieng", phone: "+254733445566", points: 310 },
  ]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Cash Drawer Session States
  const [isDrawerOpenSession, setIsDrawerOpenSession] = useState(false);
  const [startingFloat, setStartingFloat] = useState(0);
  const [cashLogs, setCashLogs] = useState<CashLog[]>([]);
  const [showDrawerModal, setShowDrawerModal] = useState(false);
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [cashOutAmount, setCashOutAmount] = useState("");
  const [cashOutReason, setCashOutReason] = useState("");
  const [showCloseDrawerModal, setShowCloseDrawerModal] = useState(false);
  const [actualCashInDrawer, setActualCashInDrawer] = useState("");
  const [drawerCloseReport, setDrawerCloseReport] = useState<any | null>(null);
  const [drawerSessionHistory, setDrawerSessionHistory] = useState<any[]>([]);

  // Checkout Sheet States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "card" | "split">("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaStatus, setMpesaStatus] = useState<"idle" | "sending" | "pin" | "success" | "error">("idle");
  const [splitCash, setSplitCash] = useState("");
  const [splitMpesa, setSplitMpesa] = useState("");
  const [splitCard, setSplitCard] = useState("");
  
  // Receipt modal states
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<CartItem[]>([]);
  const [lastTotal, setLastTotal] = useState(0);
  const [lastPaymentMethod, setLastPaymentMethod] = useState("");
  const [sendDigitalReceipt, setSendDigitalReceipt] = useState(false);
  const [digitalPhone, setDigitalPhone] = useState("");
  const [receiptStatus, setReceiptStatus] = useState("");

  // AI Insights States
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsGenerated, setInsightsGenerated] = useState(false);

  // Keep live local products state updated when initialProducts changes
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Load persistence details from localStorage on mount
  useEffect(() => {
    // Online check
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load Offline Queue
    const storedQueue = localStorage.getItem("akiba_pos_offline_queue");
    if (storedQueue) setOfflineQueue(JSON.parse(storedQueue));

    // Load Customers
    const storedCust = localStorage.getItem("akiba_pos_customers");
    if (storedCust) setCustomers(JSON.parse(storedCust));

    // Load Drawer Session
    const activeSession = localStorage.getItem("akiba_pos_drawer_active");
    if (activeSession === "true") {
      setIsDrawerOpenSession(true);
      const floatVal = localStorage.getItem("akiba_pos_drawer_float") || "0";
      setStartingFloat(Number(floatVal));
      const storedLogs = localStorage.getItem("akiba_pos_drawer_logs") || "[]";
      setCashLogs(JSON.parse(storedLogs).map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) })));
    } else {
      // Force opening drawer on register start
      setShowDrawerModal(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync state helpers
  const saveOfflineQueue = (queue: OfflineOrder[]) => {
    setOfflineQueue(queue);
    localStorage.setItem("akiba_pos_offline_queue", JSON.stringify(queue));
  };

  const saveCustomers = (cust: Customer[]) => {
    setCustomers(cust);
    localStorage.setItem("akiba_pos_customers", JSON.stringify(cust));
  };

  const saveDrawerLogs = (logs: CashLog[]) => {
    setCashLogs(logs);
    localStorage.setItem("akiba_pos_drawer_logs", JSON.stringify(logs));
  };

  // Deterministic short 8-digit barcode for simulation
  const getProductBarcode = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 90000000 + 10000000).toString();
  };

  // Keyboard Shortcuts: Enter on payment screen, Escape to close
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCheckoutModalOpen(false);
        setIsScanning(false);
        setCustomDiscountOpen(false);
        setShowCustomerModal(false);
        setShowCloseDrawerModal(false);
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, []);

  // Global rapid keypress listener for actual physical barcode scanners
  useEffect(() => {
    let rawKeys = "";
    let lastKeyTime = Date.now();

    const handleKeyPress = (e: KeyboardEvent) => {
      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      // Physical scanners press enter key at the end of scan
      if (e.key === "Enter") {
        if (rawKeys.length >= 4) {
          const scannedCode = rawKeys.trim();
          handleBarcodeScanned(scannedCode);
          rawKeys = "";
          e.preventDefault();
        } else {
          rawKeys = "";
        }
      } else if (e.key.length === 1) {
        // Scanners type extremely rapidly (usually < 30ms interval between keys)
        if (diff < 50 || rawKeys.length === 0) {
          rawKeys += e.key;
        } else {
          rawKeys = e.key; // Reset if user is typing manually too slowly
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [products]);

  // Handle scanned barcodes (either physical hardware or typing)
  const handleBarcodeScanned = (code: string) => {
    // Find matching product
    const matched = products.find(p => getProductBarcode(p.id) === code || p.id === code);
    if (matched) {
      addToCart(matched);
      setBarcodeSearch("");
      
      // Flash a brief success message
      setScannedMessage(`Scanned: ${matched.name}!`);
      setTimeout(() => setScannedMessage(""), 2000);
    } else {
      setScannedMessage("Product code not recognized");
      setTimeout(() => setScannedMessage(""), 2000);
    }
  };

  // Simulated camera scanner sequence
  const startCameraScan = () => {
    setIsScanning(true);
    setScanLaserActive(true);
    // Simulate finding a barcode in 2.5 seconds
    setTimeout(() => {
      if (products.length > 0) {
        // Select a random product to simulate
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const barcode = getProductBarcode(randomProduct.id);
        handleBarcodeScanned(barcode);
      }
      setIsScanning(false);
    }, 2200);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProductBarcode(p.id).includes(searchQuery)
    );
  }, [products, searchQuery]);

  const addToCart = (product: Product) => {
    if (!isDrawerOpenSession) {
      alert("Please open a Cash Drawer Session first before checkout!");
      setActiveTab("cash-drawer");
      setShowDrawerModal(true);
      return;
    }
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.stock) return prev; // stock limit
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
        if (newQ <= 0) return item;
        return { ...item, cartQuantity: newQ };
      }
      return item;
    }));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  
  // Loyalty Point deductions (1 point = 1 KES discount)
  const loyaltyPointsMaxDiscount = selectedCustomer && redeemPoints 
    ? Math.min(selectedCustomer.points, subtotal * (1 - discount))
    : 0;

  const finalTotal = Math.max(0, (subtotal * (1 - discount)) - loyaltyPointsMaxDiscount);

  // Loyalty Points to earn (1 point for every 100 KES spent)
  const loyaltyPointsEarned = Math.floor(finalTotal / 100);

  // Check out processes
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    
    // Autofill defaults
    setCheckoutModalOpen(true);
    setCashReceived(Math.ceil(finalTotal).toString());
    setMpesaPhone(selectedCustomer?.phone || "+2547");
    setMpesaStatus("idle");
    setSplitCash(Math.ceil(finalTotal / 2).toString());
    setSplitMpesa(Math.floor(finalTotal / 2).toString());
    setSplitCard("0");
    if (selectedCustomer) {
      setDigitalPhone(selectedCustomer.phone);
      setSendDigitalReceipt(true);
    } else {
      setDigitalPhone("");
      setSendDigitalReceipt(false);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Split check calculation
    if (paymentMethod === "split") {
      const sum = Number(splitCash) + Number(splitMpesa) + Number(splitCard);
      if (Math.abs(sum - finalTotal) > 1) {
        alert(`Split amounts must equal the Total KES ${finalTotal.toLocaleString()}`);
        return;
      }
    }

    if (paymentMethod === "mpesa" && mpesaStatus !== "success") {
      // Trigger MPesa push simulation
      setMpesaStatus("sending");
      setTimeout(() => {
        setMpesaStatus("pin");
        setTimeout(() => {
          setMpesaStatus("success");
          // Proceed with checkout completion
          completeCheckoutTransaction();
        }, 2000);
      }, 1500);
      return;
    }

    completeCheckoutTransaction();
  };

  const completeCheckoutTransaction = () => {
    const paymentMethodLabel = paymentMethod === "split" 
      ? `Split (Cash:${splitCash}/M-Pesa:${splitMpesa}/Card:${splitCard})` 
      : paymentMethod.toUpperCase();

    // If offline, save in offline queue
    if (!isOnline) {
      const itemsSummary = cart.map(i => `${i.cartQuantity}x ${i.name}`).join(", ");
      const offlineOrder: OfflineOrder = {
        cart: cart.map(item => ({ productId: item.id, quantity: item.cartQuantity })),
        paymentMethod: paymentMethodLabel,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone,
        loyaltyPointsEarned,
        loyaltyPointsRedeemed: redeemPoints ? loyaltyPointsMaxDiscount : 0,
        totalPaid: finalTotal,
        timestamp: new Date().toISOString(),
        itemsSummary,
      };

      saveOfflineQueue([...offlineQueue, offlineOrder]);
      
      // Deduct stock locally so UI remains accurate offline
      setProducts(prevProducts => 
        prevProducts.map(p => {
          const cartItem = cart.find(ci => ci.id === p.id);
          return cartItem ? { ...p, stock: p.stock - cartItem.cartQuantity } : p;
        })
      );

      // Trigger drawer sales log locally for cash
      if (paymentMethod === "cash" || paymentMethod === "split") {
        const cashAmount = paymentMethod === "cash" ? finalTotal : Number(splitCash);
        if (cashAmount > 0) {
          const newLogs: CashLog[] = [
            ...cashLogs,
            {
              id: `log-${Date.now()}`,
              type: "sale",
              amount: cashAmount,
              reason: `Offline Cash Sale [Queue #${offlineQueue.length + 1}]`,
              timestamp: new Date(),
            }
          ];
          saveDrawerLogs(newLogs);
        }
      }

      // Finish up UI
      triggerReceiptUI(paymentMethodLabel);
      return;
    }

    // Server actions if online
    startTransition(async () => {
      const payload = cart.map(item => ({
        productId: item.id,
        quantity: item.cartQuantity,
      }));

      const res = await processCheckout(
        payload, 
        paymentMethodLabel,
        selectedCustomer?.name || undefined,
        selectedCustomer?.phone || undefined,
        loyaltyPointsEarned,
        redeemPoints ? loyaltyPointsMaxDiscount : 0
      );

      if (res.success) {
        // Apply stock deduction to state
        setProducts(prevProducts => 
          prevProducts.map(p => {
            const cartItem = cart.find(ci => ci.id === p.id);
            return cartItem ? { ...p, stock: p.stock - cartItem.cartQuantity } : p;
          })
        );

        // Earn Loyalty points
        if (selectedCustomer) {
          const updatedPoints = selectedCustomer.points + loyaltyPointsEarned - (redeemPoints ? loyaltyPointsMaxDiscount : 0);
          const updatedCust = customers.map(c => 
            c.id === selectedCustomer.id 
              ? { ...c, points: updatedPoints } 
              : c
          );
          saveCustomers(updatedCust);
          setSelectedCustomer({ ...selectedCustomer, points: updatedPoints });
        }

        // Save Cash drawer logs locally
        if (paymentMethod === "cash" || paymentMethod === "split") {
          const cashAmount = paymentMethod === "cash" ? finalTotal : Number(splitCash);
          if (cashAmount > 0) {
            const newLogs: CashLog[] = [
              ...cashLogs,
              {
                id: `log-${Date.now()}`,
                type: "sale",
                amount: cashAmount,
                reason: `Register Sale - Order #${Date.now().toString().slice(-4)}`,
                timestamp: new Date(),
              }
            ];
            saveDrawerLogs(newLogs);
          }
        }

        triggerReceiptUI(paymentMethodLabel);
      } else {
        alert(res.error || "Checkout failed");
      }
    });
  };

  const triggerReceiptUI = (method: string) => {
    setLastOrder([...cart]);
    setLastTotal(finalTotal);
    setLastPaymentMethod(method);
    setShowReceipt(true);
    setCheckoutModalOpen(false);
    
    // Digital Receipt Notification Mock
    if (sendDigitalReceipt && digitalPhone.trim()) {
      setReceiptStatus("Sending digital receipt...");
      setTimeout(() => {
        setReceiptStatus(`Digital receipt successfully delivered to ${digitalPhone} via WhatsApp & SMS! ✅`);
      }, 1500);
    } else {
      setReceiptStatus("");
    }

    // Reset checkout forms
    setCart([]);
    setDiscount(0);
    setSelectedCustomer(null);
    setRedeemPoints(false);
  };

  // Sync Offline Queue to backend
  const handleSyncQueue = async () => {
    if (offlineQueue.length === 0 || isSyncing) return;
    setIsSyncing(true);

    try {
      const payload = offlineQueue.map(item => ({
        cart: item.cart,
        paymentMethod: item.paymentMethod,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        loyaltyPointsEarned: item.loyaltyPointsEarned,
        loyaltyPointsRedeemed: item.loyaltyPointsRedeemed,
      }));

      const res = await processBulkCheckouts(payload);
      if (res.success) {
        saveOfflineQueue([]);
        alert("All offline checkouts successfully synchronized with server database! 🎉");
      } else {
        alert(`Offline Sync Failed: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Network error syncing offline sales: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Customer Loyalty Actions
  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setCustomerSearch("");
    setRedeemPoints(false);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustomerName,
      phone: newCustomerPhone,
      points: 10, // Starting loyalty bonus points!
    };

    const updated = [...customers, newCust];
    saveCustomers(updated);
    setSelectedCustomer(newCust);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setShowCustomerModal(false);
  };

  const filteredCustomerResults = useMemo(() => {
    if (!customerSearch.trim()) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  // Cash Drawer Session Action handlers
  const handleOpenDrawerSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (startingFloat <= 0) {
      alert("Starting Float must be greater than 0");
      return;
    }

    setIsDrawerOpenSession(true);
    localStorage.setItem("akiba_pos_drawer_active", "true");
    localStorage.setItem("akiba_pos_drawer_float", startingFloat.toString());
    
    // Add opening log
    const openLog: CashLog = {
      id: `log-${Date.now()}`,
      type: "in",
      amount: startingFloat,
      reason: "Session Opened: Float Injection",
      timestamp: new Date(),
    };
    saveDrawerLogs([openLog]);
    setShowDrawerModal(false);
  };

  const handleCashOut = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(cashOutAmount);
    if (!amountVal || amountVal <= 0) return;

    const outLog: CashLog = {
      id: `log-${Date.now()}`,
      type: "out",
      amount: amountVal,
      reason: cashOutReason || "Paid Out Expense",
      timestamp: new Date(),
    };

    saveDrawerLogs([...cashLogs, outLog]);
    setCashOutAmount("");
    setCashOutReason("");
    setShowCashOutModal(false);
  };

  const handleCloseDrawerSession = () => {
    // Requires Manager PIN if not Owner
    if (!isClearedAsManager) {
      setClearancePin("");
      setPinError("");
      setShowCloseDrawerModal(true);
      return;
    }
    closeDrawerSessionConfirmed();
  };

  const closeDrawerSessionConfirmed = () => {
    const actualVal = Number(actualCashInDrawer);
    const expectedVal = expectedCash;
    const discrepancy = actualVal - expectedVal;

    const newReport = {
      sessionStarted: new Date(cashLogs[0]?.timestamp || Date.now()).toLocaleTimeString(),
      sessionEnded: new Date().toLocaleTimeString(),
      startingFloat,
      salesCount: cashLogs.filter(l => l.type === "sale").length,
      cashSalesTotal: cashLogs.filter(l => l.type === "sale").reduce((s, i) => s + i.amount, 0),
      cashInTotal: cashLogs.filter(l => l.type === "in").reduce((s, i) => s + i.amount, 0),
      cashOutTotal: cashLogs.filter(l => l.type === "out").reduce((s, i) => s + i.amount, 0),
      expectedVal,
      actualVal,
      discrepancy,
      status: discrepancy === 0 ? "Balanced" : discrepancy > 0 ? "Overage" : "Shortage",
    };

    setDrawerCloseReport(newReport);
    setDrawerSessionHistory(prev => [newReport, ...prev]);

    // Clear session storage
    setIsDrawerOpenSession(false);
    localStorage.removeItem("akiba_pos_drawer_active");
    localStorage.removeItem("akiba_pos_drawer_float");
    localStorage.removeItem("akiba_pos_drawer_logs");
    setCashLogs([]);
    setCart([]);
    setStartingFloat(0);
    setActualCashInDrawer("");
    setShowCloseDrawerModal(false);
  };

  const verifyManagerPinForClose = () => {
    if (clearancePin === "1234") {
      setIsClearedAsManager(true);
      closeDrawerSessionConfirmed();
    } else {
      setPinError("Invalid Manager PIN. Contact Store Owner.");
    }
  };

  const expectedCash = useMemo(() => {
    let balance = startingFloat;
    cashLogs.forEach(log => {
      if (log.type === "in" && log.id !== cashLogs[0]?.id) balance += log.amount; // Add top up float
      else if (log.type === "sale") balance += log.amount;
      else if (log.type === "out") balance -= log.amount;
    });
    return balance;
  }, [startingFloat, cashLogs]);

  // Manager clearance pin discount handler
  const handleVerifyCustomDiscount = () => {
    if (clearancePin === "1234") {
      setIsClearedAsManager(true);
      setDiscount(Number(customDiscountInput) / 100);
      setCustomDiscountOpen(false);
      setClearancePin("");
      setPinError("");
    } else {
      setPinError("Invalid Manager PIN");
    }
  };

  const openCustomDiscountModal = () => {
    if (isClearedAsManager) {
      setDiscount(Number(customDiscountInput) / 100);
      setCustomDiscountOpen(false);
    } else {
      setClearancePin("");
      setPinError("");
      setCustomDiscountOpen(true);
    }
  };

  // Digital Web WhatsApp text receipt URL helper
  const generateWhatsAppLink = () => {
    if (!lastOrder.length) return "";
    let message = `*--- AKIBA AI POS RECEIPT ---*\n`;
    message += `*Date:* ${new Date().toLocaleDateString()}\n`;
    message += `*Payment:* ${lastPaymentMethod}\n`;
    message += `-----------------------------\n`;
    lastOrder.forEach(item => {
      message += `${item.cartQuantity}x ${item.name} @ KES ${item.price.toLocaleString()}\n`;
    });
    message += `-----------------------------\n`;
    message += `*Total Paid: KES ${lastTotal.toLocaleString()}*\n\n`;
    message += `Thank you for shopping with us! Powered by Akiba AI 🚀`;

    const encoded = encodeURIComponent(message);
    const phoneClean = digitalPhone.replace(/\+/g, "");
    return `https://wa.me/${phoneClean}?text=${encoded}`;
  };

  // Smart POS Dashboard computations
  const totalSalesCountToday = useMemo(() => {
    return cashLogs.filter(l => l.type === "sale").length + offlineQueue.length;
  }, [cashLogs, offlineQueue]);

  const totalRevenueToday = useMemo(() => {
    const cashRev = cashLogs.filter(l => l.type === "sale").reduce((s, i) => s + i.amount, 0);
    const offlineRev = offlineQueue.reduce((s, i) => s + i.totalPaid, 0);
    return cashRev + offlineRev;
  }, [cashLogs, offlineQueue]);

  // Derived low stock items
  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock <= 5);
  }, [products]);

  // Send Restock alerts simulation
  const triggerRestockSMS = (productName: string) => {
    alert(`Restock alert triggered successfully!\nSMS notice sent to the primary distributor for ${productName} 📦`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5fbf5]">
      
      {/* Dynamic Header */}
      <header className="bg-white border-b border-[#e4eae4] px-6 py-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00694c] text-[32px] font-black animate-pulse">point_of_sale</span>
            <div>
              <h1 className="text-xl font-black text-[#171d1a] tracking-tight">Akiba POS</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-500 animate-ping" : "bg-rose-500 animate-pulse"}`}></span>
                <span className="text-[10px] font-bold text-[#6d7a73] uppercase tracking-wider">
                  {isOnline ? "Online" : "Offline Register"}
                </span>
              </div>
            </div>
          </div>

          {/* Sync badge */}
          {offlineQueue.length > 0 && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              onClick={handleSyncQueue}
              disabled={isSyncing}
              className="bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-800 text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
              Sync Queue ({offlineQueue.length})
            </motion.button>
          )}

          {/* Cash Drawer float pill */}
          <div className="bg-[#f0fdf4] border border-[#d1ebd7] text-[#00694c] text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[14px]">local_atm</span>
            Drawer: {isDrawerOpenSession ? `Open (Float KES ${expectedCash.toLocaleString()})` : "Closed"}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-[#f8faf9] p-1 border border-[#e4eae4] rounded-xl self-start md:self-auto overflow-x-auto no-scrollbar max-w-full">
          <button 
            onClick={() => setActiveTab("register")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all ${activeTab === "register" ? "bg-[#00694c] text-white shadow-md" : "text-[#6d7a73] hover:bg-white"}`}
          >
            <span className="material-symbols-outlined text-[16px]">shopping_basket</span>
            Register
          </button>
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all ${activeTab === "dashboard" ? "bg-[#00694c] text-white shadow-md" : "text-[#6d7a73] hover:bg-white"}`}
          >
            <span className="material-symbols-outlined text-[16px]">monitoring</span>
            POS Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("cash-drawer")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all ${activeTab === "cash-drawer" ? "bg-[#00694c] text-white shadow-md" : "text-[#6d7a73] hover:bg-white"}`}
          >
            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
            Cash Drawer
          </button>
          <button 
            onClick={() => setActiveTab("ai-insights")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all ${activeTab === "ai-insights" ? "bg-[#00694c] text-white shadow-md" : "text-[#6d7a73] hover:bg-white"}`}
          >
            <span className="material-symbols-outlined text-[16px] text-purple-600">psychology</span>
            AI Insights
          </button>
        </div>

        {/* User Role Profile */}
        <div className="flex items-center gap-3 self-end md:self-auto border-t md:border-t-0 md:border-l border-[#e4eae4] pt-3 md:pt-0 md:pl-5">
          <div className="text-right">
            <div className="text-sm font-black text-[#171d1a] leading-tight">{currentUser.name}</div>
            <div className="text-[10px] font-bold text-[#6d7a73] flex items-center justify-end gap-1 uppercase tracking-widest">
              <span className="material-symbols-outlined text-[12px]">account_circle</span>
              {currentUser.role}
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: SALES REGISTER */}
          {activeTab === "register" && (
            <motion.div 
              key="register"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className="h-full flex flex-col lg:flex-row overflow-hidden relative"
            >
              {/* Left Catalog Pane */}
              <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden relative">
                
                {/* Search & Scanners Control */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#bccac1]">search</span>
                    <input 
                      type="text" 
                      placeholder="Search by name, category or barcode..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-white border border-[#e4eae4] rounded-2xl text-xs font-bold focus:border-[#00694c] focus:ring-4 focus:ring-[#00694c]/5 outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1 sm:w-48">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#bccac1]">barcode_scanner</span>
                      <input 
                        type="text" 
                        placeholder="Scan or Enter Code..." 
                        value={barcodeSearch}
                        onChange={(e) => setBarcodeSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleBarcodeScanned(barcodeSearch)}
                        className="w-full h-12 pl-11 pr-4 bg-white border border-[#e4eae4] rounded-2xl text-xs font-black text-[#00694c] tracking-widest focus:border-[#00694c] focus:ring-4 focus:ring-[#00694c]/5 outline-none shadow-sm placeholder:tracking-normal placeholder:font-bold"
                      />
                    </div>
                    
                    <button 
                      onClick={startCameraScan}
                      className="h-12 w-12 shrink-0 bg-[#00694c] text-white rounded-2xl flex items-center justify-center hover:bg-[#00523b] transition-all shadow-md active:scale-95 group"
                      title="Simulate Camera QR Barcode Scan"
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">photo_camera</span>
                    </button>
                  </div>
                </div>

                {/* Scanned Floating Alert */}
                {scannedMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className={`mb-4 p-3 rounded-xl border text-center text-xs font-black shadow-lg ${
                      scannedMessage.includes("recognized") 
                        ? "bg-rose-50 border-rose-200 text-rose-700" 
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                    }`}
                  >
                    {scannedMessage}
                  </motion.div>
                )}

                {/* Catalog Grid */}
                <div className="flex-1 overflow-y-auto pr-1 no-scrollbar pb-24 lg:pb-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 pb-12">
                    {filteredProducts.map(product => {
                      const barcode = getProductBarcode(product.id);
                      return (
                        <motion.button 
                          key={product.id}
                          whileHover={product.stock > 0 ? { scale: 1.02, y: -2 } : {}}
                          whileTap={product.stock > 0 ? { scale: 0.98 } : {}}
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                            product.stock > 0 
                              ? "bg-white border-[#e4eae4] hover:border-[#00a87a] shadow-sm hover:shadow-lg" 
                              : "bg-[#f8faf9] border-[#e4eae4] opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="text-[9px] font-black uppercase tracking-widest text-[#6d7a73] mb-1">{product.category}</div>
                          <div className="font-black text-[#171d1a] text-xs leading-tight mb-1 flex-1">{product.name}</div>
                          <div className="text-[10px] text-[#bccac1] font-mono tracking-widest mb-3 select-all">Code: {barcode}</div>
                          <div className="flex flex-col justify-between w-full mt-auto gap-2">
                            <div className="font-black text-[#00694c] text-xs">KES {product.price.toLocaleString()}</div>
                            <div className={`text-[9px] font-bold px-2 py-0.5 rounded-md self-start ${
                              product.stock > 10 ? "bg-[#f0fdf4] text-[#166534]" : 
                              product.stock > 0 ? "bg-[#fff1f2] text-[#e11d48]" : "bg-[#f3f4f6] text-[#6d7a73]"
                            }`}>
                              {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Side Register Checkout Cart */}
              <div className="w-full lg:w-[380px] xl:w-[420px] bg-white border-t lg:border-t-0 lg:border-l border-[#e4eae4] flex flex-col shadow-xl z-10">
                
                {/* Cart Customer Manager Header */}
                <div className="p-4 border-b border-[#e4eae4] bg-[#f8faf9] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-[#171d1a] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
                      Current Order
                    </h3>
                    <span className="bg-[#00694c] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {cart.reduce((s, i) => s + i.cartQuantity, 0)} items
                    </span>
                  </div>

                  {/* Customer Select / Add Row */}
                  <div className="relative">
                    {selectedCustomer ? (
                      <div className="bg-[#f0fdf4] border border-[#d1ebd7] rounded-xl p-2.5 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-black text-[#00694c]">{selectedCustomer.name}</div>
                          <div className="text-[10px] font-bold text-[#6d7a73]">{selectedCustomer.phone} | Loyalty Balance: {selectedCustomer.points} pts</div>
                        </div>
                        <button 
                          onClick={() => { setSelectedCustomer(null); setRedeemPoints(false); }}
                          className="w-6 h-6 rounded-full hover:bg-rose-100 flex items-center justify-center text-rose-500"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bccac1] text-[18px]">person_search</span>
                          <input 
                            type="text" 
                            placeholder="Add or search loyalty customer..." 
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="w-full h-10 pl-9 pr-3 bg-white border border-[#e4eae4] rounded-xl text-xs font-bold focus:border-[#00694c] outline-none"
                          />
                          {/* Search Dropdown Results */}
                          {filteredCustomerResults.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-[#e4eae4] rounded-xl shadow-lg max-h-40 overflow-y-auto z-40 p-1 space-y-0.5">
                              {filteredCustomerResults.map(cust => (
                                <button 
                                  key={cust.id}
                                  onClick={() => handleSelectCustomer(cust)}
                                  className="w-full text-left p-2 hover:bg-[#f5fbf5] rounded-lg text-xs font-bold flex justify-between items-center"
                                >
                                  <span>{cust.name} ({cust.phone})</span>
                                  <span className="text-[#00694c] font-black">{cust.points} pts</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => setShowCustomerModal(true)}
                          className="h-10 px-3 bg-white border border-[#e4eae4] hover:border-[#00694c] hover:text-[#00694c] rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">person_add</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cart Items list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence>
                    {cart.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center text-[#bccac1] py-12"
                      >
                        <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">shopping_basket</span>
                        <p className="font-black text-xs">Register cart is empty</p>
                        <p className="text-[10px] mt-0.5">Select items to begin checkout</p>
                      </motion.div>
                    ) : (
                      cart.map(item => (
                        <motion.div 
                          key={item.id} layout
                          initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="flex flex-col gap-2 p-3 bg-[#f8faf9] border border-[#e4eae4] rounded-xl"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-black text-xs text-[#171d1a] leading-tight pr-4">{item.name}</h4>
                              <div className="text-[10px] font-bold text-[#6d7a73] mt-0.5">KES {item.price.toLocaleString()} each</div>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="text-[#bccac1] hover:text-rose-500 transition-colors">
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 bg-white border border-[#e4eae4] rounded-lg p-0.5 shadow-sm">
                              <button 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center rounded text-[#171d1a] hover:bg-[#f8faf9] disabled:opacity-30"
                              >
                                <span className="material-symbols-outlined text-[16px]">remove</span>
                              </button>
                              <span className="font-black text-xs w-4 text-center">{item.cartQuantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)}
                                disabled={item.cartQuantity >= item.stock}
                                className="w-7 h-7 flex items-center justify-center rounded text-[#171d1a] hover:bg-[#f8faf9] disabled:opacity-30"
                              >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                              </button>
                            </div>
                            <div className="font-black text-[#00694c] text-xs">
                              KES {(item.price * item.cartQuantity).toLocaleString()}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                {/* POS Totals & Discounts Section */}
                <div className="p-4 bg-[#171d1a] text-white rounded-t-[24px] shadow-2xl relative z-10 space-y-4">
                  
                  {/* Preset Loyalty / Discount Controls */}
                  <div className="flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar">
                     <button onClick={() => setDiscount(0)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${discount === 0 ? "bg-[#00a87a] text-[#171d1a]" : "bg-white/10 text-[#bccac1] hover:bg-white/20"}`}>No Off</button>
                     <button onClick={() => setDiscount(0.05)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${discount === 0.05 ? "bg-[#00a87a] text-[#171d1a]" : "bg-white/10 text-[#bccac1] hover:bg-white/20"}`}>5% Off</button>
                     <button onClick={() => setDiscount(0.10)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${discount === 0.10 ? "bg-[#00a87a] text-[#171d1a]" : "bg-white/10 text-[#bccac1] hover:bg-white/20"}`}>10% Off</button>
                     <button 
                       onClick={openCustomDiscountModal}
                       className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${discount !== 0 && discount !== 0.05 && discount !== 0.10 ? "bg-[#00a87a] text-[#171d1a]" : "bg-white/10 text-[#bccac1] hover:bg-white/20"}`}
                     >
                       Custom
                     </button>
                  </div>

                  {/* Loyalty Redemptions checkbox */}
                  {selectedCustomer && selectedCustomer.points > 0 && (
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="redeem" 
                          checked={redeemPoints}
                          onChange={(e) => setRedeemPoints(e.target.checked)}
                          className="w-4 h-4 rounded text-[#00a87a] focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="redeem" className="cursor-pointer">Redeem Loyalty Points</label>
                      </div>
                      <span className="text-[#00a87a] font-black">- KES {loyaltyPointsMaxDiscount.toLocaleString()} ({loyaltyPointsMaxDiscount} pts)</span>
                    </div>
                  )}
                  
                  {/* Bill computations display */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-[#bccac1] uppercase tracking-wider">
                      <span>Subtotal</span>
                      <span>KES {subtotal.toLocaleString()}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-[10px] font-bold text-[#00a87a] uppercase tracking-wider">
                        <span>Discount ({discount * 100}%)</span>
                        <span>- KES {(subtotal * discount).toLocaleString()}</span>
                      </div>
                    )}

                    {loyaltyPointsMaxDiscount > 0 && (
                      <div className="flex justify-between text-[10px] font-bold text-[#00a87a] uppercase tracking-wider">
                        <span>Loyalty Deduct</span>
                        <span>- KES {loyaltyPointsMaxDiscount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#bccac1] uppercase tracking-wider">Total Due</span>
                        {loyaltyPointsEarned > 0 && (
                          <span className="text-[9px] text-[#00a87a] font-black uppercase tracking-widest mt-0.5">
                            Loyalty points earned: +{loyaltyPointsEarned}
                          </span>
                        )}
                      </div>
                      <span className="text-2xl font-black text-[#00a87a]">KES {finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Main checkout trigger */}
                  <motion.button 
                    onClick={handleOpenCheckout}
                    disabled={cart.length === 0 || isPending}
                    whileHover={cart.length > 0 ? { scale: 1.01 } : {}}
                    whileTap={cart.length > 0 ? { scale: 0.99 } : {}}
                    className="w-full bg-[#00a87a] hover:bg-[#008560] disabled:bg-gray-700 disabled:text-gray-400 text-[#171d1a] h-12 rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-xl shadow-[#00a87a]/10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">payment</span>
                    Proceed to Payment (Ctrl+Enter)
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: SMART DASHBOARD */}
          {activeTab === "dashboard" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className="h-full overflow-y-auto p-4 lg:p-6 space-y-6 pb-24"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#171d1a]">Today's POS Session Overview</h2>
                  <p className="text-xs text-[#6d7a73]">Smart analytics aggregated in real-time for your register.</p>
                </div>
                
                {/* Manager role protection tag */}
                {currentUser.role.toLowerCase() === "attendant" && !isClearedAsManager && (
                  <button 
                    onClick={() => {
                      setClearancePin("");
                      setPinError("");
                      setCustomDiscountOpen(true);
                    }}
                    className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Unlock Owner Metrics
                  </button>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#e4eae4] p-4 rounded-2xl shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00694c] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px] font-black">payments</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#6d7a73] uppercase tracking-wider">Total Sales Today</div>
                    <div className="text-lg font-black text-[#171d1a]">KES {totalRevenueToday.toLocaleString()}</div>
                  </div>
                </div>

                <div className="bg-white border border-[#e4eae4] p-4 rounded-2xl shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00694c]/5 text-[#00694c] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px] font-black">receipt_long</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#6d7a73] uppercase tracking-wider">Ticket Count</div>
                    <div className="text-lg font-black text-[#171d1a]">{totalSalesCountToday} tickets</div>
                  </div>
                </div>

                {/* Owner Profit Metric (Locked for attendant) */}
                <div className="bg-white border border-[#e4eae4] p-4 rounded-2xl shadow-sm flex items-center gap-3 relative overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px] font-black">currency_exchange</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#6d7a73] uppercase tracking-wider">Net Gross Margin</div>
                    {isClearedAsManager ? (
                      <div className="text-lg font-black text-[#171d1a]">
                        KES {(totalRevenueToday * 0.28).toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-xs font-black text-rose-500 mt-1 select-none flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">lock</span> LOCKED
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-[#e4eae4] p-4 rounded-2xl shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px] font-black">shopping_cart_checkout</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#6d7a73] uppercase tracking-wider">Average Basket</div>
                    <div className="text-lg font-black text-[#171d1a]">
                      KES {totalSalesCountToday > 0 ? Math.round(totalRevenueToday / totalSalesCountToday).toLocaleString() : 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle row: Payment share & Low stock alert */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* CSS Based Progress Payment Share */}
                <div className="bg-white border border-[#e4eae4] p-5 rounded-3xl shadow-sm space-y-4">
                  <h3 className="font-black text-xs uppercase tracking-widest text-[#171d1a] border-b border-[#e4eae4] pb-2">
                    Payment Method Share
                  </h3>
                  
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-[#6d7a73] mb-1.5">
                        <span>Cash Drawer Drawer</span>
                        <span className="font-black text-[#171d1a]">65% Share</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: "65%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-[#6d7a73] mb-1.5">
                        <span>M-Pesa STK</span>
                        <span className="font-black text-[#171d1a]">25% Share</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: "25%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-[#6d7a73] mb-1.5">
                        <span>Debit Card</span>
                        <span className="font-black text-[#171d1a]">10% Share</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#171d1a] rounded-full" style={{ width: "10%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Low Stock Item sync */}
                <div className="bg-white border border-[#e4eae4] p-5 rounded-3xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#e4eae4] pb-2">
                    <h3 className="font-black text-xs uppercase tracking-widest text-[#171d1a]">
                      POS Low Stock tracker
                    </h3>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {lowStockItems.length} Warnings
                    </span>
                  </div>

                  <div className="divide-y divide-[#e4eae4] max-h-48 overflow-y-auto no-scrollbar space-y-2">
                    {lowStockItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center py-2 text-xs">
                        <div>
                          <div className="font-black text-[#171d1a]">{item.name}</div>
                          <div className="text-[10px] text-[#6d7a73]">Category: {item.category}</div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="font-black text-rose-500 bg-rose-50 border border-rose-100 px-2 py-1 rounded">
                            {item.stock} left
                          </span>
                          
                          <button 
                            onClick={() => triggerRestockSMS(item.name)}
                            className="bg-[#f0fdf4] hover:bg-[#d1ebd7] text-[#00694c] border border-[#d1ebd7] text-[10px] font-black px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Send Alert
                          </button>
                        </div>
                      </div>
                    ))}
                    {lowStockItems.length === 0 && (
                      <div className="text-center py-8 text-xs font-bold text-[#bccac1]">
                        No low stock warning levels recorded today! 👍
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions Session Log */}
              <div className="bg-white border border-[#e4eae4] rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="font-black text-xs uppercase tracking-widest text-[#171d1a] border-b border-[#e4eae4] pb-2">
                  Session Ledger Logs
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[#6d7a73] font-bold border-b border-[#e4eae4] pb-2">
                        <th className="py-2.5">Time</th>
                        <th>Record / Event</th>
                        <th>Type</th>
                        <th className="text-right">Sales Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4eae4]">
                      {cashLogs.filter(l => l.type === "sale").map(log => (
                        <tr key={log.id} className="text-[#171d1a] font-bold">
                          <td className="py-2.5 text-[#6d7a73]">{log.timestamp.toLocaleTimeString()}</td>
                          <td>{log.reason}</td>
                          <td>
                            <span className="bg-emerald-50 text-[#00694c] text-[9px] px-2 py-0.5 rounded font-black border border-[#d1ebd7] uppercase">
                              CASH
                            </span>
                          </td>
                          <td className="text-right text-[#00694c]">KES {log.amount.toLocaleString()}</td>
                        </tr>
                      ))}

                      {offlineQueue.map((item, i) => (
                        <tr key={i} className="text-[#171d1a] font-bold opacity-75">
                          <td className="py-2.5 text-[#6d7a73]">{new Date(item.timestamp).toLocaleTimeString()}</td>
                          <td>Offline Queue #{i+1} | {item.itemsSummary}</td>
                          <td>
                            <span className="bg-amber-50 text-amber-800 text-[9px] px-2 py-0.5 rounded font-black border border-amber-200 uppercase">
                              Offline ({item.paymentMethod})
                            </span>
                          </td>
                          <td className="text-right text-[#00694c]">KES {item.totalPaid.toLocaleString()}</td>
                        </tr>
                      ))}

                      {cashLogs.filter(l => l.type === "sale").length === 0 && offlineQueue.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-[#bccac1] font-bold">
                            No ledger checkout transactions registered in this session yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: CASH DRAWER SESSIONS */}
          {activeTab === "cash-drawer" && (
            <motion.div 
              key="cash-drawer"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className="h-full overflow-y-auto p-4 lg:p-6 space-y-6 pb-24"
            >
              
              {!isDrawerOpenSession ? (
                /* Session Closed UI state */
                <div className="max-w-md mx-auto bg-white border border-[#e4eae4] rounded-3xl p-6 lg:p-8 shadow-xl text-center space-y-6 mt-8">
                  <div className="w-16 h-16 bg-[#f0fdf4] text-[#00694c] border border-[#d1ebd7] rounded-full flex items-center justify-center mx-auto shadow-md">
                    <span className="material-symbols-outlined text-[32px] font-black">lock</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#171d1a]">Cash Drawer Closed</h2>
                    <p className="text-xs text-[#6d7a73] mt-1">
                      Open a drawer session with a starting float to begin register sales tracking.
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => setShowDrawerModal(true)}
                    className="w-full h-12 bg-[#00694c] hover:bg-[#00523b] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">key</span>
                    Open Drawer Session
                  </button>

                  {/* Drawer session close reports audit list */}
                  {drawerSessionHistory.length > 0 && (
                    <div className="border-t border-[#e4eae4] pt-6 space-y-3 text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-[#6d7a73]">Recent Sessions Reconciliations</h4>
                      <div className="space-y-2">
                        {drawerSessionHistory.map((rep, idx) => (
                          <div key={idx} className="bg-[#f8faf9] border border-[#e4eae4] p-3 rounded-xl text-xs flex justify-between items-center font-bold">
                            <div>
                              <div className="text-[#171d1a]">{rep.sessionStarted} - {rep.sessionEnded}</div>
                              <div className="text-[10px] text-[#6d7a73] mt-0.5">{rep.salesCount} cash transactions</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[#00694c]">KES {rep.actualVal.toLocaleString()}</div>
                              <div className={`text-[9px] font-black ${
                                rep.status === "Balanced" ? "text-emerald-600" : "text-rose-600"
                              }`}>{rep.status} ({rep.discrepancy >= 0 ? "+" : ""}{rep.discrepancy})</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Session Opened UI State */
                <div className="space-y-6">
                  
                  {/* Balance ledger card info */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-[#171d1a] text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute right-4 top-4 text-white/5 font-black text-[96px] leading-none select-none">KES</div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#bccac1]">Expected Drawer Cash</span>
                        <div className="text-3xl font-black text-[#00a87a]">KES {expectedCash.toLocaleString()}</div>
                      </div>
                      <div className="border-t border-white/10 pt-4 mt-6 flex justify-between text-xs text-[#bccac1] font-bold">
                        <span>Starting Float: KES {startingFloat.toLocaleString()}</span>
                        <span>Sales: +KES {cashLogs.filter(l => l.type === "sale").reduce((s, i) => s + i.amount, 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Quick logs stats */}
                    <div className="bg-white border border-[#e4eae4] p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-[#6d7a73]">Cash Drawer Adjustments</h4>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-xs font-bold">
                          <div className="bg-[#f0fdf4] border border-[#d1ebd7] p-3 rounded-xl">
                            <div className="text-[#6d7a73]">Total Cash In</div>
                            <div className="text-lg font-black text-[#00694c] mt-1">
                              KES {cashLogs.filter(l => l.type === "in").reduce((s, i) => s + i.amount, 0).toLocaleString()}
                            </div>
                          </div>
                          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
                            <div className="text-[#6d7a73]">Total Cash Out</div>
                            <div className="text-lg font-black text-rose-700 mt-1">
                              KES {cashLogs.filter(l => l.type === "out").reduce((s, i) => s + i.amount, 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Drawer Cash adjusting actions buttons */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const amt = prompt("Enter additional cash float to inject (KES):");
                            if (amt && Number(amt) > 0) {
                              const newLogs = [
                                ...cashLogs,
                                { id: `log-${Date.now()}`, type: "in", amount: Number(amt), reason: "Manual Float Addition", timestamp: new Date() } as CashLog
                              ];
                              saveDrawerLogs(newLogs);
                            }
                          }}
                          className="flex-1 h-10 border border-[#e4eae4] hover:border-[#00694c] hover:bg-[#f0fdf4] text-[#171d1a] hover:text-[#00694c] rounded-xl text-xs font-black transition-colors"
                        >
                          + Cash In / Float
                        </button>
                        <button 
                          onClick={() => setShowCashOutModal(true)}
                          className="flex-1 h-10 border border-[#e4eae4] hover:border-rose-500 hover:bg-rose-50 text-[#171d1a] hover:text-rose-700 rounded-xl text-xs font-black transition-colors"
                        >
                          - Paid Out Expense
                        </button>
                      </div>
                    </div>

                    {/* Session Controls panel */}
                    <div className="bg-white border border-[#e4eae4] p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-[#6d7a73]">Session Details</h4>
                        <div className="mt-3 text-xs space-y-1 text-[#171d1a] font-bold">
                          <div>Opened At: {new Date(cashLogs[0]?.timestamp || Date.now()).toLocaleTimeString()}</div>
                          <div>Attendant: {currentUser.name}</div>
                          <div>Status: Active Tracking Drawer</div>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setActualCashInDrawer(expectedCash.toString());
                          setShowCloseDrawerModal(true);
                        }}
                        className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-200"
                      >
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                        Close Session & Reconcile
                      </button>
                    </div>
                  </div>

                  {/* Cash Log Transactions list */}
                  <div className="bg-white border border-[#e4eae4] rounded-3xl p-5 shadow-sm space-y-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-[#171d1a] border-b border-[#e4eae4] pb-2">
                      Cash Activity Ledger Logs
                    </h3>

                    <div className="divide-y divide-[#e4eae4] max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                      {cashLogs.slice().reverse().map(log => (
                        <div key={log.id} className="flex justify-between items-center py-3 text-xs font-bold">
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-[20px] ${
                              log.type === "in" ? "text-emerald-500" :
                              log.type === "sale" ? "text-sky-500" : "text-rose-500"
                            }`}>
                              {log.type === "in" ? "download" :
                               log.type === "sale" ? "shopping_basket" : "upload"}
                            </span>
                            <div>
                              <div className="text-[#171d1a]">{log.reason}</div>
                              <div className="text-[10px] text-[#6d7a73]">{log.timestamp.toLocaleTimeString()}</div>
                            </div>
                          </div>

                          <span className={`font-black ${
                            log.type === "in" || log.type === "sale" ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            {log.type === "in" || log.type === "sale" ? "+" : "-"} KES {log.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: AKIBA AI INSIGHTS */}
          {activeTab === "ai-insights" && (
            <motion.div 
              key="ai-insights"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className="h-full overflow-y-auto p-4 lg:p-6 space-y-6 pb-24"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Copilot Header Card */}
                <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                  {/* Glowing neon bg lights */}
                  <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-500 rounded-full filter blur-[80px] opacity-30 select-none pointer-events-none"></div>
                  <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500 rounded-full filter blur-[80px] opacity-30 select-none pointer-events-none"></div>
                  
                  <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full flex items-center justify-center shadow-xl shadow-purple-500/10 animate-bounce shrink-0">
                    <span className="material-symbols-outlined text-[48px] font-black text-purple-400">psychology</span>
                  </div>
                  
                  <div className="space-y-3 text-center md:text-left flex-1">
                    <span className="bg-purple-800/80 border border-purple-600 text-purple-200 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      Akiba AI Copilot
                    </span>
                    <h2 className="text-xl font-black tracking-tight leading-none mt-1">Smart Retail Copilot Real-Time Suggestions</h2>
                    <p className="text-xs text-purple-200/80 leading-normal max-w-xl">
                      Evaluate today's products list and session transactional profiles to boost checkout margins, dynamic pricing, and stock forecasts.
                    </p>
                    
                    {!insightsGenerated && (
                      <button 
                        onClick={() => {
                          setIsGeneratingInsights(true);
                          setTimeout(() => {
                            setIsGeneratingInsights(false);
                            setInsightsGenerated(true);
                          }, 2500);
                        }}
                        className="bg-white hover:bg-purple-100 text-purple-900 h-10 px-5 rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        {isGeneratingInsights ? "Evaluating Register Ledger..." : "Generate AI Insights"}
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Insights results */}
                {isGeneratingInsights && (
                  <div className="flex flex-col items-center justify-center py-16 text-purple-800 space-y-3">
                    <span className="material-symbols-outlined text-[48px] animate-spin">refresh</span>
                    <p className="text-xs font-black animate-pulse">Running advanced machine models on store catalog inventory logs...</p>
                  </div>
                )}

                {insightsGenerated && !isGeneratingInsights && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    {/* Insight Card 1 */}
                    <div className="bg-white border border-[#e4eae4] hover:border-purple-200 rounded-3xl p-5 shadow-sm transition-all hover:shadow-lg flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-purple-700">inventory_2</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Bundle Hack</span>
                        </div>
                        <h4 className="font-black text-sm text-[#171d1a] leading-snug">Suggest "Tea & Bread" morning breakfast bundle</h4>
                        <p className="text-xs text-[#6d7a73] leading-relaxed">
                          Analysis shows customers buying Bread match with Tea Leaves in 74% of checkouts. Set a 5% bundle discount to boost average receipt values.
                        </p>
                      </div>
                      <div className="bg-purple-50 text-purple-700 p-3 rounded-2xl text-[10px] font-bold leading-normal">
                        Estimated Revenue Increase: <strong>+12% average basket</strong>
                      </div>
                    </div>

                    {/* Insight Card 2 */}
                    <div className="bg-white border border-[#e4eae4] hover:border-purple-200 rounded-3xl p-5 shadow-sm transition-all hover:shadow-lg flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-600">thermostat</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Demand Peak</span>
                        </div>
                        <h4 className="font-black text-sm text-[#171d1a] leading-snug">Afternoon Heat wave Soft drinks velocity spike</h4>
                        <p className="text-xs text-[#6d7a73] leading-relaxed">
                          Warm sunny weather predictions for this week will likely trigger a 35% soda/juices demand surge. Maintain cooler stock levels above 20 units.
                        </p>
                      </div>
                      <div className="bg-amber-50 text-amber-800 p-3 rounded-2xl text-[10px] font-bold leading-normal">
                        Restocking Suggestion: <strong>Refill Soda coolers by 2:00 PM</strong>
                      </div>
                    </div>

                    {/* Insight Card 3 */}
                    <div className="bg-white border border-[#e4eae4] hover:border-purple-200 rounded-3xl p-5 shadow-sm transition-all hover:shadow-lg flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-rose-600">trending_down</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Slow Moving Shelf</span>
                        </div>
                        <h4 className="font-black text-sm text-[#171d1a] leading-snug">Detergent soap velocity is down by 40%</h4>
                        <p className="text-xs text-[#6d7a73] leading-relaxed">
                          Your detergent inventory log has registered 0 sales this week. Reposition stock closer to checkouts or set up an attractive weekend price discount.
                        </p>
                      </div>
                      <div className="bg-rose-50 text-rose-700 p-3 rounded-2xl text-[10px] font-bold leading-normal">
                        Action Plan: <strong>Set 5% off shelf price tag</strong>
                      </div>
                    </div>
                  </motion.div>
                )}

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* MODAL 1: OPEN CASH DRAWER MODAL */}
      <AnimatePresence>
        {showDrawerModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#171d1a]/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <span className="material-symbols-outlined text-[#00694c] text-[40px] font-black">lock_open</span>
                <h3 className="text-lg font-black text-[#171d1a]">Open Cash Drawer Session</h3>
                <p className="text-xs text-[#6d7a73]">Specify starting cash float to track currency change payouts.</p>
              </div>

              <form onSubmit={handleOpenDrawerSession} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#6d7a73] tracking-widest">Starting Float Cash (KES)</label>
                  <input 
                    type="number"
                    required
                    placeholder="e.g. 3000"
                    value={startingFloat || ""}
                    onChange={(e) => setStartingFloat(Number(e.target.value))}
                    className="w-full h-12 px-4 border border-[#e4eae4] rounded-xl text-sm font-black focus:border-[#00694c] outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full h-12 bg-[#00694c] hover:bg-[#00523b] text-white rounded-xl font-black text-xs transition-colors"
                >
                  Confirm & Initialize POS Register
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CUSTOM LOYALTY CUSTOMER CREATION MODAL */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#171d1a]/50 backdrop-blur-sm"
              onClick={() => setShowCustomerModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-[#e4eae4] pb-2">
                <h3 className="font-black text-sm text-[#171d1a]">Add Loyalty Profile</h3>
                <button onClick={() => setShowCustomerModal(false)} className="text-[#6d7a73] hover:text-black">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#6d7a73]">Customer Name</label>
                  <input 
                    type="text" required placeholder="e.g. John Mwangi" 
                    value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full h-11 px-3 border border-[#e4eae4] rounded-xl text-xs font-bold focus:border-[#00694c] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#6d7a73]">Phone Number (WhatsApp Active)</label>
                  <input 
                    type="text" required placeholder="e.g. +254712345678" 
                    value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full h-11 px-3 border border-[#e4eae4] rounded-xl text-xs font-bold focus:border-[#00694c] outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full h-11 bg-[#00694c] hover:bg-[#00523b] text-white rounded-xl font-black text-xs transition-colors"
                >
                  Create & Select Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: PAYMENT METHOD SELECTION OVERLAY */}
      <AnimatePresence>
        {checkoutModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#171d1a]/70 backdrop-blur-sm"
              onClick={() => setCheckoutModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md relative z-10 shadow-2xl space-y-6 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-[#e4eae4] pb-3 shrink-0">
                <div>
                  <h3 className="font-black text-sm text-[#171d1a]">Payment Checkout Sheet</h3>
                  <p className="text-[10px] text-[#6d7a73] mt-0.5">Select a payment mode or allocate multiple splits.</p>
                </div>
                <button onClick={() => setCheckoutModalOpen(false)} className="text-[#6d7a73] hover:text-black">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar">
                
                {/* Grand due summary */}
                <div className="bg-[#f8faf9] border border-[#e4eae4] p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-xs font-black text-[#171d1a] uppercase tracking-wider">Grand Total Due</span>
                  <span className="text-xl font-black text-[#00694c]">KES {finalTotal.toLocaleString()}</span>
                </div>

                {/* Method selector pills */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "cash", label: "Cash", icon: "payments" },
                    { id: "mpesa", label: "M-Pesa", icon: "phone_iphone" },
                    { id: "card", label: "Card", icon: "credit_card" },
                    { id: "split", label: "Split", icon: "call_split" },
                  ].map(method => (
                    <button 
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1 font-black text-[10px] transition-all uppercase tracking-wider ${
                        paymentMethod === method.id 
                          ? "bg-[#f0fdf4] border-[#00a87a] text-[#00694c] shadow-sm"
                          : "bg-white border-[#e4eae4] text-[#6d7a73] hover:bg-gray-50"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{method.icon}</span>
                      {method.label}
                    </button>
                  ))}
                </div>

                {/* Dynamic method forms */}
                {paymentMethod === "cash" && (
                  <div className="space-y-3.5 bg-[#f8faf9] p-4 rounded-2xl border border-[#e4eae4]">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[#6d7a73]">Cash Received (KES)</label>
                      <input 
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="w-full h-11 px-3 bg-white border border-[#e4eae4] rounded-xl text-sm font-black focus:border-[#00694c] outline-none"
                      />
                    </div>
                    {Number(cashReceived) >= finalTotal && (
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-[#6d7a73]">Change Payout Due</span>
                        <span className="text-emerald-600 font-black text-sm">
                          KES {(Number(cashReceived) - finalTotal).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {/* Quick Cash Payout buttons shortcuts */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button 
                        type="button" 
                        onClick={() => setCashReceived(Math.ceil(finalTotal).toString())}
                        className="h-8 bg-white hover:bg-[#f0fdf4] border border-[#e4eae4] hover:border-[#00694c] text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors"
                      >
                        Exact Cash
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          const val = Math.ceil(finalTotal / 500) * 500;
                          setCashReceived((val === Math.ceil(finalTotal) ? val + 500 : val).toString());
                        }}
                        className="h-8 bg-white hover:bg-[#f0fdf4] border border-[#e4eae4] hover:border-[#00694c] text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors"
                      >
                        Next 500
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          const val = Math.ceil(finalTotal / 1000) * 1000;
                          setCashReceived((val === Math.ceil(finalTotal) ? val + 1000 : val).toString());
                        }}
                        className="h-8 bg-white hover:bg-[#f0fdf4] border border-[#e4eae4] hover:border-[#00694c] text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors"
                      >
                        Next 1000
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === "mpesa" && (
                  <div className="space-y-3 bg-[#f8faf9] p-4 rounded-2xl border border-[#e4eae4]">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[#6d7a73]">Customer Phone Number</label>
                      <input 
                        type="text"
                        placeholder="e.g. +254712345678"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="w-full h-11 px-3 bg-white border border-[#e4eae4] rounded-xl text-sm font-black focus:border-[#00694c] outline-none"
                      />
                    </div>

                    {mpesaStatus !== "idle" && (
                      <div className="p-3 bg-[#f0fdf4] border border-[#d1ebd7] text-[#00694c] rounded-xl text-xs font-black text-center animate-pulse">
                        {mpesaStatus === "sending" && "Initializing M-Pesa STK push prompt..."}
                        {mpesaStatus === "pin" && "STK prompt delivered. Awaiting PIN input on phone..."}
                        {mpesaStatus === "success" && "M-Pesa validation received! Payment Confirmed ✅"}
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === "card" && (
                  <div className="p-6 bg-[#f8faf9] rounded-2xl border border-[#e4eae4] text-center space-y-2">
                    <span className="material-symbols-outlined text-[#6d7a73] text-[36px] animate-bounce">credit_card</span>
                    <div className="text-xs font-black text-[#171d1a]">Awaiting Debit Terminal Swipe...</div>
                    <div className="text-[10px] text-[#bccac1] font-bold">Please tap or insert credit/debit card now.</div>
                  </div>
                )}

                {paymentMethod === "split" && (
                  <div className="space-y-3 bg-[#f8faf9] p-4 rounded-2xl border border-[#e4eae4] text-xs font-bold space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-[#6d7a73]">Cash KES</label>
                        <input 
                          type="number" value={splitCash} onChange={(e) => setSplitCash(e.target.value)}
                          className="w-full h-10 px-2 bg-white border border-[#e4eae4] rounded-lg font-black text-[#00694c] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-[#6d7a73]">M-Pesa KES</label>
                        <input 
                          type="number" value={splitMpesa} onChange={(e) => setSplitMpesa(e.target.value)}
                          className="w-full h-10 px-2 bg-white border border-[#e4eae4] rounded-lg font-black text-[#00694c] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase text-[#6d7a73]">Card KES</label>
                        <input 
                          type="number" value={splitCard} onChange={(e) => setSplitCard(e.target.value)}
                          className="w-full h-10 px-2 bg-white border border-[#e4eae4] rounded-lg font-black text-[#00694c] outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-[#e4eae4] text-[10px] font-black uppercase text-[#6d7a73]">
                      <span>Allocated Sum:</span>
                      <span className={
                        Math.abs((Number(splitCash) + Number(splitMpesa) + Number(splitCard)) - finalTotal) < 1
                          ? "text-emerald-600" : "text-rose-600"
                      }>
                        KES {(Number(splitCash) + Number(splitMpesa) + Number(splitCard)).toLocaleString()} / KES {finalTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Digital receipt preference toggle */}
                <div className="flex items-center justify-between border-t border-[#e4eae4] pt-4 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" id="digital" checked={sendDigitalReceipt}
                      onChange={(e) => setSendDigitalReceipt(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00a87a] cursor-pointer"
                    />
                    <label htmlFor="digital" className="cursor-pointer">Send receipt via WhatsApp/SMS</label>
                  </div>
                  {sendDigitalReceipt && (
                    <input 
                      type="text" placeholder="+2547..." value={digitalPhone}
                      onChange={(e) => setDigitalPhone(e.target.value)}
                      className="w-36 h-8 px-2 border border-[#e4eae4] rounded-lg text-xs font-black"
                    />
                  )}
                </div>

              </div>

              {/* Complete action footer */}
              <div className="pt-2 shrink-0">
                <motion.button 
                  onClick={handleCheckout}
                  disabled={isPending}
                  className="w-full bg-[#00694c] hover:bg-[#00523b] text-white h-12 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  {isPending ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Complete Checkout Order
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: MANAGER PIN APPROVAL OR MANUAL DISCOUNT MODAL */}
      <AnimatePresence>
        {customDiscountOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-md"
              onClick={() => setCustomDiscountOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-2">
                <span className="material-symbols-outlined text-purple-700 text-[36px] font-black">lock</span>
                <h3 className="text-base font-black text-[#171d1a]">Manager Permission Lock</h3>
                <p className="text-xs text-[#6d7a73]">
                  Attendants require manager PIN authorization to unlock specific POS custom parameters.
                </p>
              </div>

              <div className="space-y-3">
                {/* If modifying discounts, let them type it first */}
                {activeTab === "register" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#6d7a73]">Discount value %</label>
                    <input 
                      type="number" placeholder="e.g. 15" value={customDiscountInput}
                      onChange={(e) => setCustomDiscountInput(e.target.value)}
                      className="w-full h-11 px-3 border border-[#e4eae4] rounded-xl font-black text-sm outline-none focus:border-[#00694c]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#6d7a73]">Enter Manager PIN</label>
                  <input 
                    type="password" placeholder="••••" maxLength={4} value={clearancePin}
                    onChange={(e) => setClearancePin(e.target.value)}
                    className="w-full h-11 px-3 border border-[#e4eae4] rounded-xl text-center font-black tracking-widest text-lg outline-none focus:border-[#00694c]"
                  />
                  {pinError && <p className="text-[10px] text-rose-600 font-bold text-center mt-1">{pinError}</p>}
                </div>

                <div className="text-center text-[9px] text-[#bccac1] font-bold">Use default PIN "1234" to clear validation.</div>

                <button 
                  onClick={activeTab === "register" ? handleVerifyCustomDiscount : () => {
                    if (clearancePin === "1234") {
                      setIsClearedAsManager(true);
                      setCustomDiscountOpen(false);
                    } else {
                      setPinError("Invalid Manager PIN");
                    }
                  }}
                  className="w-full h-11 bg-[#00694c] hover:bg-[#00523b] text-white rounded-xl font-black text-xs transition-colors"
                >
                  Verify Manager PIN Override
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: RECEIPT & SUCCESS POPUP */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-6 lg:p-8 w-full max-w-sm relative z-10 shadow-2xl flex flex-col items-center text-center max-h-[90vh] overflow-y-auto"
            >
              <div className="w-16 h-16 bg-[#00694c] text-white rounded-full flex items-center justify-center mb-4 shadow-xl shadow-[#00694c]/10">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>
              <h2 className="text-xl font-black text-[#171d1a] mb-1">Checkout Completed!</h2>
              <p className="text-[#6d7a73] text-xs font-bold">Transaction registered. Stocks subtracted.</p>
              
              {/* Receipt Body */}
              <div className="w-full bg-[#f8faf9] border border-[#e4eae4] border-dashed rounded-2xl p-5 my-5 text-left text-xs font-bold">
                 <div className="flex justify-between text-[10px] text-[#bccac1] uppercase tracking-widest mb-3">
                    <span>Cart Items Description</span>
                    <span>Subtotal KES</span>
                 </div>
                 <div className="space-y-2 mb-3 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
                    {lastOrder.map((item, i) => (
                       <div key={i} className="flex justify-between text-[#171d1a] font-black">
                          <span className="truncate pr-4">{item.cartQuantity}x {item.name}</span>
                          <span className="shrink-0">{(item.price * item.cartQuantity).toLocaleString()}</span>
                       </div>
                    ))}
                 </div>
                 <div className="border-t border-[#e4eae4] border-dashed pt-3 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] text-[#6d7a73]">
                      <span>Payment Method:</span>
                      <span className="uppercase text-[#171d1a] font-black">{lastPaymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#e4eae4] border-dashed mt-1">
                       <span className="text-[10px] text-[#171d1a] uppercase tracking-widest">Total Paid</span>
                       <span className="text-lg font-black text-[#00694c]">KES {lastTotal.toLocaleString()}</span>
                    </div>
                 </div>
              </div>

              {/* Digital receipts notification banner logs */}
              {receiptStatus && (
                <div className="w-full p-2.5 bg-[#f0fdf4] border border-[#d1ebd7] text-[#00694c] text-[10px] font-bold rounded-xl mb-4 text-center">
                  {receiptStatus}
                </div>
              )}

              <div className="w-full space-y-2">
                 {/* WhatsApp Redirect trigger */}
                 {sendDigitalReceipt && digitalPhone && (
                   <a 
                     href={generateWhatsAppLink()}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="w-full h-11 bg-[#25d366] hover:bg-[#20ba56] text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
                   >
                     <span className="material-symbols-outlined text-[18px]">chat</span>
                     Send WhatsApp Web Receipt
                   </a>
                 )}

                 <button 
                   onClick={() => window.print()}
                   className="w-full h-11 bg-[#171d1a] hover:bg-black text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
                 >
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    Print Paper Receipt
                 </button>
                 
                 <button 
                   onClick={() => setShowReceipt(false)} 
                   className="w-full h-11 bg-[#f8faf9] hover:bg-[#e4eae4] text-[#171d1a] rounded-xl font-black text-xs transition-colors"
                 >
                    Start Next Register Order
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 6: CAMERA SCANNER SIMULATION MODAL */}
      <AnimatePresence>
        {isScanning && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#171d1a]/85 backdrop-blur-sm"
              onClick={() => setIsScanning(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl flex flex-col items-center space-y-6 text-center"
            >
              <div className="space-y-1">
                <h3 className="font-black text-sm text-[#171d1a]">Simulated QR/Barcode Camera Scanner</h3>
                <p className="text-[10px] text-[#6d7a73]">Accessing register scanner camera feed...</p>
              </div>

              {/* Glowing Scan Box with Laser line */}
              <div className="w-56 h-56 border-2 border-emerald-500 rounded-3xl relative overflow-hidden bg-gray-100 flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-gray-300 text-[64px]">qr_code_scanner</span>
                
                {/* Horizontal scan line */}
                {scanLaserActive && (
                  <motion.div 
                    animate={{ y: [0, 224, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-md shadow-emerald-500/50"
                    style={{ top: 0 }}
                  />
                )}
              </div>

              <div className="text-[10px] font-bold text-[#6d7a73] leading-normal">
                Align the product barcode within the scanner box.<br />
                Simulating camera recognition...
              </div>

              <button 
                onClick={() => setIsScanning(false)}
                className="w-full h-11 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-black text-xs transition-all active:scale-95"
              >
                Cancel Scanning Session
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 7: CASH OUT EXPENSE MODAL */}
      <AnimatePresence>
        {showCashOutModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#171d1a]/55 backdrop-blur-sm"
              onClick={() => setShowCashOutModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-[#e4eae4] pb-2">
                <h3 className="font-black text-sm text-[#171d1a]">Record Cash Drawer Paid Out Expense</h3>
                <button onClick={() => setShowCashOutModal(false)} className="text-[#6d7a73] hover:text-black">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCashOut} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#6d7a73]">Paid Out Cash amount (KES)</label>
                  <input 
                    type="number" required placeholder="e.g. 500" value={cashOutAmount}
                    onChange={(e) => setCashOutAmount(e.target.value)}
                    className="w-full h-11 px-3 border border-[#e4eae4] rounded-xl text-xs font-black focus:border-[#00694c] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#6d7a73]">Expense Reason Description</label>
                  <input 
                    type="text" required placeholder="e.g. Vendor delivery, lunch, cleaning soap" 
                    value={cashOutReason} onChange={(e) => setCashOutReason(e.target.value)}
                    className="w-full h-11 px-3 border border-[#e4eae4] rounded-xl text-xs font-bold focus:border-[#00694c] outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs transition-colors shadow-md"
                >
                  Confirm Paid Out cash Adjustment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 8: CLOSE CASH DRAWER & RECONCILE MODAL */}
      <AnimatePresence>
        {showCloseDrawerModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-md"
              onClick={() => setShowCloseDrawerModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2 border-b border-[#e4eae4] pb-3">
                <span className="material-symbols-outlined text-rose-600 text-[40px] font-black animate-pulse">lock</span>
                <h3 className="text-base font-black text-[#171d1a]">Reconcile Drawer Cash & Close</h3>
                <p className="text-xs text-[#6d7a73]">
                  Count the physical paper cash inside your physical cash drawer and audit discrepancies.
                </p>
              </div>

              <div className="space-y-4">
                {/* PIN lock if not Owner and not cleared */}
                {!isClearedAsManager ? (
                  <div className="space-y-3 bg-[#fff1f2] border border-[#ffe4e6] p-4 rounded-2xl text-xs font-bold text-rose-800">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                      Manager Clearance Required
                    </div>
                    <p className="text-[10px] text-[#6d7a73] font-medium leading-relaxed">
                      Only Store Owners or approved Managers can close register drawer sessions. Type manager credentials PIN to proceed.
                    </p>
                    <div className="space-y-1 text-left mt-2">
                      <label className="text-[10px] uppercase text-[#6d7a73]">Enter PIN</label>
                      <input 
                        type="password" placeholder="••••" maxLength={4} value={clearancePin}
                        onChange={(e) => setClearancePin(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-[#e4eae4] rounded-lg text-center font-black tracking-widest outline-none"
                      />
                      {pinError && <p className="text-[9px] text-rose-600 font-bold mt-1">{pinError}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#f0fdf4] border border-[#d1ebd7] p-3 rounded-2xl text-xs font-bold text-[#00694c] flex justify-between items-center">
                    <span>System Ledger Expected Cash:</span>
                    <span className="text-sm font-black">KES {expectedCash.toLocaleString()}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#6d7a73]">Actual Cash Counted (KES)</label>
                  <input 
                    type="number" required placeholder="e.g. 8300" value={actualCashInDrawer}
                    onChange={(e) => setActualCashInDrawer(e.target.value)}
                    className="w-full h-11 px-3 border border-[#e4eae4] rounded-xl text-sm font-black focus:border-[#00694c] outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowCloseDrawerModal(false)}
                    className="flex-1 h-11 bg-[#f8faf9] hover:bg-[#e4eae4] border border-[#e4eae4] text-xs font-black rounded-xl transition-all"
                  >
                    Keep Session Open
                  </button>
                  <button 
                    onClick={!isClearedAsManager ? verifyManagerPinForClose : closeDrawerSessionConfirmed}
                    className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all shadow-md"
                  >
                    Submit & Close Session
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
