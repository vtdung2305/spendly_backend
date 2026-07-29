import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_CATEGORIES } from '../src/modules/categories/constants/default-categories.constant';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@spendly.app';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Demo user already seeded, skipping.');
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash('Passw0rd!', 12),
      firstName: 'Minh',
      lastName: 'Nguyễn',
    },
  });

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id })),
  });

  console.log(`Seeded demo user ${email} / password: Passw0rd!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
