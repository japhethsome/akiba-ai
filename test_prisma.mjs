import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: { name: 'Test Store' }
      });
      console.log('Store:', store);

      const user = await tx.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password_hash: 'hash',
          role: 'owner',
          store_id: store.id
        }
      });
      console.log('User:', user);
    });
  } catch (e) {
    console.error('Full Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
