import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

/**
 * POST /api/ai/po-save
 * Logs a sent Purchase Order to the SystemLog table for audit trail.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { poNumber, supplierName, supplierContact, grandTotal, itemCount, itemsSummary, notes, channel } = body;

    const store = await prisma.store.findFirst({
      where: { users: { some: { user_id: session.userId } } },
      select: { id: true },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const logContent = JSON.stringify({
      poNumber,
      supplierName,
      supplierContact,
      grandTotal,
      itemCount,
      itemsSummary,
      notes: notes || "",
      channel: channel || "WhatsApp",
      sentAt: new Date().toISOString(),
      sentBy: session.userId,
    });

    await prisma.systemLog.create({
      data: {
        store_id: store.id,
        type: "PURCHASE_ORDER_SENT",
        content: logContent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PO Save Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to log purchase order." },
      { status: 500 }
    );
  }
}
