"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getSettingsData() {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
      include: { store: true },
    });

    if (!user) return { success: false, error: "User not found" };

    return {
      success: true,
      data: {
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        userRole: user.role,
        storeName: user.store.name,
        storeCategory: user.store.category,
      },
    };
  } catch (error: any) {
    console.error("Failed to load settings data:", error);
    return { success: false, error: error.message || "Failed to load settings" };
  }
}

export async function updateSettings(data: {
  userName: string;
  storeName: string;
  storeCategory: string;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
    });

    if (!user) return { success: false, error: "User not found" };
    if (user.role !== "owner") {
      return { success: false, error: "Only store owners can update settings." };
    }

    await prisma.$transaction(async (tx) => {
      // Update user name
      await tx.user.update({
        where: { user_id: user.user_id },
        data: { name: data.userName },
      });

      // Update store details
      await tx.store.update({
        where: { id: user.store_id },
        data: {
          name: data.storeName,
          category: data.storeCategory,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update settings:", error);
    return { success: false, error: error.message || "Failed to save settings" };
  }
}
