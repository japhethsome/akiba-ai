"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { createStaffDirectly, removeStaff, updateStaffPermissions } from "@/lib/actions/staff";
import { ALL_PERMISSIONS, PERMISSION_LABELS, getRolePermissions } from "@/lib/permissions";

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
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["pos", "inventory_view", "transactions"]);
  const [error, setError] = useState("");

  // Edit Permissions States
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [isEditPending, setIsEditPending] = useState(false);
  const [editError, setEditError] = useState("");

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
              setSelectedPermissions(["pos", "inventory_view", "transactions"]);
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
          <h3 className="font-black text-[#166534] mb-1 text-sm">Granular Access Control</h3>
          <p className="text-xs text-[#166534] font-medium leading-relaxed">
            <strong>Owners</strong> have full access to all features. For **attendants/clerks**, you can customize exactly which features they are allowed to access (e.g., POS only, Inventory edit access, Reports, etc.).
          </p>
        </div>
      </div>

      {/* Mobile: Card List */}
      <div className="md:hidden space-y-3">
        {staff.map((s) => {
          const perms = getRolePermissions(s.role);
          const isStaffOwner = s.role === "owner";

          return (
            <div key={s.id} className="bg-white border border-[#e4eae4] rounded-[20px] p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-[#171d1a] text-white flex items-center justify-center font-black text-base uppercase shrink-0">
                {s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-[#171d1a] text-sm truncate">{s.name}</div>
                <div className="text-[11px] text-[#bccac1] font-medium truncate">{s.email}</div>
                <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${isStaffOwner ? "bg-[#171d1a] text-white" : "bg-[#f5fbf5] text-[#00694c] border border-[#e4eae4]"}`}>
                    {isStaffOwner ? "owner" : "clerk"}
                  </span>
                  {isStaffOwner ? (
                    <span className="text-[10px] font-bold text-[#6d7a73]">Full Access</span>
                  ) : (
                    perms.map(p => (
                      <span key={p} className="px-1.5 py-0.5 rounded text-[8px] font-black bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]" title={PERMISSION_LABELS[p]?.description}>
                        {PERMISSION_LABELS[p]?.label || p}
                      </span>
                    ))
                  )}
                  {perms.length === 0 && !isStaffOwner && (
                    <span className="text-[9px] text-rose-500 font-bold">No Access</span>
                  )}
                </div>
              </div>
              {!isStaffOwner && userRole === "owner" && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingStaff(s);
                      setEditPermissions(getRolePermissions(s.role));
                      setIsEditModalOpen(true);
                    }}
                    className="text-[#00694c] hover:text-[#00553e] transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit_square</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to remove ${s.name}?`)) {
                        const res = await removeStaff(s.id);
                        if (res.success) {
                          setStaff(prev => prev.filter(m => m.id !== s.id));
                        } else {
                          alert(res.error || "Failed to remove staff member");
                        }
                      }
                    }}
                    className="text-[#bccac1] hover:text-[#e11d48] transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">person_remove</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block bg-white border border-[#e4eae4] rounded-[24px] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8faf9] border-b border-[#e4eae4]">
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Name / Email</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Role</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Access / Permissions</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73]">Status</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[#6d7a73] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const perms = getRolePermissions(s.role);
              const isStaffOwner = s.role === "owner";

              return (
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
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isStaffOwner ? "bg-[#171d1a] text-white" : "bg-[#f5fbf5] text-[#00694c] border border-[#e4eae4]"}`}>
                      {isStaffOwner ? "owner" : "clerk"}
                    </span>
                  </td>
                  <td className="p-4">
                    {isStaffOwner ? (
                      <span className="text-xs font-bold text-[#6d7a73]">Full Access</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-w-lg">
                        {perms.map(p => (
                          <span key={p} className="text-[9px] font-black px-2 py-0.5 rounded bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]" title={PERMISSION_LABELS[p]?.description}>
                            {PERMISSION_LABELS[p]?.label || p}
                          </span>
                        ))}
                        {perms.length === 0 && (
                          <span className="text-[10px] text-rose-500 font-bold">No Access Allowed</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
                      Active
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {isStaffOwner ? (
                      <span className="text-xs text-[#bccac1] font-bold">—</span>
                    ) : userRole === "owner" ? (
                      <div className="inline-flex items-center gap-3">
                        <button
                          onClick={() => {
                            setEditingStaff(s);
                            setEditPermissions(getRolePermissions(s.role));
                            setIsEditModalOpen(true);
                          }}
                          className="text-[#00694c] hover:text-[#00553e] font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          Edit Perms
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to remove ${s.name} from staff?`)) {
                              const res = await removeStaff(s.id);
                              if (res.success) {
                                setStaff(prev => prev.filter(m => m.id !== s.id));
                              } else {
                                alert(res.error || "Failed to remove staff member");
                              }
                            }
                          }}
                          className="text-rose-600 hover:text-rose-855 font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">person_remove</span>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#bccac1] font-bold">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
        {staff.length <= 1 && (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-[48px] text-[#bccac1] mb-4">group_add</span>
            <h3 className="font-black text-[#171d1a] mb-1">No clerks yet</h3>
            <p className="text-sm text-[#6d7a73] font-medium mb-6">Use the "Add Attendant" button to register your first staff member.</p>
            {userRole === "owner" && (
              <button
                onClick={() => { setFormData({ name: "", email: "", phone: "", password: "" }); setSelectedPermissions(["pos", "inventory_view", "transactions"]); setError(""); setIsInviteModalOpen(true); }}
                className="bg-[#f8faf9] hover:bg-[#e4eae4] border border-[#e4eae4] text-[#171d1a] px-6 py-3 rounded-xl font-black text-sm transition-colors"
              >
                Add Your First Clerk
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile empty state */}
      {staff.length <= 1 && (
        <div className="md:hidden p-8 flex flex-col items-center justify-center text-center bg-white border border-[#e4eae4] rounded-[20px]">
          <span className="material-symbols-outlined text-[40px] text-[#bccac1] mb-3">group_add</span>
          <h3 className="font-black text-[#171d1a] mb-1 text-base">No clerks yet</h3>
          <p className="text-sm text-[#6d7a73] font-medium mb-5">Use "Add Attendant" to register your first staff member.</p>
          {userRole === "owner" && (
            <button
              onClick={() => { setFormData({ name: "", email: "", phone: "", password: "" }); setSelectedPermissions(["pos", "inventory_view", "transactions"]); setError(""); setIsInviteModalOpen(true); }}
              className="bg-[#f8faf9] hover:bg-[#e4eae4] border border-[#e4eae4] text-[#171d1a] px-5 py-2.5 rounded-xl font-black text-sm transition-colors"
            >
              Add Your First Clerk
            </button>
          )}
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
              className="bg-white rounded-[32px] p-6 w-full max-w-md relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-black text-[#171d1a]">Add Attendant</h2>
                <button onClick={() => setIsInviteModalOpen(false)} className="text-[#bccac1] hover:text-[#e11d48] transition-colors p-1">
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>
              <p className="text-[#6d7a73] text-sm mb-4 font-medium">
                Register a new attendant account instantly. They can immediately log in with their email and password.
              </p>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-1.5">Attendant's Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Kamau"
                    className="w-full h-11 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 0712345678"
                    className="w-full h-11 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. john@store.com"
                    className="w-full h-11 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-1.5">Create Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-11 px-4 bg-[#f8faf9] border border-[#e4eae4] rounded-xl text-sm font-bold outline-none focus:border-[#00694c] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-1.5">Assign Access Permissions</label>
                  <div className="space-y-1.5 bg-[#f8faf9] border border-[#e4eae4] p-3 rounded-xl max-h-40 overflow-y-auto">
                    {ALL_PERMISSIONS.map((perm) => (
                      <label key={perm} className="flex items-start gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...selectedPermissions, perm]);
                            } else {
                              setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
                            }
                          }}
                          className="w-4 h-4 rounded border-[#e4eae4] text-[#00694c] focus:ring-[#00694c] mt-0.5 shrink-0"
                        />
                        <div>
                          <div className="text-xs font-black text-[#171d1a]">{PERMISSION_LABELS[perm].label}</div>
                          <div className="text-[9px] text-[#6d7a73] font-medium leading-none mt-0.5">{PERMISSION_LABELS[perm].description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  disabled={isPending || !formData.name || !formData.email || !formData.password}
                  onClick={async () => {
                    setIsPending(true);
                    setError("");
                    const customRole = `clerk:${selectedPermissions.join(",")}`;
                    const res = await createStaffDirectly({
                      name: formData.name,
                      email: formData.email,
                      phone: formData.phone,
                      password_plain: formData.password,
                      role: customRole
                    });
                    setIsPending(false);
                    if (res.success && res.staff) {
                      setStaff(prev => [
                        {
                          id: res.staff!.id,
                          name: formData.name,
                          email: formData.email,
                          phone: formData.phone,
                          role: res.staff!.role,
                          createdAt: res.staff!.createdAt
                        },
                        ...prev
                      ]);
                      setIsInviteModalOpen(false);
                    } else {
                      setError(res.error || "Failed to create clerk account.");
                    }
                  }}
                  className="w-full h-12 mt-2 bg-[#00694c] hover:bg-[#00553e] disabled:opacity-50 text-white rounded-2xl font-black text-sm transition-colors shadow-lg shadow-[#00694c]/20 flex items-center justify-center gap-2"
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

      {/* Edit Permissions Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-[#171d1a]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-black text-[#171d1a]">Edit Permissions</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-[#bccac1] hover:text-[#e11d48] transition-colors p-1">
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              </div>
              <p className="text-[#6d7a73] text-sm mb-6 font-medium">
                Configure feature-level permissions for <span className="font-bold text-[#171d1a]">{editingStaff.name}</span>.
              </p>

              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold mb-4">
                  {editError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#6d7a73] mb-2">Features Access Permissions</label>
                  <div className="space-y-2 bg-[#f8faf9] border border-[#e4eae4] p-3 rounded-xl max-h-60 overflow-y-auto">
                    {ALL_PERMISSIONS.map((perm) => (
                      <label key={perm} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={editPermissions.includes(perm)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditPermissions([...editPermissions, perm]);
                            } else {
                              setEditPermissions(editPermissions.filter(p => p !== perm));
                            }
                          }}
                          className="w-4 h-4 rounded border-[#e4eae4] text-[#00694c] focus:ring-[#00694c] mt-0.5 shrink-0"
                        />
                        <div>
                          <div className="text-xs font-black text-[#171d1a]">{PERMISSION_LABELS[perm].label}</div>
                          <div className="text-[10px] text-[#6d7a73] font-medium mt-0.5">{PERMISSION_LABELS[perm].description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  disabled={isEditPending}
                  onClick={async () => {
                    setIsEditPending(true);
                    setEditError("");
                    const newRole = `clerk:${editPermissions.join(",")}`;
                    const res = await updateStaffPermissions(editingStaff.id, newRole);
                    setIsEditPending(false);
                    if (res.success && res.staff) {
                      setStaff(prev => prev.map(m => m.id === editingStaff.id ? { ...m, role: res.staff!.role } : m));
                      setIsEditModalOpen(false);
                    } else {
                      setEditError(res.error || "Failed to update permissions.");
                    }
                  }}
                  className="w-full h-14 mt-4 bg-[#00694c] hover:bg-[#00553e] disabled:opacity-50 text-white rounded-2xl font-black text-sm transition-colors shadow-lg shadow-[#00694c]/20 flex items-center justify-center gap-2"
                >
                  {isEditPending ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      Save Permissions
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
