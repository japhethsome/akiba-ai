"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerOwner(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const storeName = formData.get("storeName") as string;

  if (!name || !email || !password || !storeName) {
    return { error: "All fields are required" };
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
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
          password_hash: hashedPassword,
          role: "owner",
          store_id: newStore.id,
        },
      });

      return { user: newUser, store: newStore };
    });

    return { success: true, user: result.user };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Something went wrong during registration" };
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
      return { error: "Invalid email or password" };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return { error: "Invalid email or password" };
    }

    // In a real app, you'd set a cookie/session here
    return { success: true, user: { id: user.user_id, name: user.name, role: user.role, store: user.store.name } };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Something went wrong during login" };
  }
}
