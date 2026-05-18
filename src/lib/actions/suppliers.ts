"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function addSupplier(data: {
  name: string;
  contact: string;
  location: string;
  leadTimeDays: number;
}) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
      include: { store: true },
    });

    if (!user || user.role !== "owner") throw new Error("Unauthorized");

    await prisma.supplier.create({
      data: {
        name: data.name,
        contact: data.contact,
        location: data.location,
        lead_time_days: data.leadTimeDays,
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
