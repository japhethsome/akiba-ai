"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getTransactionsData() {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
      include: { store: true },
    });

    if (!user) return { success: false, error: "User not found" };

    const storeId = user.store_id;

    // Fetch transactions with related product and user
    const transactionsList = await prisma.transaction.findMany({
      where: { store_id: storeId },
      orderBy: { created_at: "desc" },
      include: {
        product: true,
        user: true,
      },
      take: 100, // Show last 100 transactions
    });

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransactions = transactionsList.filter(
      (t) => new Date(t.created_at) >= today
    );

    const todaySales = todayTransactions.reduce(
      (sum, t) => sum + Number(t.total_price),
      0
    );

    const todayProfit = todayTransactions.reduce(
      (sum, t) => sum + Number(t.total_profit),
      0
    );

    const mpesaSales = todayTransactions
      .filter((t) => t.transaction_type.includes("MPESA"))
      .reduce((sum, t) => sum + Number(t.total_price), 0);

    const cashSales = todayTransactions
      .filter((t) => t.transaction_type.includes("CASH"))
      .reduce((sum, t) => sum + Number(t.total_price), 0);

    return {
      success: true,
      data: {
        transactions: transactionsList.map((t) => ({
          transaction_id: t.transaction_id,
          product_name: t.product.name,
          product_id: t.product_id,
          clerk_name: t.user.name,
          quantity: t.quantity,
          total_price: Number(t.total_price),
          total_profit: Number(t.total_profit),
          transaction_type: t.transaction_type,
          created_at: t.created_at.toISOString(),
        })),
        stats: {
          todaySales,
          todayProfit,
          mpesaSales,
          cashSales,
          todayCount: todayTransactions.length,
        },
      },
    };
  } catch (error: any) {
    console.error("Failed to load transactions data:", error);
    return { success: false, error: error.message || "Failed to load transactions" };
  }
}

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
    }, {
      maxWait: 10000,
      timeout: 30000,
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
