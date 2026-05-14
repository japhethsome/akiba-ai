"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { randomBytes } from "crypto";

export async function inviteStaff(storeId: string, method: "email" | "phone", value: string) {
   try {
      const session = await getSession();
      if (!session) return { success: false, error: "Unauthorized" };

      const user = await prisma.user.findUnique({ where: { user_id: session.userId }});
      if (!user || user.role !== "owner" || user.store_id !== storeId) {
         return { success: false, error: "Forbidden" };
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
         where: { OR: [{ email: value }, { phone: value }] }
      });
      if (existingUser) return { success: false, error: "User with this contact already exists." };

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

      await prisma.invitation.create({
         data: {
            store_id: storeId,
            email: method === "email" ? value : null,
            phone: method === "phone" ? value : null,
            token,
            expires_at: expiresAt,
            role: "attendant"
         }
      });

      // Since we don't have a real email/SMS provider yet, we just generate the link to be copied by the owner
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const inviteLink = `${baseUrl}/auth?invite=${token}`;

      return { success: true, inviteLink };
   } catch (error: any) {
      return { success: false, error: error.message || "Failed to create invitation." };
   }
}
