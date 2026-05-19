"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function processCheckout(
  cart: { productId: string, quantity: number }[],
  paymentMethod: "CASH" | "MPESA" = "CASH"
) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
      include: { store: true },
    });

    if (!user) throw new Error("Unauthorized");

    const receiptId = `RCT-${randomUUID().slice(0, 8).toUpperCase()}`;
    const receiptItems: {
      productId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[] = [];
    let receiptTotal = 0;

    // Process all items in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const item of cart) {
        const product = await tx.product.findUnique({
          where: { product_id: item.productId },
        });

        if (!product || product.store_id !== user.store_id) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}`);
        }

        const totalPrice = Number(product.selling_price) * item.quantity;
        const totalCost = Number(product.buying_price) * item.quantity;
        const totalProfit = totalPrice - totalCost;

        // Deduct Stock
        await tx.product.update({
          where: { product_id: product.product_id },
          data: { stock_quantity: { decrement: item.quantity } },
        });

        // Record Transaction
        const transaction = await tx.transaction.create({
          data: {
            product_id: product.product_id,
            user_id: user.user_id,
            store_id: user.store_id,
            receipt_id: receiptId,
            quantity: item.quantity,
            total_price: totalPrice,
            total_profit: totalProfit,
            payment_method: paymentMethod,
            status: "COMPLETED",
            transaction_type: "SALE",
          },
        });

        // Log Inventory Change
        await tx.inventoryLog.create({
          data: {
            product_id: product.product_id,
            user_id: user.user_id,
            store_id: user.store_id,
            change_type: "sale",
            quantity_changed: -item.quantity,
            reason: "POS Checkout",
            transaction_id: transaction.transaction_id,
          },
        });

        receiptItems.push({
          productId: product.product_id,
          name: product.name,
          quantity: item.quantity,
          unitPrice: Number(product.selling_price),
          totalPrice,
        });
        receiptTotal += totalPrice;
      }
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    
    return {
      success: true,
      receipt: {
        id: receiptId,
        storeName: user.store.name,
        paymentMethod,
        servedBy: user.name,
        createdAt: new Date().toISOString(),
        items: receiptItems,
        total: receiptTotal,
      },
    };
  } catch (error) {
    console.error("POS Checkout failed:", error);
    return { error: error instanceof Error ? error.message : "Failed to process checkout" };
  }
}
