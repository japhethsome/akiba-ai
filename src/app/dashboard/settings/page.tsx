import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import { getSettingsData } from "@/lib/actions/settings";
import { SettingsClientUI } from "./SettingsClientUI";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const settingsResult = await getSettingsData();

  if (!settingsResult.success || !settingsResult.data) {
    return (
      <DashboardLayoutWrapper>
        <div className="p-10 text-center flex flex-col items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined text-[48px] text-[#ba1a1a] mb-4">error</span>
          <p className="text-[#ba1a1a] font-bold">Failed to load settings: {settingsResult.error}</p>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper>
      <SettingsClientUI initialData={settingsResult.data as any} />
    </DashboardLayoutWrapper>
  );
}
