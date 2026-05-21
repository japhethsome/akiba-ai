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

  if (!user) redirect("/auth");
  if (user.role === "owner" && !user.store.onboarded) redirect("/dashboard/onboarding");

  const { hasPermission } = require("@/lib/permissions");
  if (!hasPermission(user.role, "suppliers")) {
    redirect("/dashboard/pos");
  }

  const suppliers = await prisma.supplier.findMany({
    where: { store_id: user.store_id },
    include: {
      products: {
        select: {
          product_id: true,
          name: true,
          stock_quantity: true,
          reorder_level: true,
          buying_price: true,
          selling_price: true,
          category: true,
        },
      },
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Serialize Decimal fields so they can be passed to client
  const plainSuppliers = suppliers.map((s) => ({
    ...s,
    products: s.products.map((p) => ({
      ...p,
      buying_price: Number(p.buying_price),
      selling_price: Number(p.selling_price),
    })),
  }));

  return (
    <DashboardLayoutWrapper>
      <SuppliersClientUI
        initialSuppliers={plainSuppliers}
        userRole={user.role}
        storeName={user.store.name}
      />
    </DashboardLayoutWrapper>
  );
}
