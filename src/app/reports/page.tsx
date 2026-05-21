import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import Link from "next/link";

import { hasPermission } from "@/lib/permissions";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");
  if (!hasPermission(session?.role, "reports")) redirect("/dashboard/pos"); // RBAC protection

  return (
    <DashboardLayoutWrapper>
      <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-[#f8faf9] border border-[#e4eae4] rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[48px] text-[#bccac1]">bar_chart</span>
        </div>
        <h1 className="text-3xl font-black text-[#171d1a] mb-2">Financial Reports</h1>
        <p className="text-[#6d7a73] font-medium max-w-md mb-8">
          Akiba AI is analyzing your historical data. Detailed P&L statements, tax summaries, and staff performance metrics are unlocking soon.
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
