"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

interface SupplierData {
  name: string;
  companyName?: string;
  contact: string;
  whatsappNumber?: string;
  email?: string;
  location?: string;
  leadTimeDays: number;
  paymentTerms?: string;
  notes?: string;
}

async function getAuthorizedOwner() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true },
  });

  if (!user || user.role !== "owner") throw new Error("Unauthorized");
  return user;
}

export async function addSupplier(data: SupplierData) {
  try {
    const user = await getAuthorizedOwner();

    await prisma.supplier.create({
      data: {
        name: data.name,
        company_name: data.companyName || null,
        contact: data.contact,
        whatsapp_number: data.whatsappNumber || null,
        email: data.email || null,
        location: data.location || null,
        lead_time_days: data.leadTimeDays,
        payment_terms: data.paymentTerms || null,
        notes: data.notes || null,
        store_id: user.store_id,
      },
    });

    revalidatePath("/dashboard/suppliers");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to add supplier:", error);
    return { error: error.message || "Failed to add supplier" };
  }
}

export async function updateSupplier(supplierId: string, data: SupplierData) {
  try {
    const user = await getAuthorizedOwner();

    await prisma.supplier.update({
      where: {
        supplier_id: supplierId,
        store_id: user.store_id,
      },
      data: {
        name: data.name,
        company_name: data.companyName || null,
        contact: data.contact,
        whatsapp_number: data.whatsappNumber || null,
        email: data.email || null,
        location: data.location || null,
        lead_time_days: data.leadTimeDays,
        payment_terms: data.paymentTerms || null,
        notes: data.notes || null,
      },
    });

    revalidatePath("/dashboard/suppliers");
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update supplier:", error);
    return { error: error.message || "Failed to update supplier" };
  }
}

export async function deleteSupplier(supplierId: string) {
  try {
    const user = await getAuthorizedOwner();

    // Check if any products are linked to this supplier
    const linkedProducts = await prisma.product.count({
      where: {
        supplier_id: supplierId,
        store_id: user.store_id,
      },
    });

    if (linkedProducts > 0) {
      return { error: `Cannot delete supplier — ${linkedProducts} product(s) are still linked to this supplier. Please reassign them first.` };
    }

    await prisma.supplier.delete({
      where: {
        supplier_id: supplierId,
        store_id: user.store_id,
      },
    });

    revalidatePath("/dashboard/suppliers");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete supplier:", error);
    return { error: error.message || "Failed to delete supplier" };
  }
}

export async function getSupplierWithProducts(supplierId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
    });
    if (!user) throw new Error("Unauthorized");

    const supplier = await prisma.supplier.findUnique({
      where: { supplier_id: supplierId, store_id: user.store_id },
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
      },
    });

    return { supplier };
  } catch (error: any) {
    return { error: error.message };
  }
}
