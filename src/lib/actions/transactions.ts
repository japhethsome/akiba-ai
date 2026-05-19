"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function voidTransaction(transactionId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
    });

    if (!user || user.role !== "owner") {
      throw new Error("Only the store owner can void or refund transactions.");
    }

    const transaction = await prisma.transaction.findUnique({
      where: { transaction_id: transactionId },
      include: { product: true },
    });

    if (!transaction || transaction.store_id !== user.store_id) {
      throw new Error("Transaction not found.");
    }

    if (transaction.status === "VOIDED") {
      throw new Error("This transaction has already been voided.");
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.product.update({
        where: { product_id: transaction.product_id },
        data: { stock_quantity: { increment: transaction.quantity } },
      });

      await tx.inventoryLog.create({
        data: {
          product_id: transaction.product_id,
          user_id: user.user_id,
          store_id: user.store_id,
          change_type: "REFUNDED_STOCK",
          quantity_changed: transaction.quantity,
          reason: `Refund / void for receipt ${transaction.receipt_id || transaction.transaction_id}`,
        },
      });

      await tx.transaction.update({
        where: { transaction_id: transaction.transaction_id },
        data: {
          status: "VOIDED",
          voided_at: new Date(),
        },
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/pos");

    return { success: true };
  } catch (error) {
    console.error("Failed to void transaction:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to void transaction." };
  }
}
