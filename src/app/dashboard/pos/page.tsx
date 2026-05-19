import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import prisma from "@/lib/prisma";
import { PosClientUI } from "./PosClientUI";

export default async function PosPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true },
  });

  if (!user || !user.store.onboarded) redirect("/dashboard/onboarding");

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
