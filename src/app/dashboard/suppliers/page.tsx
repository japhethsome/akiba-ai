import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import prisma from "@/lib/prisma";
import { SuppliersClientUI } from "./SuppliersClientUI";

export default async function SuppliersPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true },
  });

  if (!user || !user.store.onboarded) redirect("/dashboard/onboarding");

  const suppliers = await prisma.supplier.findMany({
    where: { store_id: user.store_id },
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: "asc" },
  });

  return (
    <DashboardLayoutWrapper>
      <SuppliersClientUI initialSuppliers={suppliers} userRole={user.role} />
    </DashboardLayoutWrapper>
  );
}
