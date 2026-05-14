import React from "react";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import { DashboardClientUI } from "./DashboardClientUI";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

const kpis = [
  { label: "Total Inventory", value: "248", icon: "inventory_2", color: "#00694c", bg: "#f0fdf4" },
  { label: "Low Stock Alerts", value: "12", icon: "warning", color: "#ba1a1a", bg: "#fff1f2" },
  { label: "Today's Revenue", value: "KES 18.4k", icon: "payments", color: "#171d1a", bg: "#f3f4f6" },
  { label: "AI Prediction", value: "Steady Growth", icon: "auto_awesome", color: "#584fbc", bg: "#f5f3ff" },
];

export default async function DashboardPage() {
  const session = await getSession();
  let userName = "User";

  if (session) {
    const user = await prisma.user.findUnique({
      where: { user_id: session.userId }
    });
    if (user) userName = user.name;
  }

  return (
    <DashboardLayoutWrapper>
        <main className="flex-1 p-10 max-w-[1500px] mx-auto w-full">
            <DashboardClientUI userName={userName} kpis={kpis} />
        </main>
    </DashboardLayoutWrapper>
  );
}
