import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import { hasPermission } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { PosClientUI } from "./PosClientUI";

export default async function PosPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true },
  });

  if (!user) redirect("/auth");
  if (user.role === "owner" && !user.store.onboarded) redirect("/dashboard/onboarding");

  if (!hasPermission(user.role, "pos")) {
    if (hasPermission(user.role, "inventory_view")) {
      redirect("/dashboard/inventory");
    } else if (hasPermission(user.role, "transactions")) {
      redirect("/transactions");
    } else if (hasPermission(user.role, "suppliers")) {
      redirect("/dashboard/suppliers");
    } else if (hasPermission(user.role, "staff")) {
      redirect("/dashboard/staff");
    } else if (hasPermission(user.role, "reports")) {
      redirect("/reports");
    } else {
      redirect("/auth");
    }
  }

  const products = await prisma.product.findMany({
    where: { store_id: user.store_id },
    orderBy: { name: "asc" },
  });

  const plainProducts = products.map((p: any) => ({
    id: p.product_id,
    name: p.name,
    category: p.category,
    price: Number(p.selling_price),
    stock: p.stock_quantity,
    reorderLevel: p.reorder_level,
  }));

  return (
    <DashboardLayoutWrapper>
      <PosClientUI 
        initialProducts={plainProducts} 
        currentUser={{ name: user.name, role: user.role }} 
      />
    </DashboardLayoutWrapper>
  );
}
