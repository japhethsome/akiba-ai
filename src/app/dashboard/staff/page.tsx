import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import { StaffClientUI } from "./StaffClientUI";
import { hasPermission } from "@/lib/permissions";

import prisma from "@/lib/prisma";

export default async function StaffPage() {
  const session = await getSession();
  if (!session) redirect("/auth");
  if (!hasPermission(session.role, "staff")) redirect("/dashboard/pos");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true },
  });

  if (!user) redirect("/auth");

  const staffList = await prisma.user.findMany({
    where: { store_id: user.store_id },
    orderBy: { created_at: 'desc' },
  });

  const plainStaffList = staffList.map((s) => ({
    id: s.user_id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    role: s.role,
    createdAt: s.created_at.toISOString(),
  }));

  return (
    <DashboardLayoutWrapper>
      <StaffClientUI userRole={session.role} initialStaff={plainStaffList} />
    </DashboardLayoutWrapper>
  );
}
