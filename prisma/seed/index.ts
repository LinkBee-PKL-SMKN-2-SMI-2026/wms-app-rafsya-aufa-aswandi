import { PrismaClient } from '../../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Tambahkan logic seed jika diperlukan
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
