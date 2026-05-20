"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { createStaffDirectly } from "@/lib/actions/staff";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export function StaffClientUI({ userRole, initialStaff = [] }: { userRole: string; initialStaff?: StaffMember[] }) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  
  // Registration Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [error, setError] = useState("");

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto space-y-5 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#171d1a]">Staff Management</h1>
          <p className="text-[#6d7a73] font-medium mt-1 text-sm">Manage your team and control access permissions.</p>
        </div>
        {userRole === "owner" && (
          <button
            onClick={() => {
              setFormData({ name: "", email: "", phone: "", password: "" });
              setError("");
              setIsInviteModalOpen(true);
            }}
            className="w-full sm:w-auto bg-[#171d1a] hover:bg-black text-white px-5 py-3 rounded-2xl font-black text-sm shadow-xl transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Add Attendant
          </button>
        )}
      </div>

      {/* Staff Access Summary Banner */}
      <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[20px] p-4 sm:p-5 flex gap-3">
        <span className="material-symbols-outlined text-[#00694c] text-[24px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
        <div>
          <h3 className="font-black text-[#166534] mb-1 text-sm">Role-Based Access Control</h3>
          <p className="text-xs text-[#166534] font-medium leading-relaxed">
            <strong>Owners</strong> have full access to all tabs including Reports and financial KPIs.{" "}
            <strong>Clerks</strong> are restricted to <strong>POS</strong> and <strong>Inventory</strong> view only.
          </p>
        </div>
      </div>

      {/* Mobile: Card List */}
      <div className="md:hidden space-y-3">
        {staff.map((s) => (
          <div key={s.id} className="bg-white border border-[#e4eae4] rounded-[20px] p-4 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-full bg-[#171d1a] text-white flex items-center justify-center font-black text-base uppercase shrink-0">
              {s.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-[#171d1a] text-sm truncate">{s.name}</div>
              <div className="text-[11px] text-[#bccac1] font-medium truncate">{s.email}</div>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${s.role === "owner" ? "bg-[#171d1a] text-white" : "bg-[#f5fbf5] text-[#00694c] border border-[#e4eae4]"}`}>
                  {s.role}
                </span>
                <span className="text-[10px] font-bold text-[#6d7a73]">
                  {s.role === "owner" ? "Full Access" : "POS + Stock"}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>Active
                </span>
              </div>
            </div>
            {s.role !== "owner" && (
              <button className="text-[#bccac1] hover:text-[#e11d48] transition-colors shrink-0 p-1">
                <span className="material-symbols-outlined text-[20px]">person_remove</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block bg-white border border-[#e4eae4] rounded-[24px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8faf9] border-b border-[#e4eae4]">
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Name / Email</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Role</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Access</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Status</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-[#e4eae4] hover:bg-[#f5fbf5] transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#171d1a] text-white flex items-center justify-center font-black text-sm uppercase">
                      {s.name[0]}
                    </div>
                    <div>
                      <div className="font-black text-[#171d1a]">{s.name}</div>
                      <div className="text-[10px] font-bold text-[#bccac1] mt-0.5">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${s.role === "owner" ? "bg-[#171d1a] text-white" : "bg-[#f5fbf5] text-[#00694c] border border-[#e4eae4]"}`}>
                    {s.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-xs font-bold text-[#6d7a73]">
                    {s.role === "owner" ? "Full Access" : "POS + Inventory View"}
                  </span>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
                    Active
                  </span>
                </td>
                <td className="p-4 text-right text-[#bccac1] text-xs font-bold">
                  {s.role === "owner" ? "—" : "Remove"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {staff.length <= 1 && (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-[48px] text-[#bccac1] mb-4">group_add</span>
            <h3 className="font-black text-[#171d1a] mb-1">No clerks yet</h3>
            <p className="text-sm text-[#6d7a73] font-medium mb-6">Use the "Add Attendant" button to register your first staff member.</p>
            <button
              onClick={() => { setFormData({ name: "", email: "", phone: "", password: "" }); setError(""); setIsInviteModalOpen(true); }}
              className="bg-[#f8faf9] hover:bg-[#e4eae4] border border-[#e4eae4] text-[#171d1a] px-6 py-3 rounded-xl font-black text-sm transition-colors"
            >
              Add Your First Clerk
            </button>
          </div>
        )}
      </div>

      {/* Mobile empty state */}
      {staff.length <= 1 && (
        <div className="md:hidden p-8 flex flex-col items-center justify-center text-center bg-white border border-[#e4eae4] rounded-[20px]">
          <span className="material-symbols-outlined text-[40px] text-[#bccac1] mb-3">group_add</span>
          <h3 className="font-black text-[#171d1a] mb-1 text-base">No clerks yet</h3>
          <p className="text-sm text-[#6d7a73] font-medium mb-5">Use "Add Attendant" to register your first staff member.</p>
          <button
            onClick={() => { setFormData({ name: "", email: "", phone: "", password: "" }); setError(""); setIsInviteModalOpen(true); }}
            className="bg-[#f8faf9] hover:bg-[#e4eae4] border border-[#e4eae4] text-[#171d1a] px-5 py-2.5 rounded-xl font-black text-sm transition-colors"
          >
            Add Your First Clerk
          </button>
        </div>
      )}

      {/* Direct Add Clerk Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-black text-[#171d1a]">Add Attendant</h2>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-[#bccac1] hover:text-[#e11d48] transition-colors p-1">
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>
              <p className="text-[#6d7a73] text-sm mb-6 font-medium">
                Register a new attendant account instantly in-person. They can immediately log in with their email and password.
              </p>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Attendant's Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Kamau"
                    className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 0712345678"
                    className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. john@store.com"
                    className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Create Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-12 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                  />
                </div>

                <button
                  disabled={isPending || !formData.name || !formData.email || !formData.password}
                  onClick={async () => {
                    setIsPending(true);
                    setError("");
                    const res = await createStaffDirectly({
                      name: formData.name,
                      email: formData.email,
                      phone: formData.phone,
                      password_plain: formData.password
                    });
                    setIsPending(false);
                    if (res.success) {
                      setStaff(prev => [
                        {
                          id: Math.random().toString(),
                          name: formData.name,
                          email: formData.email,
                          phone: formData.phone,
                          role: "clerk",
                          createdAt: new Date().toISOString()
                        },
                        ...prev
                      ]);
                      setIsInviteModalOpen(false);
                    } else {
                      setError(res.error || "Failed to create clerk account.");
                    }
                  }}
                  className="w-full h-14 mt-4 bg-[#00694c] hover:bg-[#00553e] disabled:opacity-50 text-white rounded-2xl font-black text-sm transition-colors shadow-lg shadow-[#00694c]/20 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                      Complete Setup
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
