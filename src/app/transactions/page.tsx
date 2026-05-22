import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import { getForecastData } from "@/lib/actions/forecasts";
import { TransactionsClientUI } from "./TransactionsClientUI";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export default async function TransactionsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
  });

  if (!user) redirect("/auth");

  const { hasPermission } = require("@/lib/permissions");
  if (!hasPermission(user.role, "transactions")) {
    redirect("/dashboard/pos");
  }

  const isOwner = user.role === "owner";

  // Build appropriate where query depending on user role
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where: Prisma.TransactionWhereInput = {
    store_id: user.store_id,
    ...(!isOwner
      ? {
          user_id: user.user_id,
          status: { not: "VOIDED" },
          created_at: { gte: today },
        }
      : {}),
  };

  // Fetch transactions list
  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      product: {
        select: {
          name: true,
          vat_rate: true,
          selling_price: true,
        },
      },
      user: { select: { name: true } },
      store: {
        select: {
          name: true,
          kraPin: true,
          storeAddress: true,
          etimsSerial: true,
          storePhone: true,
          storeEmail: true,
          taxComplianceEnabled: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: 300,
  });

  // Calculate statistics
  const completedTransactions = transactions.filter((t) => t.status !== "VOIDED");
  const todayTransactions = completedTransactions.filter((t) => t.created_at >= today);

  const todaySales = todayTransactions.reduce((sum, t) => sum + Number(t.total_price), 0);
  const todayProfit = todayTransactions.reduce((sum, t) => sum + Number(t.total_profit), 0);

  const mpesaSales = todayTransactions
    .filter((t) => t.payment_method === "MPESA")
    .reduce((sum, t) => sum + Number(t.total_price), 0);

  const cashSales = todayTransactions
    .filter((t) => t.payment_method === "CASH")
    .reduce((sum, t) => sum + Number(t.total_price), 0);

  const stats = {
    todaySales,
    todayProfit,
    mpesaSales,
    cashSales,
    todayCount: todayTransactions.length,
  };

  // Load forecasting features data for integration
  const forecastResult = await getForecastData();
  if (!forecastResult.success) {
    return (
      <DashboardLayoutWrapper>
        <div className="p-10 text-center flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined text-[48px] text-[#ba1a1a] mb-4">error</span>
          <p className="text-[#ba1a1a] font-bold">Failed to load forecast data: {forecastResult.error}</p>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  const forecastData = {
    upcomingEvent: forecastResult.upcomingEvent || "None",
    eventDescription: forecastResult.eventDescription || "",
    seasonalFactor: forecastResult.seasonalFactor || 1.0,
    reorderAlerts: forecastResult.reorderAlerts || [],
    chartDataByProduct: forecastResult.chartDataByProduct || {},
    clerkTargets: forecastResult.clerkTargets || [],
    products: forecastResult.products || [],
  };

  // Map to transaction schema expected by client UI component
  const mappedTransactions = transactions.map((t) => ({
    transaction_id: t.transaction_id,
    receipt_id: t.receipt_id,
    product_name: t.product.name,
    product_id: t.product_id,
    clerk_name: t.user.name,
    quantity: t.quantity,
    total_price: Number(t.total_price),
    total_profit: Number(t.total_profit),
    vat_amount: Number(t.vat_amount || 0),
    vat_rate: Number(t.product.vat_rate || 0),
    customer_pin: t.customer_pin,
    transaction_type: t.payment_method, // payment_method maps to transaction_type in TransactionsClientUI
    created_at: t.created_at.toISOString(),
    storeName: t.store.name,
    storeAddress: t.store.storeAddress,
    kraPin: t.store.kraPin,
    etimsSerial: t.store.etimsSerial,
    storePhone: t.store.storePhone,
    storeEmail: t.store.storeEmail,
    taxComplianceEnabled: t.store.taxComplianceEnabled,
  }));

  return (
    <DashboardLayoutWrapper>
      <TransactionsClientUI
        initialTransactions={mappedTransactions}
        stats={stats}
        forecastData={forecastData}
      />
    </DashboardLayoutWrapper>
  );
}
