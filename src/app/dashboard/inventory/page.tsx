import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { InventoryClient } from "./InventoryClient";
import { DashboardLayoutWrapper } from "@/components/ui/DashboardLayoutWrapper";
import prisma from "@/lib/prisma";

export default async function InventoryPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true },
  });

  if (!user) redirect("/auth");

  const { hasPermission } = require("@/lib/permissions");
  if (!hasPermission(session.role, "inventory_view")) {
    redirect("/dashboard/pos");
  }

  // Owner must complete onboarding first
  if (user.role === "owner" && !user.store.onboarded) {
    redirect("/dashboard/onboarding");
  }

  // Fetch real products from the database with supplier relation
  const products = await prisma.product.findMany({
    where: { store_id: user.store_id },
    orderBy: { created_at: 'desc' },
    include: { supplier: true },
  });

  // Fetch suppliers for the dropdown
  const suppliers = await prisma.supplier.findMany({
    where: { store_id: user.store_id },
    orderBy: { name: 'asc' },
  });

  const plainProducts = products.map(p => ({
    id: p.product_id,
    name: p.name,
    category: p.category,
    price: Number(p.selling_price),
    buyingPrice: Number(p.buying_price),
    stock: p.stock_quantity,
    reorderLevel: p.reorder_level,
    lastUpdated: p.created_at.toISOString(),
    supplierId: p.supplier_id,
    supplierName: p.supplier?.name || null,
    supplierCompanyName: p.supplier?.company_name || null,
    supplierContact: p.supplier?.contact || null,
    supplierWhatsapp: p.supplier?.whatsapp_number || null,
    supplierEmail: p.supplier?.email || null,
    supplierLocation: p.supplier?.location || null,
    supplierLeadTime: p.supplier?.lead_time_days ?? null,
    supplierPaymentTerms: p.supplier?.payment_terms || null,
  }));

  return (
    <DashboardLayoutWrapper>
      <InventoryClient
        userRole={session.role}
        initialProducts={plainProducts}
        suppliers={suppliers}
        storeName={user.store.name}
      />
    </DashboardLayoutWrapper>
  );
}
