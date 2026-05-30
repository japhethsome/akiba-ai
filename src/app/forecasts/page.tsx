import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import { getForecastData } from "@/lib/actions/forecasts";
import { ForecastsClientUI } from "./ForecastsClientUI";
import prisma from "@/lib/prisma";

export default async function ForecastsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");
  
  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true }
  });

  if (!user) redirect("/auth");

  // Protection check using permissions
  const { hasPermission } = require("@/lib/permissions");
  if (!hasPermission(user.role, "reports")) {
    redirect("/dashboard/pos");
  }

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

  // Fallback to empty array if undefined
  const reorderAlerts = forecastResult.reorderAlerts || [];
  const chartDataByProduct = forecastResult.chartDataByProduct || {};
  const clerkTargets = forecastResult.clerkTargets || [];
  const products = forecastResult.products || [];

  return (
    <DashboardLayoutWrapper>
      <ForecastsClientUI
        upcomingEvent={forecastResult.upcomingEvent || "None"}
        eventDescription={forecastResult.eventDescription || ""}
        seasonalFactor={forecastResult.seasonalFactor || 1.0}
        reorderAlerts={reorderAlerts}
        chartDataByProduct={chartDataByProduct}
        clerkTargets={clerkTargets}
        products={products}
        storeName={user.store?.name || ""}
        marketFeed={forecastResult.marketFeed || []}
      />
    </DashboardLayoutWrapper>
  );
}
