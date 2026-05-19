"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
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
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
    });

    if (!user) return { success: false, error: "User not found" };

    const transaction = await prisma.transaction.findUnique({
      where: { transaction_id: transactionId },
    });

    if (!transaction || transaction.store_id !== user.store_id) {
      return { success: false, error: "Transaction not found" };
    }

    await prisma.$transaction(async (tx) => {
      // Restore product stock
      await tx.product.update({
        where: { product_id: transaction.product_id },
        data: {
          stock_quantity: { increment: transaction.quantity },
        },
      });

      // Delete the transaction (or mark as voided)
      // For simplicity & accuracy, let's delete the related inventory log first
      await tx.inventoryLog.deleteMany({
        where: { transaction_id: transactionId },
      });

      await tx.transaction.delete({
        where: { transaction_id: transactionId },
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to void transaction:", error);
    return { success: false, error: error.message || "Failed to refund/void transaction" };
  }
}
