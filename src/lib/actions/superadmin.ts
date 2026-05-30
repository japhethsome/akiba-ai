"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";

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

  const [totalStores, totalUsers, totalTransactions, totalProducts] = await Promise.all([
    prisma.store.count(),
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.product.count(),
  ]);

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

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { user_id: userId },
    data: { password_hash: hashed },
  });

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
