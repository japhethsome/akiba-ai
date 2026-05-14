"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { inviteStaff } from "@/lib/actions/staff";

export function StaffManagementClient({ staff, pendingInvites, storeId }: any) {
   const [inviteMethod, setInviteMethod] = useState<"email" | "phone">("phone");
   const [inviteValue, setInviteValue] = useState("");
   const [loading, setLoading] = useState(false);
   const [message, setMessage] = useState("");

   const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setMessage("");
      try {
         const res = await inviteStaff(storeId, inviteMethod, inviteValue);
         if (res.success) {
            setMessage("Invitation sent successfully! The link is: " + res.inviteLink);
            setInviteValue("");
         } else {
            setMessage("Error: " + res.error);
         }
      } catch (err) {
         setMessage("An error occurred.");
      }
      setLoading(false);
   };

   return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
            {/* Active Staff */}
            <div className="bg-white rounded-[32px] p-8 border border-[#e4eae4] shadow-sm">
               <h3 className="text-xl font-black text-[#171d1a] mb-6">Active Attendants</h3>
               {staff.length === 0 ? (
                  <div className="text-center py-10 bg-[#f8faf9] rounded-2xl border border-[#e4eae4] border-dashed">
                     <p className="text-[#6d7a73] font-medium">You haven't added any attendants yet.</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {staff.map((s: any) => (
                        <div key={s.user_id} className="flex items-center justify-between p-4 bg-[#f8faf9] rounded-2xl border border-[#e4eae4]">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#00694c] text-white flex items-center justify-center font-bold uppercase shadow-sm">
                                 {s.name.charAt(0)}
                              </div>
                              <div>
                                 <p className="font-bold text-[#171d1a] text-sm">{s.name}</p>
                                 <p className="text-[11px] font-medium text-[#6d7a73]">{s.phone || s.email}</p>
                              </div>
                           </div>
                           <button className="text-[#ba1a1a] text-xs font-bold px-4 py-2 hover:bg-[#ba1a1a]/10 rounded-xl transition-colors">Revoke Access</button>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
               <div className="bg-white rounded-[32px] p-8 border border-[#e4eae4] shadow-sm">
                  <h3 className="text-xl font-black text-[#171d1a] mb-6">Pending Invitations</h3>
                  <div className="space-y-4">
                     {pendingInvites.map((invite: any) => (
                        <div key={invite.id} className="flex items-center justify-between p-4 bg-[#fff8e1] rounded-2xl border border-[#ffe082]">
                           <div>
                              <p className="font-bold text-[#b45309] text-sm">{invite.phone || invite.email}</p>
                              <p className="text-[11px] font-medium text-[#b45309]/70">Expires: {new Date(invite.expires_at).toLocaleDateString()}</p>
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest bg-[#ffecb3] text-[#b45309] px-3 py-1.5 rounded-lg">Pending</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>

         <div className="lg:col-span-4">
            <div className="bg-gradient-to-br from-[#171d1a] to-[#2c3631] text-white rounded-[32px] p-8 shadow-xl shadow-black/10 sticky top-32">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[24px]">person_add</span>
               </div>
               <h3 className="text-2xl font-black mb-2 tracking-tight">Invite Attendant</h3>
               <p className="text-sm text-[#bccac1] font-medium mb-8">
                  Generate an invite link. They will set up their own password when they join.
               </p>

               <form onSubmit={handleInvite} className="space-y-4">
                  <div className="flex bg-white/10 p-1 rounded-xl">
                     <button type="button" onClick={() => setInviteMethod("phone")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${inviteMethod === 'phone' ? 'bg-white text-[#171d1a] shadow-sm' : 'text-white/70 hover:text-white'}`}>Phone</button>
                     <button type="button" onClick={() => setInviteMethod("email")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${inviteMethod === 'email' ? 'bg-white text-[#171d1a] shadow-sm' : 'text-white/70 hover:text-white'}`}>Email</button>
                  </div>
                  
                  <div>
                     <input 
                        type={inviteMethod === "email" ? "email" : "tel"}
                        value={inviteValue}
                        onChange={e => setInviteValue(e.target.value)}
                        placeholder={inviteMethod === "email" ? "Attendant's Email" : "Attendant's Phone No."}
                        required
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-medium text-white placeholder-white/40 focus:outline-none focus:border-[#00a87a] transition-colors"
                     />
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-[#00a87a] text-[#171d1a] py-3.5 rounded-xl font-black text-sm hover:bg-[#00c995] transition-colors shadow-lg shadow-[#00a87a]/20 disabled:opacity-50">
                     {loading ? "Generating..." : "Generate Invite Link"}
                  </button>

                  {message && (
                     <div className="mt-4 p-4 bg-white/10 rounded-xl border border-[#00a87a]/50 text-xs font-medium text-[#86f8c9] leading-relaxed break-all">
                        {message}
                     </div>
                  )}
               </form>
            </div>
         </div>
      </div>
   );
}
