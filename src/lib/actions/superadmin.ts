"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";

// Guard: Only superadmin can call these actions
async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== "superadmin") {
    throw new Error("Forbidden: Superadmin access required.");
  }
  return session;
}

// ─── Overview ──────────────────────────────────────────────────────────────

export async function getSuperAdminOverview() {
  await requireSuperAdmin();

  const totalStores = await prisma.store.count();
  const totalUsers = await prisma.user.count();
  const totalTransactions = await prisma.transaction.count();
  const totalProducts = await prisma.product.count();

  return { totalStores, totalUsers, totalTransactions, totalProducts };
}

// ─── All Stores ─────────────────────────────────────────────────────────────

export async function getAllStores() {
  await requireSuperAdmin();

  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        select: {
          user_id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          created_at: true,
          last_login: true,
          is_active: true,
        },
      },
      _count: {
        select: { products: true, transactions: true },
      },
    },
  });

  return stores;
}

// ─── All Users ──────────────────────────────────────────────────────────────

export async function getAllUsers() {
  await requireSuperAdmin();

  const users = await prisma.user.findMany({
    orderBy: { created_at: "desc" },
    include: {
      store: {
        select: { id: true, name: true, storePhone: true, storeEmail: true, storeAddress: true },
      },
    },
  });

  return users.map((u) => ({
    id: u.user_id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.is_active,
    createdAt: u.created_at.toISOString(),
    lastLogin: u.last_login?.toISOString() ?? null,
    store: u.store
      ? {
          id: u.store.id,
          name: u.store.name,
          phone: u.store.storePhone,
          email: u.store.storeEmail,
          address: u.store.storeAddress,
        }
      : null,
  }));
}

// ─── Reset User Password ────────────────────────────────────────────────────

export async function adminResetUserPassword(userId: string, newPassword: string) {
  await requireSuperAdmin();

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  const user = await prisma.user.findUnique({
    where: { user_id: userId }
  });

  if (!user) {
    return { success: false, error: "User not found." };
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { user_id: userId },
    data: { password_hash: hashed },
  });

  // Send email notification
  try {
    await sendEmail({
      to: [user.email, "akibaai.eh@gmail.com"],
      subject: `[Akiba Yangu] Password Reset Notification`,
      html: `
        <h3>Akiba Yangu Security Notification</h3>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>A request to reset your password was approved by the System Administrator.</p>
        <p>Your password/PIN has been successfully updated to: <strong>${newPassword}</strong></p>
        <p>For security reasons, please log in and change your password immediately.</p>
        <br/>
        <p>This notification is also sent to the official Akiba archive: <em>akibaai.eh@gmail.com</em></p>
      `,
      fromName: "Akiba Yangu",
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }

  return { success: true };
}

// ─── Deactivate (delete) a store ────────────────────────────────────────────

export async function adminDeleteStore(storeId: string) {
  await requireSuperAdmin();

  await prisma.store.delete({ where: { id: storeId } });
  return { success: true };
}

// ─── Superadmin profile ──────────────────────────────────────────────────────

export async function getSuperAdminProfile() {
  const session = await requireSuperAdmin();

  const admin = await prisma.superAdmin.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      created_at: true,
      last_login: true,
      is_active: true,
      notes: true,
    },
  });

  return admin;
}

// ─── Update own superadmin password ─────────────────────────────────────────

export async function updateSuperAdminPassword(currentPassword: string, newPassword: string) {
  const session = await requireSuperAdmin();

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters." };
  }

  const admin = await prisma.superAdmin.findUnique({ where: { id: session.userId } });
  if (!admin) return { success: false, error: "Admin account not found." };

  const match = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!match) return { success: false, error: "Current password is incorrect." };

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.superAdmin.update({ where: { id: admin.id }, data: { password_hash: hashed } });

  return { success: true };
}

// ─── Toggle User Lock Status ────────────────────────────────────────────────
export async function adminToggleUserStatus(userId: string) {
  await requireSuperAdmin();

  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { is_active: true }
  });

  if (!user) {
    return { success: false, error: "User not found." };
  }

  await prisma.user.update({
    where: { user_id: userId },
    data: { is_active: !user.is_active }
  });

  return { success: true };
}

// ─── Delete User ────────────────────────────────────────────────────────────
export async function adminDeleteUser(userId: string) {
  await requireSuperAdmin();

  await prisma.user.delete({
    where: { user_id: userId }
  });

  return { success: true };
}

// ─── Create User Directly ───────────────────────────────────────────────────
export async function adminCreateUser(formData: FormData) {
  await requireSuperAdmin();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const storeId = formData.get("storeId") as string;
  const newStoreName = formData.get("newStoreName") as string;

  let targetStoreId = storeId;

  if (storeId === "NEW_STORE") {
    if (!newStoreName || newStoreName.trim() === "") {
      return { success: false, error: "New store name is required." };
    }
  }

  if (!name || !email || !phone || !password || !role || !targetStoreId) {
    return { success: false, error: "All fields are required." };
  }

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { success: false, error: "Email already registered." };
  }

  // Check if phone already exists
  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    return { success: false, error: "Phone number already registered." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await prisma.$transaction(async (tx) => {
      if (storeId === "NEW_STORE") {
        const newStore = await tx.store.create({
          data: {
            name: newStoreName.trim(),
          }
        });
        targetStoreId = newStore.id;
      }

      return await tx.user.create({
        data: {
          name,
          email,
          phone,
          password_hash: hashedPassword,
          role,
          store_id: targetStoreId,
          is_active: true
        }
      });
    });

    return { success: true, userId: newUser.user_id };
  } catch (err: any) {
    console.error("Failed to create user/store:", err);
    return { success: false, error: err.message || "Failed to create user and store." };
  }
}
