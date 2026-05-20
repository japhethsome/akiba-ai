import React from "react";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import { DashboardClientUI } from "./DashboardClientUI";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true },
  });

  if (!user) redirect("/auth");

  // Owner must complete onboarding first
  if (user.role === "owner" && !user.store.onboarded) {
    redirect("/dashboard/onboarding");
  }

  // Clerks get sent directly to POS
  if (user.role === "clerk") {
    redirect("/dashboard/pos");
  }

  // Fetch real metrics
  const products = await prisma.product.findMany({
    where: { store_id: user.store_id },
    orderBy: { created_at: "desc" },
  });

  const totalInventory = products.reduce((acc, p) => acc + p.stock_quantity, 0);
  const lowStockItems = products.filter(p => p.stock_quantity <= p.reorder_level);
  const lowStockCount = lowStockItems.length;

  // Fetch today's transactions for Revenue and Profit
  const transactions = await prisma.transaction.findMany({
    where: { 
      store_id: user.store_id,
      status: { not: "VOIDED" },
      created_at: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  const todaysRevenue = transactions.reduce((sum, t) => sum + Number(t.total_price), 0);
  const todaysProfit = transactions.reduce((sum, t) => sum + Number(t.total_profit), 0);

  const kpis = [
    { label: "Total Stock Items", value: totalInventory.toString(), icon: "inventory_2", color: "#00694c", bg: "#f0fdf4" },
    { label: "Low Stock Alerts", value: lowStockCount.toString(), icon: "warning", color: "#ba1a1a", bg: "#fff1f2" },
    { label: "Today's Revenue", value: `KES ${todaysRevenue.toLocaleString()}`, icon: "payments", color: "#171d1a", bg: "#f3f4f6" },
    { label: "Today's Profit", value: `KES ${todaysProfit.toLocaleString()}`, icon: "trending_up", color: "#584fbc", bg: "#f5f3ff" },
  ];

  const priorityActions = lowStockItems.map(p => ({
    item: p.name,
    status: p.stock_quantity === 0 ? "Out" : "Critical",
    bg: p.stock_quantity === 0 ? "#f3f4f6" : "#fff1f2",
    color: p.stock_quantity === 0 ? "#171d1a" : "#ba1a1a",
    icon: p.stock_quantity === 0 ? "error" : "warning",
  })).slice(0, 4); // Show top 4 priority actions

  return (
    <DashboardLayoutWrapper>
      <main className="flex-1 p-4 md:p-10 max-w-[1500px] mx-auto w-full">
        <DashboardClientUI 
          userName={user.name} 
          storeCategory={user.store.category || "shop"}
          kpis={kpis} 
          lowStockCount={lowStockCount}
          priorityActions={priorityActions}
        />
      </main>
    </DashboardLayoutWrapper>
  );
}
