import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Mulai melakukan seeding data...');

  // 1. Seed User Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.users.upsert({
    where: { email: 'admin@wms.com' },
    update: {},
    create: {
      name: 'Admin WMS',
      email: 'admin@wms.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // 2. Seed 3 Kategori (Elektronik, Furniture, ATK)
  const catElektronik = await prisma.categories.upsert({
    where: { name: 'Elektronik' },
    update: {},
    create: {
      name: 'Elektronik',
      description: 'Peralatan dan perangkat elektronik',
    },
  });

  const catFurniture = await prisma.categories.upsert({
    where: { name: 'Furniture' },
    update: {},
    create: {
      name: 'Furniture',
      description: 'Perabotan kantor dan ruangan',
    },
  });

  const catATK = await prisma.categories.upsert({
    where: { name: 'ATK' },
    update: {},
    create: {
      name: 'ATK',
      description: 'Alat tulis kantor',
    },
  });

  // 3. Seed 3 Lokasi (Rak A1, Rak A2, Gudang B1)
  const locA1 = await prisma.locations.upsert({
    where: { name: 'Rak A1' },
    update: {},
    create: {
      name: 'Rak A1',
      code: 'RAK-A1',
    },
  });

  const locA2 = await prisma.locations.upsert({
    where: { name: 'Rak A2' },
    update: {},
    create: {
      name: 'Rak A2',
      code: 'RAK-A2',
    },
  });

  const locB1 = await prisma.locations.upsert({
    where: { name: 'Gudang B1' },
    update: {},
    create: {
      name: 'Gudang B1',
      code: 'GDG-B1',
    },
  });

  // 4. Seed 5 Produk Contoh dengan relasi Kategori dan Lokasi
  const productsData = [
    {
      sku: 'PRD-ELEK-001',
      name: 'Laptop Asus ROG',
      description: 'Laptop gaming performa tinggi',
      stock: 10,
      minimumStock: 2,
      categoryId: catElektronik.id,
      locationId: locA1.id,
    },
    {
      sku: 'PRD-ELEK-002',
      name: 'Monitor Samsung 24 inch',
      description: 'Monitor LED full HD',
      stock: 15,
      minimumStock: 3,
      categoryId: catElektronik.id,
      locationId: locA1.id,
    },
    {
      sku: 'PRD-FURN-001',
      name: 'Kursi Kantor Ergonomis',
      description: 'Kursi kerja jaring hidrolik',
      stock: 8,
      minimumStock: 2,
      categoryId: catFurniture.id,
      locationId: locB1.id,
    },
    {
      sku: 'PRD-FURN-002',
      name: 'Meja Kerja Kayu',
      description: 'Meja kerja minimalis 120x60 cm',
      stock: 5,
      minimumStock: 1,
      categoryId: catFurniture.id,
      locationId: locB1.id,
    },
    {
      sku: 'PRD-ATK-001',
      name: 'Kertas A4 80gr',
      description: 'Kertas HVS A4 1 Rim',
      stock: 50,
      minimumStock: 10,
      categoryId: catATK.id,
      locationId: locA2.id,
    },
  ];

  const products = [];
  for (const prod of productsData) {
    const product = await prisma.products.upsert({
      where: { sku: prod.sku },
      update: {},
      create: prod,
    });
    products.push(product);
  }

  console.log('✅ Seeding selesai! Data yang berhasil dibuat/dipastikan ada:');
  console.log({
    admin: admin.email,
    categories: [catElektronik.name, catFurniture.name, catATK.name],
    locations: [locA1.code, locA2.code, locB1.code],
    productsCount: products.length,
  });
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
