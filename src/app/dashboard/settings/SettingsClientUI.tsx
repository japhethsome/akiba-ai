"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { updateSettings, changeUserPassword } from "@/lib/actions/settings";
import { logout } from "@/lib/actions/auth";

interface SettingsClientUIProps {
  initialData: {
    userName: string;
    userEmail: string;
    userPhone: string;
    userRole: string;
    avatar: string | null;
    userCreatedAt: Date | string;
    storeName: string;
    storeCategory: string | null;
    storeAddress?: string | null;
    storePhone?: string | null;
    storeEmail?: string | null;
    managerPin?: string | null;
    storeDescription?: string | null;
    regNumber?: string | null;
    taxPin?: string | null;
    website?: string | null;
    city?: string | null;
    county?: string | null;
    postalCode?: string | null;
    receiptFooter?: string | null;
    twoFactorEnabled?: boolean;
    theme?: string;
    language?: string;
    currency?: string;
    timezone?: string;
    dateFormat?: string;
  };
}

export function SettingsClientUI({ initialData }: SettingsClientUIProps) {
  const router = useRouter();

  // Settings State variables
  const [userName, setUserName] = useState(initialData.userName);
  const [userEmail, setUserEmail] = useState(initialData.userEmail);
  const [userPhone, setUserPhone] = useState(initialData.userPhone);
  const [avatar, setAvatar] = useState(initialData.avatar || "");
  
  const [storeName, setStoreName] = useState(initialData.storeName);
  const [storeCategory, setStoreCategory] = useState(initialData.storeCategory || "");
  const [storeDescription, setStoreDescription] = useState(initialData.storeDescription || "");
  const [regNumber, setRegNumber] = useState(initialData.regNumber || "");
  const [taxPin, setTaxPin] = useState(initialData.taxPin || "");
  const [website, setWebsite] = useState(initialData.website || "");

  const [storeAddress, setStoreAddress] = useState(initialData.storeAddress || "");
  const [city, setCity] = useState(initialData.city || "");
  const [county, setCounty] = useState(initialData.county || "");
  const [postalCode, setPostalCode] = useState(initialData.postalCode || "");
  const [storePhone, setStorePhone] = useState(initialData.storePhone || "");
  const [storeEmail, setStoreEmail] = useState(initialData.storeEmail || "");
  const [receiptFooter, setReceiptFooter] = useState(initialData.receiptFooter || "Thank you for shopping with us.");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Manager Pin and 2FA
  const [managerPin, setManagerPin] = useState(initialData.managerPin || "1234");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialData.twoFactorEnabled || false);

  // Preferences
  const [theme, setTheme] = useState(initialData.theme || "light");
  const [language, setLanguage] = useState(initialData.language || "en");
  const [currency, setCurrency] = useState(initialData.currency || "KES");
  const [timezone, setTimezone] = useState(initialData.timezone || "Africa/Nairobi");
  const [dateFormat, setDateFormat] = useState(initialData.dateFormat || "DD/MM/YYYY");

  // UI States
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Crop image states
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [srcImage, setSrcImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // System Settings Card Modals state


  // Mock scan status for Devices Modal
  const [isScanningDevices, setIsScanningDevices] = useState(false);
  const [deviceScanLogs, setDeviceScanLogs] = useState<string[]>(["Idle"]);

  // Mock backup logs
  const [backupsList, setBackupsList] = useState([
    { name: "backup_daily_2026-06-16.sql", date: "2026-06-16 11:59 PM", size: "14.2 MB" },
    { name: "backup_manual_init.sql", date: "2026-06-15 04:30 PM", size: "13.9 MB" },
  ]);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Mock Invite Staff States
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("clerk");
  const [staffList, setStaffList] = useState([
    { name: "John Doe", email: "john@akiba.ai", role: "Owner", status: "Active" },
    { name: "Jane Wambui", email: "jane@akiba.ai", role: "Manager", status: "Active" },
    { name: "Alex Kiprop", email: "alex@akiba.ai", role: "Clerk", status: "Active" }
  ]);

  // HTML5 canvas rendering for crop preview
  useEffect(() => {
    if (!srcImage || !canvasRef.current || !isCropModalOpen) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = srcImage;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Circular crop mask
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 100, 0, Math.PI * 2);
      ctx.clip();

      const aspect = img.width / img.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      if (aspect > 1) {
        drawWidth = canvas.height * aspect;
      } else {
        drawHeight = canvas.width / aspect;
      }

      drawWidth *= zoom;
      drawHeight *= zoom;

      const x = (canvas.width - drawWidth) / 2 + pan.x;
      const y = (canvas.height - drawHeight) / 2 + pan.y;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      ctx.restore();

      // Circular green helper border
      ctx.strokeStyle = "#00694c";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 100, 0, Math.PI * 2);
      ctx.stroke();
    };
  }, [srcImage, zoom, pan, isCropModalOpen]);

  // Crop panning handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPan({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
  };

  // Extract base64 circular crop
  const handleSaveCrop = () => {
    if (!canvasRef.current) return;
    const srcCanvas = canvasRef.current;
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = 200;
    cropCanvas.height = 200;
    const cropCtx = cropCanvas.getContext("2d");

    if (cropCtx) {
      cropCtx.beginPath();
      cropCtx.arc(100, 100, 100, 0, Math.PI * 2);
      cropCtx.clip();
      cropCtx.drawImage(
        srcCanvas,
        srcCanvas.width / 2 - 100,
        srcCanvas.height / 2 - 100,
        200,
        200,
        0,
        0,
        200,
        200
      );

      const croppedBase64 = cropCanvas.toDataURL("image/jpeg");
      setAvatar(croppedBase64);
      setIsCropModalOpen(false);
      setSrcImage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSrcImage(event.target?.result as string);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Compare states to detect unsaved changes
  const hasChanges = () => {
    return (
      userName !== initialData.userName ||
      userEmail !== initialData.userEmail ||
      userPhone !== initialData.userPhone ||
      avatar !== (initialData.avatar || "") ||
      storeName !== initialData.storeName ||
      storeCategory !== (initialData.storeCategory || "") ||
      storeDescription !== (initialData.storeDescription || "") ||
      regNumber !== (initialData.regNumber || "") ||
      taxPin !== (initialData.taxPin || "") ||
      website !== (initialData.website || "") ||
      storeAddress !== (initialData.storeAddress || "") ||
      city !== (initialData.city || "") ||
      county !== (initialData.county || "") ||
      postalCode !== (initialData.postalCode || "") ||
      storePhone !== (initialData.storePhone || "") ||
      storeEmail !== (initialData.storeEmail || "") ||
      receiptFooter !== (initialData.receiptFooter || "Thank you for shopping with us.") ||
      managerPin !== (initialData.managerPin || "1234") ||
      twoFactorEnabled !== (initialData.twoFactorEnabled || false) ||
      theme !== (initialData.theme || "light") ||
      language !== (initialData.language || "en") ||
      currency !== (initialData.currency || "KES") ||
      timezone !== (initialData.timezone || "Africa/Nairobi") ||
      dateFormat !== (initialData.dateFormat || "DD/MM/YYYY") ||
      currentPassword !== "" ||
      newPassword !== "" ||
      confirmPassword !== ""
    );
  };

  // Reset states to original values
  const handleReset = () => {
    setUserName(initialData.userName);
    setUserEmail(initialData.userEmail);
    setUserPhone(initialData.userPhone);
    setAvatar(initialData.avatar || "");
    setStoreName(initialData.storeName);
    setStoreCategory(initialData.storeCategory || "");
    setStoreDescription(initialData.storeDescription || "");
    setRegNumber(initialData.regNumber || "");
    setTaxPin(initialData.taxPin || "");
    setWebsite(initialData.website || "");
    setStoreAddress(initialData.storeAddress || "");
    setCity(initialData.city || "");
    setCounty(initialData.county || "");
    setPostalCode(initialData.postalCode || "");
    setStorePhone(initialData.storePhone || "");
    setStoreEmail(initialData.storeEmail || "");
    setReceiptFooter(initialData.receiptFooter || "Thank you for shopping with us.");
    setManagerPin(initialData.managerPin || "1234");
    setTwoFactorEnabled(initialData.twoFactorEnabled || false);
    setTheme(initialData.theme || "light");
    setLanguage(initialData.language || "en");
    setCurrency(initialData.currency || "KES");
    setTimezone(initialData.timezone || "Africa/Nairobi");
    setDateFormat(initialData.dateFormat || "DD/MM/YYYY");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
    setIsEditingBusiness(false);
  };

  // Form submit handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const isClerk = initialData.userRole !== "owner";

    // Validations
    if (!userEmail.trim() || !userPhone.trim()) {
      setError("Email and Phone number are required.");
      setLoading(false);
      return;
    }

    if (!isClerk) {
      if (!userName.trim() || !storeName.trim() || !storeCategory.trim()) {
        setError("Owner Name, Store Name and Category are required.");
        setLoading(false);
        return;
      }
      if (managerPin.length !== 4) {
        setError("Manager Clearance PIN must be exactly 4 digits.");
        setLoading(false);
        return;
      }
    }

    // Process password change if filled
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("All password fields are required to update your password.");
        setLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New password and confirmation password do not match.");
        setLoading(false);
        return;
      }
      const passResult = await changeUserPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!passResult.success) {
        setError(passResult.error || "Failed to change password.");
        setLoading(false);
        return;
      }
      // Clear password states on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    // Process other settings
    const result = await updateSettings({
      userName,
      storeName,
      storeCategory,
      userEmail,
      userPhone,
      avatar,
      storeAddress,
      storePhone,
      storeEmail,
      managerPin,
      storeDescription,
      regNumber,
      taxPin,
      website,
      city,
      county,
      postalCode,
      receiptFooter,
      twoFactorEnabled,
      theme,
      language,
      currency,
      timezone,
      dateFormat,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to update settings.");
    } else {
      setSuccess("Changes saved successfully!");
      setIsEditingBusiness(false);
      router.refresh();
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  // Simulated backup trigger
  const triggerManualBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0] + " " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newBackup = {
        name: `backup_manual_${now.getTime()}.sql`,
        date: dateStr,
        size: "14.5 MB"
      };
      setBackupsList([newBackup, ...backupsList]);
      setIsBackingUp(false);
    }, 2500);
  };

  // Simulated Device Scan
  const scanForDevices = () => {
    setIsScanningDevices(true);
    setDeviceScanLogs(["Initializing scanning protocol...", "Searching USB hubs...", "Listening on network ports..."]);
    setTimeout(() => {
      setDeviceScanLogs((prev) => [...prev, "Found Thermal Printer (XP-80) on network."]);
    }, 1200);
    setTimeout(() => {
      setDeviceScanLogs((prev) => [...prev, "Found Bluetooth Barcode Scanner (Scanner_44B)."]);
    }, 2500);
    setTimeout(() => {
      setDeviceScanLogs((prev) => [...prev, "Scan complete. 2 device ports matched."]);
      setIsScanningDevices(false);
    }, 3500);
  };

  // Simulated invite staff
  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setStaffList([...staffList, {
      name: inviteName,
      email: inviteEmail,
      role: inviteRole.charAt(0).toUpperCase() + inviteRole.slice(1),
      status: "Invited"
    }]);
    setInviteName("");
    setInviteEmail("");
  };

  const businessCategories = [
    "Small dukas (retail shops / kiosks)",
    "Mini supermarkets",
    "Wholesale shops & distributors",
    "Open-air market traders (stalls, vendors)",
    "Grocery shops & fruit/vegetable stores",
    "Pharmacies",
    "Agro-vet shops (farm inputs, animal feed, pesticides)",
    "Hardware stores",
    "Restaurants & cafes",
    "Food kiosks / street food vendors (mama mboga, chapati, snacks)",
    "Bakeries",
    "Bars & liquor stores (POS relevance only)",
    "Hair salons & barbershops",
    "Cosmetics & beauty shops",
    "Boutiques / clothing shops",
    "Tailoring shops",
    "Mobile phone & electronics shops",
    "Spare parts shops (motorbike/car parts)",
    "Small logistics & courier services",
    "Boda boda delivery businesses (small dispatch/logistics operations)",
    "Small construction material shops",
    "Printing & cyber cafés",
    "Small guesthouses & lodges",
    "Dairy shops & milk vendors",
    "Small-scale manufacturers (soap, furniture, food processing)",
    "Other Business / Custom"
  ];

  const formattedMembershipDate = () => {
    try {
      const d = new Date(initialData.userCreatedAt);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return "June 2026";
    }
  };

  const isClerk = initialData.userRole !== "owner";

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full pb-28">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[11px] font-black text-[#00694c] uppercase tracking-[0.25em] bg-[#f0fdf4] px-4 py-2 rounded-full border border-[#00694c]/10">
            Control Panel
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-[#171d1a] tracking-tight mt-3">
            Store &amp; Account Settings
          </h1>
          <p className="text-sm font-medium text-[#6d7a73] mt-2">
            {isClerk 
              ? "Update your personal profile, credentials, and customize your app preferences."
              : "Complete configuration hub for your business settings, staff details, invoicing, and security preferences."}
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Profile Card */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white border border-[#e4eae4] rounded-[24px] p-6 flex flex-col items-center justify-between text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00a87a]/5 to-transparent rounded-bl-[100px] pointer-events-none" />
            
            <div className="relative group cursor-pointer mt-4 w-24 h-24 rounded-[32px] overflow-hidden shadow-lg shadow-black/10 border border-[#e4eae4]" onClick={() => setIsCropModalOpen(true)}>
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#171d1a] text-white font-black text-3xl flex items-center justify-center">
                  {userName ? userName.charAt(0).toUpperCase() : "A"}
                </div>
              )}
              {/* Camera Icon Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
              </div>
            </div>

            <div className="mt-4">
              <h2 className="text-xl font-black text-[#171d1a]">{userName}</h2>
              <span className="text-[10px] font-black text-[#00694c] uppercase tracking-wider bg-[#f0fdf4] px-2.5 py-1 rounded-full border border-[#00694c]/10 inline-block mt-1.5">
                {initialData.userRole.toUpperCase()}
              </span>
            </div>

            {/* Profile Contact summary details */}
            <div className="w-full border-t border-[#e4eae4] pt-4 mt-6 space-y-3.5 text-left text-xs font-semibold text-[#6d7a73]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-[#bccac1]">mail</span>
                <span className="truncate">{userEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-[#bccac1]">call</span>
                <span>{userPhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-[#bccac1]">calendar_today</span>
                <span>Joined {formattedMembershipDate()}</span>
              </div>
            </div>

            {/* Quick Actions inside Card */}
            <div className="w-full border-t border-[#e4eae4] pt-4 mt-6 space-y-3">
              <button 
                onClick={() => {
                  const el = document.getElementById("security-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full h-11 border border-[#e4eae4] text-[#3d4943] hover:bg-[#f8faf9] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                Change Password
              </button>
              
              <button 
                onClick={() => logout()}
                className="w-full h-11 border border-[#ba1a1a]/25 text-[#ba1a1a] bg-[#ba1a1a]/5 hover:bg-[#ba1a1a] hover:text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Logout from System
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Structured Settings Panel */}
        <div className="md:col-span-8 space-y-8">
          
          {/* Status alerts */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              {success}
            </div>
          )}

          {/* SECTION 1: BUSINESS INFORMATION */}
          <div className="bg-white border border-[#e4eae4] rounded-[24px] p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-[#e4eae4] pb-4">
              <div>
                <h3 className="text-lg font-black text-[#171d1a] tracking-tight">
                  Business Information
                </h3>
                <p className="text-xs font-semibold text-[#6d7a73]">
                  Manage the core details of your organization and retail store.
                </p>
              </div>
              {!isClerk && (
                <button
                  type="button"
                  onClick={() => setIsEditingBusiness(!isEditingBusiness)}
                  className="px-3.5 py-2 border border-[#e4eae4] hover:bg-[#f8faf9] text-xs font-black text-[#3d4943] rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isEditingBusiness ? "close" : "edit"}
                  </span>
                  {isEditingBusiness ? "Cancel" : "Edit Details"}
                </button>
              )}
            </div>

            {/* Read-Only Layout vs Editable Layout */}
            {!isEditingBusiness ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#f8faf9] p-4 rounded-2xl border border-[#e4eae4]/60">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#6d7a73]">Owner / Manager Name</span>
                  <p className="text-sm font-bold text-[#171d1a] mt-1">{userName || "N/A"}</p>
                </div>
                <div className="bg-[#f8faf9] p-4 rounded-2xl border border-[#e4eae4]/60">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#6d7a73]">Store Name</span>
                  <p className="text-sm font-bold text-[#171d1a] mt-1">{storeName || "N/A"}</p>
                </div>
                <div className="bg-[#f8faf9] p-4 rounded-2xl border border-[#e4eae4]/60 md:col-span-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#6d7a73]">Business Category</span>
                  <p className="text-sm font-bold text-[#171d1a] mt-1">{storeCategory || "N/A"}</p>
                </div>
                <div className="bg-[#f8faf9] p-4 rounded-2xl border border-[#e4eae4]/60 md:col-span-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#6d7a73]">Business Description</span>
                  <p className="text-sm font-bold text-[#171d1a] mt-1">{storeDescription || "A beautiful retail storefront."}</p>
                </div>
                <div className="bg-[#f8faf9] p-4 rounded-2xl border border-[#e4eae4]/60">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#6d7a73]">Registration Number</span>
                  <p className="text-sm font-bold text-[#171d1a] mt-1">{regNumber || "Not Provided"}</p>
                </div>
                <div className="bg-[#f8faf9] p-4 rounded-2xl border border-[#e4eae4]/60">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#6d7a73]">Tax PIN</span>
                  <p className="text-sm font-bold text-[#171d1a] mt-1">{taxPin || "Not Provided"}</p>
                </div>
                <div className="bg-[#f8faf9] p-4 rounded-2xl border border-[#e4eae4]/60">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#6d7a73]">Business Email Address</span>
                  <p className="text-sm font-bold text-[#171d1a] mt-1">{userEmail || "N/A"}</p>
                </div>
                <div className="bg-[#f8faf9] p-4 rounded-2xl border border-[#e4eae4]/60">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#6d7a73]">Business Phone Number</span>
                  <p className="text-sm font-bold text-[#171d1a] mt-1">{userPhone || "N/A"}</p>
                </div>
                <div className="bg-[#f8faf9] p-4 rounded-2xl border border-[#e4eae4]/60 md:col-span-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#6d7a73]">Website URL</span>
                  <p className="text-sm font-bold text-[#00694c] mt-1">{website || "None"}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                      Owner / Manager Name
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                      Store Name
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Akiba Retailers"
                      className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                    Store Category
                  </label>
                  <select
                    value={storeCategory}
                    onChange={(e) => setStoreCategory(e.target.value)}
                    className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all appearance-none"
                  >
                    <option value="" disabled>Select business type</option>
                    {businessCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                    Business Description
                  </label>
                  <textarea
                    rows={3}
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Brief description of products sold or business model"
                    className="w-full p-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="e.g. CPR-123456"
                      className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                      Tax PIN
                    </label>
                    <input
                      type="text"
                      value={taxPin}
                      onChange={(e) => setTaxPin(e.target.value)}
                      placeholder="e.g. P051234567A"
                      className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="email@store.com"
                      className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="e.g. +254 700 123456"
                      className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                    Optional Website
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://mybusiness.com"
                    className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: INVOICE DETAILS */}
          {!isClerk && (
            <div className="bg-white border border-[#e4eae4] rounded-[24px] p-6 md:p-8 shadow-sm">
              <div className="mb-6 border-b border-[#e4eae4] pb-4">
                <h3 className="text-lg font-black text-[#171d1a] tracking-tight">
                  Invoice &amp; Receipt Configuration
                </h3>
                <p className="text-xs font-semibold text-[#6d7a73]">
                  Configure address and message templates printed on customer invoices.
                </p>
              </div>

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                    Physical Shop Address
                  </label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="e.g. Suite 4, Biashara Street"
                    className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Nairobi"
                      className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                      County / Region
                    </label>
                    <input
                      type="text"
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      placeholder="e.g. Nairobi County"
                      className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 00100"
                      className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                      Business Phone (Invoice)
                    </label>
                    <input
                      type="text"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="e.g. +254 700 000 000"
                      className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                      Business Email (Invoice)
                    </label>
                    <input
                      type="email"
                      value={storeEmail}
                      onChange={(e) => setStoreEmail(e.target.value)}
                      placeholder="e.g. invoices@shop.com"
                      className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-[#3d4943]">
                    Receipt Footer Message
                  </label>
                  <input
                    type="text"
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder="e.g. Thank you for shopping with us!"
                    className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SECURITY SECTION */}
          <div id="security-section" className="bg-white border border-[#e4eae4] rounded-[24px] p-6 md:p-8 shadow-sm">
            <div className="mb-6 border-b border-[#e4eae4] pb-4">
              <h3 className="text-lg font-black text-[#171d1a] tracking-tight">
                Security Settings
              </h3>
              <p className="text-xs font-semibold text-[#6d7a73]">
                Manage account passwords, high-risk clearance clearance, and authentication.
              </p>
            </div>

            <div className="space-y-6">
              {/* Password update inputs */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#3d4943]">Change Password</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (min 6 chars)"
                    className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-xs font-semibold outline-none focus:border-[#00694c] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Clearance PIN config */}
              {!isClerk && (
                <div className="border-t border-[#e4eae4] pt-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#3d4943]">Manager Clearance PIN</span>
                      <p className="text-[11px] font-semibold text-[#6d7a73] mt-1">
                        Required for sensitive register actions (refunds, voids, cashouts).
                      </p>
                    </div>
                    <input
                      type="password"
                      maxLength={4}
                      value={managerPin}
                      onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="PIN"
                      className="w-24 h-12 px-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-xl text-center font-black tracking-widest text-sm outline-none focus:border-[#00694c] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              {/* 2FA Toggle switch */}
              <div className="border-t border-[#e4eae4] pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#3d4943]">Two-Factor Authentication (2FA)</span>
                    <p className="text-[11px] font-semibold text-[#6d7a73] mt-1">
                      Status: <span className={twoFactorEnabled ? "text-[#00694c] font-black " : "text-[#ba1a1a] font-black"}>
                        {twoFactorEnabled ? "Secured (Active)" : "Inactive (Not Protected)"}
                      </span>
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#dee4de] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00694c]" />
                  </label>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className={`fixed bottom-[68px] md:bottom-0 left-0 right-0 h-20 bg-white/95 border-t border-[#e4eae4] shadow-lg flex items-center justify-between px-4 sm:px-6 z-40 transition-transform duration-300 ${
        hasChanges() ? "translate-y-0" : "translate-y-0"
      }`}>
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {hasChanges() ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-amber-600 truncate">Unsaved changes</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-[#00694c] flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-[#00694c] truncate">All in sync</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges() || loading}
              className="px-2.5 sm:px-4 py-2 text-[10px] sm:text-xs font-black text-[#ba1a1a] hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={!hasChanges() || loading}
              className="px-3.5 sm:px-6 h-10 sm:h-11 bg-[#171d1a] hover:bg-black text-white text-[10px] sm:text-xs font-black rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm disabled:opacity-40 cursor-pointer"
            >
              {loading ? "Saving..." : "Save"}
              {!loading && <span className="material-symbols-outlined text-[14px] sm:text-[16px]">check</span>}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: PROFILE PIC CROP & SAVE */}
      <AnimatePresence>
        {isCropModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-[#e4eae4]"
            >
              <h3 className="text-lg font-black text-[#171d1a] tracking-tight mb-4">
                Update Profile Avatar
              </h3>
              
              <div className="flex flex-col items-center gap-4">
                {/* Upload select button */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatar-file-picker"
                />
                
                {srcImage ? (
                  <div className="w-full flex flex-col items-center">
                    <p className="text-[10px] text-[#6d7a73] mb-2">Drag inside the circle to reposition, slide to zoom</p>
                    {/* Interactive Canvas container */}
                    <div className="relative border border-[#e4eae4] rounded-2xl overflow-hidden bg-gray-50">
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={300}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleMouseUp}
                        className="cursor-move block"
                      />
                    </div>
                    {/* Zoom Slider */}
                    <div className="w-full mt-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#6d7a73] text-[18px]">zoom_out</span>
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-[#dee4de] rounded-lg appearance-none cursor-pointer accent-[#00694c]"
                      />
                      <span className="material-symbols-outlined text-[#6d7a73] text-[18px]">zoom_in</span>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="avatar-file-picker"
                    className="w-full h-44 border-2 border-dashed border-[#e4eae4] rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#00694c] transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[#bccac1] text-[36px]">image</span>
                    <span className="text-xs font-bold text-[#6d7a73]">Select image from device</span>
                  </label>
                )}

                <div className="w-full grid grid-cols-2 gap-2 mt-4">
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatar("");
                        setIsCropModalOpen(false);
                      }}
                      className="col-span-2 py-2.5 text-xs font-black text-[#ba1a1a] hover:bg-red-50 rounded-xl transition-all border border-red-200"
                    >
                      Remove Current Photo
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsCropModalOpen(false);
                      setSrcImage(null);
                    }}
                    className="py-2.5 text-xs font-black border border-[#e4eae4] hover:bg-[#f8faf9] text-[#3d4943] rounded-xl transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={!srcImage}
                    onClick={handleSaveCrop}
                    className="py-2.5 text-xs font-black bg-[#171d1a] hover:bg-black text-white rounded-xl transition-all disabled:opacity-40"
                  >
                    Crop &amp; Apply
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

