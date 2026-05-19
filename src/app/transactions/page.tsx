import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import { getTransactionsData } from "@/lib/actions/transactions";
import { getForecastData } from "@/lib/actions/forecasts";
import { TransactionsClientUI } from "./TransactionsClientUI";
import prisma from "@/lib/prisma";

export default async function TransactionsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
  });

  if (!user) redirect("/auth");

  // Clerks get sent directly to POS
  if (user.role === "clerk") {
    redirect("/dashboard/pos");
  }

  // Load transactions ledger and stats
  const ledgerResult = await getTransactionsData();
  if (!ledgerResult.success || !ledgerResult.data) {
    return (
      <DashboardLayoutWrapper>
        <div className="p-10 text-center flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined text-[48px] text-[#ba1a1a] mb-4">error</span>
          <p className="text-[#ba1a1a] font-bold">Failed to load transactions: {ledgerResult.error}</p>
        </div>
      </DashboardLayoutWrapper>
    );
  }

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

  return (
    <DashboardLayoutWrapper>
      <TransactionsClientUI
        initialTransactions={ledgerResult.data.transactions}
        stats={ledgerResult.data.stats}
        forecastData={forecastData}
      />
    </DashboardLayoutWrapper>
  );
}
