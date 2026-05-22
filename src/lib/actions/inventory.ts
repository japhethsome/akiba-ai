"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/permissions";

export async function addProduct(data: {
  name: string;
  category: string;
  sellingPrice: number;
  buyingPrice: number;
  stock: number;
  reorderLevel: number;
  vatRate?: number;
  supplierId?: string;
}) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
      include: { store: true },
    });

    if (!user || !hasPermission(user.role, "inventory_edit")) throw new Error("Unauthorized");

    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        category: data.category,
        selling_price: data.sellingPrice,
        buying_price: data.buyingPrice,
        stock_quantity: data.stock,
        reorder_level: data.reorderLevel,
        vat_rate: data.vatRate !== undefined ? data.vatRate : 16,
        supplier_id: data.supplierId || null,
        store_id: user.store_id,
      },
    });

    // Log the creation
    await prisma.inventoryLog.create({
      data: {
        product_id: newProduct.product_id,
        user_id: user.user_id,
        store_id: user.store_id,
        change_type: "addition",
        quantity_changed: data.stock,
        reason: "Initial stock addition",
      },
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to add product:", error);
    return { error: error.message || "Failed to add product" };
  }
}

export async function restockProduct(productId: string, additionalStock: number) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
      include: { store: true },
    });

    if (!user || !hasPermission(user.role, "inventory_edit")) throw new Error("Unauthorized");

    const product = await prisma.product.findUnique({
      where: { product_id: productId },
    });

    if (!product || product.store_id !== user.store_id) {
      throw new Error("Product not found or unauthorized");
    }

    await prisma.product.update({
      where: { product_id: productId },
      data: {
        stock_quantity: { increment: additionalStock },
      },
    });

    // Log the restock
    await prisma.inventoryLog.create({
      data: {
        product_id: productId,
        user_id: user.user_id,
        store_id: user.store_id,
        change_type: "restock",
        quantity_changed: additionalStock,
        reason: "Quick restock via dashboard",
      },
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to restock product:", error);
    return { error: error.message || "Failed to restock product" };
  }
}

export async function updateProduct(
  productId: string, 
  data: {
    name: string;
    category: string;
    sellingPrice: number;
    buyingPrice: number;
    stock: number;
    reorderLevel: number;
    vatRate?: number;
    supplierId?: string;
  }
) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
      include: { store: true },
    });

    if (!user || !hasPermission(user.role, "inventory_edit")) {
      throw new Error("Unauthorized: You do not have permissions to edit products");
    }

    await prisma.product.update({
      where: { 
        product_id: productId,
        store_id: user.store_id // Ensure they own it
      },
      data: {
        name: data.name,
        category: data.category,
        selling_price: data.sellingPrice,
        buying_price: data.buyingPrice,
        stock_quantity: data.stock,
        reorder_level: data.reorderLevel,
        vat_rate: data.vatRate !== undefined ? data.vatRate : 16,
        supplier_id: data.supplierId || null,
      },
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/pos");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update product:", error);
    return { error: error.message || "Failed to update product" };
  }
}
