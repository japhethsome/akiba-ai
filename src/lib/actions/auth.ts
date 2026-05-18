"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/session";

export async function registerOwner(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const storeName = formData.get("storeName") as string;

  if (!name || !email || !phone || !password || !storeName) {
    return { error: "All fields are required" };
  }

  try {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return { error: "This email address is already registered. Please log in or use a different email." };
    }

    // Check if phone number already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      return { error: "This phone number is already registered. Please use a different phone number." };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Store and User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newStore = await tx.store.create({
        data: {
          name: storeName,
        },
      });

      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password_hash: hashedPassword,
          role: "owner",
          store_id: newStore.id,
        },
      });

      return { user: newUser, store: newStore };
    });

    await setSession(result.user.user_id, result.user.role, result.store.id);

    return { success: true, user: result.user };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { success: false, error: error.message };
  }
}

export async function registerAttendant(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const inviteToken = formData.get("inviteToken") as string;

    if (!inviteToken) throw new Error("Missing invitation token.");

    const invitation = await prisma.invitation.findUnique({
      where: { token: inviteToken },
    });

    if (!invitation || invitation.used || invitation.expires_at < new Date()) {
      throw new Error("Invalid or expired invitation.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password_hash: hashedPassword,
        role: "attendant",
        store_id: invitation.store_id,
      },
    });

    // Mark invitation as used
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { used: true },
    });

    const token = await signToken({ userId: user.user_id, role: user.role });
    (await cookies()).set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: true },
    });

    if (!user) {
      return { error: "No account found with this email address. Please register first." };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return { error: "Incorrect password. Please try again." };
    }

    await setSession(user.user_id, user.role, user.store_id);

    return { 
      success: true, 
      user: { 
        id: user.user_id, 
        name: user.name, 
        role: user.role, 
        store: user.store?.name || "My Store" 
      } 
    };
  } catch (error: any) {
    console.error("Login error details:", error);
    return { error: error.message || "An unexpected error occurred during login" };
  }
}

export async function logout() {
  const { cookies } = await import("next/headers");
  (await cookies()).delete("session");
  const { redirect } = await import("next/navigation");
  redirect("/");
}
