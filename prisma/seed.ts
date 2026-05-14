const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.transaction.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.store.deleteMany({});

  // Create a Store
  const store = await prisma.store.create({
    data: {
      name: "Akiba SME Sample Shop",
      onboarded: true,
    },
  });

  const hashedDefaultPassword = await bcrypt.hash('password123', 10);

  // Create an Owner
  const owner = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "owner@akiba.ai",
      phone: "0712345678",
      password_hash: hashedDefaultPassword,
      role: "owner",
      store_id: store.id,
    },
  });

  // Create a Clerk
  const clerk = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "clerk@akiba.ai",
      phone: "0787654321",
      password_hash: hashedDefaultPassword,
      role: "attendant",
      store_id: store.id,
    },
  });

  // Create Products
  await prisma.product.createMany({
    data: [
      { name: "Sugar (1kg)", category: "Groceries", unit_price: 150, stock_quantity: 45, reorder_level: 20, store_id: store.id },
      { name: "Cooking Oil (3L)", category: "Groceries", unit_price: 850, stock_quantity: 8, reorder_level: 10, store_id: store.id },
      { name: "Unga wa Dola (2kg)", category: "Groceries", unit_price: 180, stock_quantity: 120, reorder_level: 50, store_id: store.id },
      { name: "Blue Band (450g)", category: "Groceries", unit_price: 320, stock_quantity: 15, reorder_level: 15, store_id: store.id },
      { name: "Bar Soap (800g)", category: "Groceries", unit_price: 110, stock_quantity: 5, reorder_level: 20, store_id: store.id },
    ],
  });

  console.log("Seed data created successfully!");
  console.log("---------------------------");
  console.log("Owner Login: owner@akiba.ai / password123");
  console.log("Clerk Login: clerk@akiba.ai / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
