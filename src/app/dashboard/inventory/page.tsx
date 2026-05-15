import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { InventoryClient } from "./InventoryClient";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";

export default async function InventoryPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth");
  }

  return (
    <DashboardLayoutWrapper>
      <InventoryClient userRole={session.role} />
    </DashboardLayoutWrapper>
  );
}
