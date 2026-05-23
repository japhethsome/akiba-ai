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
        storeAddress: user.store.storeAddress,
        storePhone: user.store.storePhone,
        storeEmail: user.store.storeEmail,
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
  userEmail: string;
  userPhone: string;
  storeAddress?: string;
  storePhone?: string;
  storeEmail?: string;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
    });

    if (!user) return { success: false, error: "User not found" };

    // Check for email and phone conflicts first
    if (data.userEmail !== user.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: data.userEmail,
          NOT: { user_id: user.user_id },
        },
      });
      if (existingEmail) {
        return { success: false, error: "Email is already in use by another user." };
      }
    }

    if (data.userPhone !== user.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: data.userPhone,
          NOT: { user_id: user.user_id },
        },
      });
      if (existingPhone) {
        return { success: false, error: "Phone number is already in use by another user." };
      }
    }

    if (user.role !== "owner") {
      // Clerks can only update email and phone number
      await prisma.user.update({
        where: { user_id: user.user_id },
        data: {
          email: data.userEmail,
          phone: data.userPhone,
        },
      });
    } else {
      // Owners can update everything
      if (!data.userName.trim() || !data.storeName.trim() || !data.storeCategory.trim()) {
        return { success: false, error: "Owner name, store name, and store category are required." };
      }

      await prisma.$transaction(async (tx) => {
        // Update user details
        await tx.user.update({
          where: { user_id: user.user_id },
          data: {
            name: data.userName,
            email: data.userEmail,
            phone: data.userPhone,
          },
        });

        // Update store details
        await tx.store.update({
          where: { id: user.store_id },
          data: {
            name: data.storeName,
            category: data.storeCategory,
            storeAddress: data.storeAddress,
            storePhone: data.storePhone,
            storeEmail: data.storeEmail,
          },
        });
      }, {
        maxWait: 10000,
        timeout: 30000,
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update settings:", error);
    return { success: false, error: error.message || "Failed to save settings" };
  }
}
