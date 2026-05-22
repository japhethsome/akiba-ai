import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import { hasPermission } from "@/lib/permissions";
import { getSettingsData } from "@/lib/actions/settings";
import { ReportsClientUI } from "./ReportsClientUI";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");
  if (!hasPermission(session?.role, "reports")) redirect("/dashboard/pos"); // RBAC protection

  const settingsResult = await getSettingsData();

  if (!settingsResult.success || !settingsResult.data) {
    return (
      <DashboardLayoutWrapper>
        <div className="p-10 text-center flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined text-[48px] text-[#ba1a1a] mb-4">error</span>
          <p className="text-[#ba1a1a] font-bold">Failed to load store settings: {settingsResult.error}</p>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper>
      <ReportsClientUI initialSettings={settingsResult.data as any} />
    </DashboardLayoutWrapper>
  );
}

