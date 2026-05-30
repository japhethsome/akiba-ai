/**
 * Akiba AI - Superadmin Bootstrap Script
 * Run with: node scripts/create-superadmin.mjs
 *
 * This creates a system-level superadmin account.
 * Only run this once to initialize the admin.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

async function main() {
  console.log("\n====================================================");
  console.log("       AKIBA AI — Superadmin Account Setup");
  console.log("====================================================\n");

  const existing = await prisma.superAdmin.findFirst();
  if (existing) {
    console.log("A superadmin account already exists:");
    console.log(`  Name:  ${existing.name}`);
    console.log(`  Email: ${existing.email}`);
    console.log(`  Active: ${existing.is_active}`);

    const overwrite = await ask("\nDo you want to create an ADDITIONAL admin? (yes/no): ");
    if (overwrite.trim().toLowerCase() !== "yes") {
      console.log("\nExiting. No changes made.\n");
      rl.close();
      await prisma.$disconnect();
      return;
    }
  }

  console.log("Please provide the superadmin account details:\n");
  const name     = await ask("Full Name:  ");
  const email    = await ask("Email:      ");
  const password = await ask("Password:   ");
  const notes    = await ask("Notes (optional, press Enter to skip): ");

  if (!name || !email || !password) {
    console.log("\nAll fields (name, email, password) are required. Aborting.\n");
    rl.close();
    await prisma.$disconnect();
    return;
  }

  if (password.length < 8) {
    console.log("\nPassword must be at least 8 characters. Aborting.\n");
    rl.close();
    await prisma.$disconnect();
    return;
  }

  const existing_email = await prisma.superAdmin.findUnique({ where: { email } });
  if (existing_email) {
    console.log(`\nAn admin with email "${email}" already exists. Aborting.\n`);
    rl.close();
    await prisma.$disconnect();
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const admin = await prisma.superAdmin.create({
    data: {
      name:          name.trim(),
      email:         email.trim().toLowerCase(),
      password_hash,
      notes:         notes.trim() || null,
      is_active:     true,
    },
  });

  console.log("\n====================================================");
  console.log("  Superadmin account created successfully!");
  console.log("====================================================");
  console.log(`  ID:    ${admin.id}`);
  console.log(`  Name:  ${admin.name}`);
  console.log(`  Email: ${admin.email}`);
  console.log(`\n  Login at: /auth  then navigate to /admin`);
  console.log("====================================================\n");

  rl.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
