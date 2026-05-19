import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import Link from "next/link";

export default async function ForecastsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");
  if (session.role === "clerk") redirect("/dashboard/pos"); // RBAC protection

  return (
    <DashboardLayoutWrapper>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-[#584fbc] to-[#3a3385] rounded-full flex items-center justify-center mb-6 shadow-xl shadow-[#584fbc]/20">
          <span className="material-symbols-outlined text-[48px] text-white">query_stats</span>
        </div>
        <h1 className="text-3xl font-black text-[#171d1a] mb-2">AI Inventory Forecaster</h1>
        <p className="text-[#6d7a73] font-medium max-w-md mb-8">
          The Akiba AI intelligence layer is currently training on your initial inventory and sales velocity data. Predictive ordering will unlock shortly.
        </p>
        <Link href="/dashboard">
          <button className="bg-[#171d1a] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-colors">
            Return to Dashboard
          </button>
        </Link>
      </div>
    </DashboardLayoutWrapper>
  );
}
