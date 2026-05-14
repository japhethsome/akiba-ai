import React from "react";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StaffManagementClient } from "./StaffManagementClient";

export default async function StaffPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true }
  });

  if (!user || user.role !== "owner") {
    redirect("/dashboard");
  }

  // Fetch current staff
  const staff = await prisma.user.findMany({
    where: { 
      store_id: user.store_id,
      role: "attendant"
    },
    select: { user_id: true, name: true, email: true, phone: true, created_at: true }
  });

  // Fetch pending invitations
  const pendingInvites = await prisma.invitation.findMany({
    where: {
      store_id: user.store_id,
      used: false
    }
  });

  return (
    <DashboardLayoutWrapper>
        <header className="h-[88px] sticky top-0 z-30 px-8 flex items-center justify-between bg-[#f8faf9]/80 backdrop-blur-xl">
            <div className="flex flex-col">
               <h1 className="text-2xl font-black text-[#171d1a] tracking-tight">Staff Management</h1>
               <div className="text-sm font-medium text-[#6d7a73]">Manage your shop attendants</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#171d1a] to-[#3d4943] flex items-center justify-center text-white font-black uppercase shadow-sm">
                {user.name.charAt(0)}
            </div>
        </header>

        <main className="flex-1 p-8 pt-2 max-w-[1000px] mx-auto w-full">
            <StaffManagementClient 
               staff={staff} 
               pendingInvites={pendingInvites} 
               storeId={user.store_id} 
            />
        </main>
    </DashboardLayoutWrapper>
  );
}
