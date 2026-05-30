"use client";

import React, { useState } from "react";
import Image from "next/image";
import { adminResetUserPassword, adminDeleteStore, updateSuperAdminPassword } from "@/lib/actions/superadmin";
import { logout } from "@/lib/actions/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Overview {
  totalStores: number;
  totalUsers: number;
  totalTransactions: number;
  totalProducts: number;
}

interface StoreUser {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  last_login: string | null;
}

interface Store {
  id: string;
  name: string;
  category: string | null;
  storeAddress: string | null;
  storePhone: string | null;
  storeEmail: string | null;
  createdAt: string;
  onboarded: boolean;
  users: StoreUser[];
  _count: { products: number; transactions: number };
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  store: { id: string; name: string; phone: string | null; email: string | null; address: string | null } | null;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  notes: string | null;
}

interface Props {
  overview: Overview;
  stores: Store[];
  users: User[];
  profile: Profile;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function roleColor(role: string) {
  if (role === "owner") return "bg-[#171d1a] text-white";
  if (role.startsWith("clerk")) return "bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]";
  return "bg-[#f8faf9] text-[#6d7a73] border border-[#e4eae4]";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SuperAdminClient({ overview, stores, users, profile }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "stores" | "users" | "account">("overview");

  // Reset password state
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetPending, setResetPending] = useState(false);

  // Change own password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwPending, setPwPending] = useState(false);

  // Search
  const [userSearch, setUserSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch)
  );

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      (s.storeEmail || "").toLowerCase().includes(storeSearch.toLowerCase())
  );

  const tabs: { key: typeof activeTab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "dashboard" },
    { key: "stores", label: "Stores", icon: "store" },
    { key: "users", label: "Users", icon: "group" },
    { key: "account", label: "My Account", icon: "manage_accounts" },
  ];

  return (
    <div className="min-h-screen bg-[#f5fbf5] font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#e4eae4] h-[68px] flex items-center px-6 md:px-10 justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <Image src="/main.png" alt="Akiba AI" width={110} height={32} className="object-contain" priority />
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-rose-600 text-white">Superadmin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-[#171d1a] hidden md:block">{profile.name}</span>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 text-xs font-bold text-[#6d7a73] hover:text-rose-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-[#171d1a]">System Administration</h1>
          <p className="text-[#6d7a73] font-medium mt-1 text-sm">Full platform visibility across all stores and users.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white border border-[#e4eae4] rounded-2xl p-1 mb-8 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === t.key
                  ? "bg-[#171d1a] text-white shadow-md"
                  : "text-[#6d7a73] hover:text-[#171d1a] hover:bg-[#f8faf9]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              <span className="hidden sm:block">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Stores", value: overview.totalStores, icon: "store", color: "#00694c" },
                { label: "Total Users", value: overview.totalUsers, icon: "group", color: "#584fbc" },
                { label: "Transactions", value: overview.totalTransactions, icon: "receipt_long", color: "#0284c7" },
                { label: "Products", value: overview.totalProducts, icon: "inventory_2", color: "#d97706" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-[#e4eae4] rounded-[24px] p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + "1a" }}>
                      <span className="material-symbols-outlined text-[20px]" style={{ color: stat.color }}>{stat.icon}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#171d1a]">{stat.value.toLocaleString()}</div>
                  <div className="text-xs font-bold text-[#6d7a73] mt-1 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Recent Stores */}
            <div className="bg-white border border-[#e4eae4] rounded-[24px] p-6 shadow-sm">
              <h2 className="font-black text-[#171d1a] text-lg mb-4">Recent Stores</h2>
              <div className="space-y-3">
                {stores.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3 border-b border-[#f0f4f0] last:border-0">
                    <div>
                      <div className="font-bold text-[#171d1a] text-sm">{s.name}</div>
                      <div className="text-[11px] text-[#bccac1] font-medium">{s.storeEmail || "No email"} · {s.users.length} user{s.users.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#6d7a73]">{s._count.products} products</div>
                      <div className="text-[10px] text-[#bccac1]">{formatDate(s.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STORES TAB ── */}
        {activeTab === "stores" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#bccac1]">search</span>
                <input
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Search stores..."
                  className="w-full pl-9 pr-4 h-11 bg-white border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                />
              </div>
              <span className="text-sm font-bold text-[#6d7a73]">{filteredStores.length} store{filteredStores.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-4">
              {filteredStores.map((store) => (
                <div key={store.id} className="bg-white border border-[#e4eae4] rounded-[24px] overflow-hidden shadow-sm">
                  {/* Store Header */}
                  <div className="p-5 border-b border-[#f0f4f0] flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-[#171d1a] text-base">{store.name}</h3>
                        {store.onboarded && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]">Active</span>
                        )}
                      </div>
                      <div className="text-xs text-[#6d7a73] font-medium space-y-0.5">
                        {store.storeEmail && <div><span className="font-black">Email:</span> {store.storeEmail}</div>}
                        {store.storePhone && <div><span className="font-black">Phone:</span> {store.storePhone}</div>}
                        {store.storeAddress && <div><span className="font-black">Address:</span> {store.storeAddress}</div>}
                        {store.category && <div><span className="font-black">Category:</span> {store.category}</div>}
                        <div><span className="font-black">Registered:</span> {formatDate(store.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex gap-6 text-center shrink-0">
                      <div>
                        <div className="text-2xl font-black text-[#171d1a]">{store._count.products}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#6d7a73]">Products</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-[#171d1a]">{store._count.transactions}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#6d7a73]">Sales</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-[#171d1a]">{store.users.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#6d7a73]">Users</div>
                      </div>
                    </div>
                  </div>

                  {/* Store Users */}
                  <div className="divide-y divide-[#f0f4f0]">
                    {store.users.map((u) => (
                      <div key={u.user_id} className="px-5 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#171d1a] text-white flex items-center justify-center font-black text-sm uppercase shrink-0">
                          {u.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#171d1a] text-sm truncate">{u.name}</div>
                          <div className="text-[11px] text-[#bccac1] font-medium truncate">{u.email} · {u.phone}</div>
                        </div>
                        <div className="text-right shrink-0 hidden md:block">
                          <div className="text-[10px] font-bold text-[#6d7a73]">Last login: {formatDate(u.last_login)}</div>
                          <div className="text-[10px] text-[#bccac1]">Joined: {formatDate(u.created_at)}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shrink-0 ${roleColor(u.role)}`}>
                          {u.role.split(":")[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#bccac1]">search</span>
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="w-full pl-9 pr-4 h-11 bg-white border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                />
              </div>
              <span className="text-sm font-bold text-[#6d7a73]">{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="bg-white border border-[#e4eae4] rounded-[24px] overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8faf9] border-b border-[#e4eae4]">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">User</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Contact</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Store</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Role</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Last Login</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Joined</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-[#e4eae4] hover:bg-[#f5fbf5] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#171d1a] text-white flex items-center justify-center font-black text-sm uppercase shrink-0">
                            {u.name[0]}
                          </div>
                          <div className="font-black text-[#171d1a] text-sm">{u.name}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-bold text-[#171d1a]">{u.email}</div>
                        <div className="text-[10px] text-[#bccac1] font-medium mt-0.5">{u.phone}</div>
                      </td>
                      <td className="p-4">
                        {u.store ? (
                          <div>
                            <div className="text-xs font-bold text-[#171d1a]">{u.store.name}</div>
                            {u.store.phone && <div className="text-[10px] text-[#bccac1] font-medium">{u.store.phone}</div>}
                            {u.store.address && <div className="text-[10px] text-[#bccac1] font-medium">{u.store.address}</div>}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#bccac1]">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${roleColor(u.role)}`}>
                          {u.role.split(":")[0]}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-[#6d7a73]">{formatDate(u.lastLogin)}</td>
                      <td className="p-4 text-xs font-bold text-[#6d7a73]">{formatDate(u.createdAt)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => { setResetTarget(u); setNewPassword(""); setResetMsg(""); }}
                          className="text-[#00694c] hover:text-[#00553e] font-bold text-xs flex items-center gap-1 ml-auto transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">lock_reset</span>
                          Reset PW
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {activeTab === "account" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Profile Card */}
            <div className="bg-white border border-[#e4eae4] rounded-[24px] p-6 shadow-sm">
              <h2 className="font-black text-[#171d1a] text-lg mb-5">Admin Profile</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Full Name", value: profile.name },
                  { label: "Email", value: profile.email },
                  { label: "Account Status", value: profile.is_active ? "Active" : "Deactivated" },
                  { label: "Account Created", value: formatDate(profile.created_at) },
                  { label: "Last Login", value: formatDate(profile.last_login) },
                  { label: "Notes", value: profile.notes || "—" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between border-b border-[#f0f4f0] pb-2 last:border-0">
                    <span className="font-black text-[#6d7a73] text-[11px] uppercase tracking-widest">{item.label}</span>
                    <span className="font-bold text-[#171d1a] text-right max-w-[60%]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white border border-[#e4eae4] rounded-[24px] p-6 shadow-sm">
              <h2 className="font-black text-[#171d1a] text-lg mb-5">Change Password</h2>
              {pwMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold mb-4 ${pwMsg.includes("success") || pwMsg.includes("updated") ? "bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                  {pwMsg}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-1.5">Current Password</label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full h-11 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                  />
                </div>
                <button
                  disabled={pwPending || !currentPw || !newPw}
                  onClick={async () => {
                    setPwPending(true); setPwMsg("");
                    const res = await updateSuperAdminPassword(currentPw, newPw);
                    setPwPending(false);
                    setPwMsg(res.success ? "Password updated successfully." : res.error || "Failed to update password.");
                    if (res.success) { setCurrentPw(""); setNewPw(""); }
                  }}
                  className="w-full h-11 bg-[#171d1a] hover:bg-black disabled:opacity-50 text-white rounded-xl font-black text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {pwPending ? <span className="material-symbols-outlined animate-spin">refresh</span> : <><span className="material-symbols-outlined text-[18px]">lock</span> Update Password</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── RESET PASSWORD MODAL ── */}
      {resetTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-sm" onClick={() => setResetTarget(null)} />
          <div className="bg-white rounded-[28px] p-6 w-full max-w-sm relative z-10 shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-black text-[#171d1a]">Reset Password</h2>
              <button onClick={() => setResetTarget(null)} className="text-[#bccac1] hover:text-rose-600 transition-colors">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <p className="text-[#6d7a73] text-sm mb-5 font-medium">
              Setting a new password for <span className="font-black text-[#171d1a]">{resetTarget.name}</span> ({resetTarget.email}).
            </p>
            {resetMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold mb-4 ${resetMsg.includes("success") ? "bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                {resetMsg}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full h-11 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                />
              </div>
              <button
                disabled={resetPending || newPassword.length < 6}
                onClick={async () => {
                  setResetPending(true); setResetMsg("");
                  const res = await adminResetUserPassword(resetTarget!.id, newPassword);
                  setResetPending(false);
                  setResetMsg(res.success ? "Password reset successfully." : res.error || "Failed to reset.");
                }}
                className="w-full h-11 bg-[#00694c] hover:bg-[#00553e] disabled:opacity-50 text-white rounded-xl font-black text-sm transition-colors flex items-center justify-center gap-2"
              >
                {resetPending ? <span className="material-symbols-outlined animate-spin">refresh</span> : <><span className="material-symbols-outlined text-[18px]">lock_reset</span> Reset Password</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
