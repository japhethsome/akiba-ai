"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export interface OnboardingProduct {
  name: string;
  category: string;
  unit_price: number;
  stock_quantity: number;
  reorder_level: number;
}

export async function completeOnboarding(
  storeCategory: string,
  products: OnboardingProduct[]
) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  // Verify user is owner
  const user = await prisma.user.findUnique({
    where: { user_id: session.userId },
    include: { store: true },
  });

  if (!user || user.role !== "owner") {
    return { success: false, error: "Only store owners can complete onboarding." };
  }

  if (user.store?.onboarded) {
    return { success: false, error: "Store is already onboarded." };
  }

  if (!products || products.length < 1) {
    return { success: false, error: "At least 1 product is required." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Mark store as onboarded with chosen category
      await tx.store.update({
        where: { id: user.store_id! },
        data: {
          category: storeCategory,
          onboarded: true,
        },
      });

      // Bulk-insert the starter products
      await tx.product.createMany({
        data: products.map((p) => ({
          name: p.name,
          category: p.category,
          selling_price: p.unit_price,
          buying_price: Math.floor(p.unit_price * 0.7),
          stock_quantity: p.stock_quantity,
          reorder_level: p.reorder_level,
          store_id: user.store_id!,
        })),
      });

      // Log the onboarding event
      await tx.systemLog.create({
        data: {
          store_id: user.store_id!,
          type: "STORE_ONBOARDED",
          content: `Store "${user.store?.name}" successfully onboarded as "${storeCategory}" with ${products.length} starter product(s).`,
        },
      });
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return { success: false, error: error.message || "Failed to complete onboarding." };
  }
}
