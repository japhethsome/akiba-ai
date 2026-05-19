"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { updateSettings } from "@/lib/actions/settings";

interface SettingsClientUIProps {
  initialData: {
    userName: string;
    userEmail: string;
    userPhone: string;
    userRole: string;
    storeName: string;
    storeCategory: string | null;
  };
}

export function SettingsClientUI({ initialData }: SettingsClientUIProps) {
  const [userName, setUserName] = useState(initialData.userName);
  const [storeName, setStoreName] = useState(initialData.storeName);
  const [storeCategory, setStoreCategory] = useState(initialData.storeCategory || "");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!userName.trim() || !storeName.trim() || !storeCategory.trim()) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    const result = await updateSettings({
      userName,
      storeName,
      storeCategory,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      // Auto-hide success after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    }
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

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <span className="text-[11px] font-black text-[#00694c] uppercase tracking-[0.25em] bg-[#f0fdf4] px-4 py-2 rounded-full border border-[#00694c]/10">
          Control Panel
        </span>
        <h1 className="text-4xl font-black text-[#171d1a] tracking-tight mt-3">
          Store &amp; Account Settings
        </h1>
        <p className="text-sm font-medium text-[#6d7a73] mt-2">
          Manage your business details, update your store name, category, and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Profile Card Summary */}
        <div className="md:col-span-4 bg-white border border-[#e4eae4] rounded-[32px] p-6 flex flex-col items-center justify-between text-center h-fit shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00a87a]/5 to-transparent rounded-bl-[100px] pointer-events-none" />
          
          <div className="w-24 h-24 rounded-[32px] bg-[#171d1a] text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-black/10 mb-4 mt-2">
            {userName ? userName.charAt(0).toUpperCase() : "A"}
          </div>

          <div>
            <h2 className="text-xl font-black text-[#171d1a]">{userName}</h2>
            <span className="text-[10px] font-black text-[#00694c] uppercase tracking-wider bg-[#f0fdf4] px-2.5 py-1 rounded-full border border-[#00694c]/10 inline-block mt-1.5">
              {initialData.userRole}
            </span>
          </div>

          <div className="w-full border-t border-[#e4eae4] pt-4 mt-6 space-y-3.5 text-left text-xs font-semibold text-[#6d7a73]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#bccac1]">mail</span>
              <span className="truncate">{initialData.userEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#bccac1]">call</span>
              <span>{initialData.userPhone}</span>
            </div>
          </div>
        </div>

        {/* Settings Forms */}
        <div className="md:col-span-8 bg-white border border-[#e4eae4] rounded-[32px] p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Settings saved successfully!
              </div>
            )}

            <div className="group">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">
                Owner / Manager Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">
                  person
                </span>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  placeholder="Enter manager name"
                  className="w-full h-14 pl-12 pr-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-2xl text-sm font-medium outline-none focus:border-[#00694c] focus:bg-white transition-all focus:shadow-sm"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">
                Store Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">
                  storefront
                </span>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  placeholder="Enter store name"
                  className="w-full h-14 pl-12 pr-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-2xl text-sm font-medium outline-none focus:border-[#00694c] focus:bg-white transition-all focus:shadow-sm"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-[#3d4943] group-focus-within:text-[#00694c] transition-colors">
                Store Category
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#bccac1] group-focus-within:text-[#00694c] transition-colors">
                  category
                </span>
                <select
                  value={storeCategory}
                  onChange={(e) => setStoreCategory(e.target.value)}
                  required
                  className="w-full h-14 pl-12 pr-4 bg-[#f8faf9] border-2 border-[#e4eae4] rounded-2xl text-sm font-medium outline-none focus:border-[#00694c] focus:bg-white transition-all focus:shadow-sm appearance-none"
                >
                  <option value="" disabled>Select business type</option>
                  {businessCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl font-black text-sm text-white bg-[#171d1a] shadow-xl hover:bg-black transition-all disabled:opacity-50 active:scale-[0.98] mt-8"
            >
              {loading ? "Saving Changes..." : "Save Settings"}
              {!loading && <span className="material-symbols-outlined text-[20px]">save</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
