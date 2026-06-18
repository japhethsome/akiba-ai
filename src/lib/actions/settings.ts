"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { getSafeErrorMessage } from "@/lib/error";
import bcrypt from "bcryptjs";

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
        avatar: user.avatar,
        userCreatedAt: user.created_at,
        storeName: user.store?.name || "",
        storeCategory: user.store?.category || "",
        storeAddress: user.store?.storeAddress || "",
        storePhone: user.store?.storePhone || "",
        storeEmail: user.store?.storeEmail || "",
        managerPin: user.store?.managerPin || "1234",
        storeDescription: user.store?.description || "",
        regNumber: user.store?.regNumber || "",
        taxPin: user.store?.taxPin || "",
        website: user.store?.website || "",
        city: user.store?.city || "",
        county: user.store?.county || "",
        postalCode: user.store?.postalCode || "",
        receiptFooter: user.store?.receiptFooter || "Thank you for shopping with us.",
        twoFactorEnabled: user.store?.twoFactorEnabled || false,
        theme: user.store?.theme || "light",
        language: user.store?.language || "en",
        currency: user.store?.currency || "KES",
        timezone: user.store?.timezone || "Africa/Nairobi",
        dateFormat: user.store?.dateFormat || "DD/MM/YYYY",
      },
    };
  } catch (error: any) {
    console.error("Failed to load settings data:", error);
    return { success: false, error: getSafeErrorMessage(error, "Failed to load settings. Please try again.") };
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
  managerPin?: string;
  avatar?: string;
  storeDescription?: string;
  regNumber?: string;
  taxPin?: string;
  website?: string;
  city?: string;
  county?: string;
  postalCode?: string;
  receiptFooter?: string;
  twoFactorEnabled?: boolean;
  theme?: string;
  language?: string;
  currency?: string;
  timezone?: string;
  dateFormat?: string;
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
      // Clerks can only update email, phone number, and avatar
      await prisma.user.update({
        where: { user_id: user.user_id },
        data: {
          email: data.userEmail,
          phone: data.userPhone,
          avatar: data.avatar,
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
            avatar: data.avatar,
          },
        });

        // Update store details
        await tx.store.update({
          where: { id: user.store_id! },
          data: {
            name: data.storeName,
            category: data.storeCategory,
            storeAddress: data.storeAddress,
            storePhone: data.storePhone,
            storeEmail: data.storeEmail,
            managerPin: data.managerPin || "1234",
            description: data.storeDescription,
            regNumber: data.regNumber,
            taxPin: data.taxPin,
            website: data.website,
            city: data.city,
            county: data.county,
            postalCode: data.postalCode,
            receiptFooter: data.receiptFooter,
            twoFactorEnabled: data.twoFactorEnabled,
            theme: data.theme,
            language: data.language,
            currency: data.currency,
            timezone: data.timezone,
            dateFormat: data.dateFormat,
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
    return { success: false, error: getSafeErrorMessage(error, "Failed to save settings. Please try again.") };
  }
}

export async function changeUserPassword(data: {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
    });

    if (!user) return { success: false, error: "User not found" };

    if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
      return { success: false, error: "All password fields are required." };
    }

    if (data.newPassword !== data.confirmPassword) {
      return { success: false, error: "New password and confirmation password do not match." };
    }

    if (data.newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    const passwordMatch = await bcrypt.compare(data.currentPassword, user.password_hash);
    if (!passwordMatch) {
      return { success: false, error: "Current password is incorrect." };
    }

    const hashed = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { password_hash: hashed },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to change password:", error);
    return { success: false, error: getSafeErrorMessage(error, "Failed to change password. Please try again.") };
  }
}
