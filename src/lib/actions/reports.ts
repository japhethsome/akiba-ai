"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Prisma } from "@prisma/client";

export async function getDailyPLReport(dateStr: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
      include: { store: true },
    });

    if (!user) return { success: false, error: "User not found" };
    const storeId = user.store_id;

    // Parse date
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        store_id: storeId,
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: "VOIDED",
        },
      },
      include: {
        product: true,
        user: true,
      },
    });

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
      where: {
        store_id: storeId,
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Calculations
    const totalSales = transactions.reduce((sum, t) => sum + Number(t.total_price), 0);
    const totalProfit = transactions.reduce((sum, t) => sum + Number(t.total_profit), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalTransactions = transactions.length;
    const netPL = totalSales - totalExpenses; // Cash Net P&L (Total sales cash flow minus total cash out expenses)
    const netProfitMargin = totalProfit - totalExpenses; // Profit Net P&L (Gross margins minus operating expenses)

    // Breakdown items sold
    const itemsSoldMap = new Map<string, { name: string; quantity: number; revenue: number; vat: number }>();
    for (const t of transactions) {
      const prodName = t.product.name;
      const qty = t.quantity;
      const price = Number(t.total_price);
      const vat = Number(t.vat_amount || 0);

      const existing = itemsSoldMap.get(t.product_id);
      if (existing) {
        existing.quantity += qty;
        existing.revenue += price;
        existing.vat += vat;
      } else {
        itemsSoldMap.set(t.product_id, {
          name: prodName,
          quantity: qty,
          revenue: price,
          vat: vat,
        });
      }
    }

    const itemsSoldBreakdown = Array.from(itemsSoldMap.values()).map(item => ({
      name: item.name,
      quantity: item.quantity,
      revenue: item.revenue,
      vat: item.vat,
    }));

    return {
      success: true,
      data: {
        date: dateStr,
        storeName: user.store.name,
        stats: {
          totalSales,
          totalProfit,
          totalExpenses,
          totalTransactions,
          netPL,
          netProfitMargin,
        },
        expenses: expenses.map(e => ({
          id: e.id,
          amount: Number(e.amount),
          reason: e.reason,
          created_at: e.created_at.toISOString(),
        })),
        itemsSold: itemsSoldBreakdown,
      },
    };
  } catch (error: any) {
    console.error("Failed to load daily P&L report:", error);
    return { success: false, error: error.message || "Failed to load report" };
  }
}


export async function sendReportEmail(recipientEmail: string, subject: string, reportHtml: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "RESEND_API_KEY is not configured in your .env file.",
      fallback: true
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Akiba AI Reports <reports@resend.dev>",
        to: recipientEmail,
        subject: subject,
        html: reportHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Resend API error:", errorData);
      return {
        success: false,
        error: errorData.message || "Failed to send email via Resend.",
        fallback: true
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message || "An unexpected error occurred", fallback: true };
  }
}

