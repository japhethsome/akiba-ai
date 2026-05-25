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
      const vat = 0;

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
        from: "Akiba AI Reports <onboarding@resend.dev>",
        to: recipientEmail,
        subject: subject,
        html: reportHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Resend API error:", errorData);

      const isSandboxError = errorData.message?.toLowerCase().includes("sandbox") || 
                             errorData.message?.toLowerCase().includes("restricted") ||
                             errorData.message?.toLowerCase().includes("can only send");

      if (isSandboxError) {
        const user = await prisma.user.findUnique({
          where: { user_id: session.userId },
          include: { store: { include: { users: { where: { role: "owner" } } } } },
        });
        const storeOwner = user?.store?.users[0];
        const ownerEmail = storeOwner?.email || user?.email || "akibaai.eh@gmail.com";

        if (recipientEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
          console.log(`Sandbox mode detected. Redirecting report email from ${recipientEmail} to owner email ${ownerEmail}`);

          const sandboxWarning = `
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 16px; margin-bottom: 24px; border-radius: 12px; font-family: sans-serif; font-size: 13px; line-height: 1.5;">
              <strong style="font-size: 14px; display: block; margin-bottom: 4px;">⚠️ Resend Sandbox Mode Notice</strong>
              This EOD Sales & P&L Statement was originally sent to <strong>${recipientEmail}</strong>. 
              Since your Resend API key is in <strong>Sandbox Mode</strong>, emails can only be sent to the verified owner's email address. 
              We have automatically redirected it to you at <strong>${ownerEmail}</strong> so you can inspect the output.
            </div>
          `;
          const updatedHtml = sandboxWarning + reportHtml;

          const retryRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Akiba AI Reports <onboarding@resend.dev>",
              to: ownerEmail,
              subject: `[Redirected] ${subject}`,
              html: updatedHtml,
            }),
          });

          if (retryRes.ok) {
            return { 
              success: true, 
              redirected: true, 
              redirectedTo: ownerEmail 
            };
          } else {
            const retryErr = await retryRes.json().catch(() => ({}));
            console.error("Resend API retry error:", retryErr);
            
            // If the retry also fails because the store owner email is not verified,
            // attempt a final retry to the primary verified email (akibaai.eh@gmail.com)
            const fallbackSenderEmail = "akibaai.eh@gmail.com";
            if (ownerEmail.toLowerCase() !== fallbackSenderEmail.toLowerCase()) {
              console.log(`Retrying final fallback to verified sandbox account email: ${fallbackSenderEmail}`);
              const finalNotice = `
                <div style="background-color: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 16px; margin-bottom: 24px; border-radius: 12px; font-family: sans-serif; font-size: 13px; line-height: 1.5;">
                  <strong style="font-size: 14px; display: block; margin-bottom: 4px;">⚠️ Sandbox Redirection Fallback</strong>
                  This report was originally addressed to <strong>${recipientEmail}</strong> and failed dynamic redirect to owner <strong>${ownerEmail}</strong>. 
                  We routed it to the primary verified sandbox email <strong>${fallbackSenderEmail}</strong>.
                </div>
              `;
              const finalRes = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "Akiba AI Reports <onboarding@resend.dev>",
                  to: fallbackSenderEmail,
                  subject: `[Redirected Fallback] ${subject}`,
                  html: finalNotice + reportHtml,
                }),
              });

              if (finalRes.ok) {
                return { 
                  success: true, 
                  redirected: true, 
                  redirectedTo: fallbackSenderEmail 
                };
              }
            }
          }
        }
      }

      return {
        success: false,
        error: errorData.message || "Failed to send email via Resend.",
        fallback: false
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message || "An unexpected error occurred", fallback: true };
  }
}

