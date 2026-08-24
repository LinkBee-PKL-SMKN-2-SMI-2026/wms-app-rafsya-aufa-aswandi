import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const { name, sku, description, stock, minimumStock, categoryId, locationId } = req.body;

  const existingSku = await prisma.products.findUnique({ where: { sku } });
  if (existingSku) {
    throw new AppError('SKU produk sudah digunakan', 400);
  }

  const category = await prisma.categories.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }

  const location = await prisma.locations.findUnique({ where: { id: locationId } });
  if (!location) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  const product = await prisma.products.create({
    data: {
      name,
      sku,
      description,
      stock,
      minimumStock,
      categoryId,
      locationId,
    },
    include: {
      category: true,
      location: true,
    },
  });

  logger.info(
    { event: 'PRODUCT_CREATED', productId: product.id },
    `Produk dibuat: ${product.name}`,
  );

  res.status(201).json({
    success: true,
    message: 'Produk berhasil dibuat',
    data: product,
  });
});

export const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.max(1, parseInt(String(req.query.limit || '10'), 10));
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const sort = req.query.sort === 'asc' ? ('asc' as const) : ('desc' as const);
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
  const locationId = typeof req.query.locationId === 'string' ? req.query.locationId : undefined;
  const skip = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { sku: { contains: search, mode: 'insensitive' as const } },
    ];
  }
  if (categoryId) {
    whereClause.categoryId = categoryId;
  }
  if (locationId) {
    whereClause.locationId = locationId;
  }

  const [total, products] = await Promise.all([
    prisma.products.count({ where: whereClause }),
    prisma.products.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: sort },
      include: {
        category: true,
        location: true,
      },
    }),
  ]);

  res.json({
    success: true,
    message: 'Berhasil mengambil daftar produk',
    data: products,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getProductById = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const product = await prisma.products.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
    },
  });

  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  res.json({
    success: true,
    message: 'Data produk berhasil diambil',
    data: product,
  });
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, sku, description, minimumStock, isActive, categoryId, locationId } = req.body;

  const product = await prisma.products.findUnique({ where: { id } });
  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  if (sku && sku !== product.sku) {
    const duplicateSku = await prisma.products.findUnique({ where: { sku } });
    if (duplicateSku) {
      throw new AppError('SKU sudah digunakan oleh produk lain', 400);
    }
  }

  if (categoryId) {
    const categoryExists = await prisma.categories.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      throw new AppError('Kategori tidak ditemukan', 404);
    }
  }

  if (locationId) {
    const locationExists = await prisma.locations.findUnique({ where: { id: locationId } });
    if (!locationExists) {
      throw new AppError('Lokasi tidak ditemukan', 404);
    }
  }

  const updated = await prisma.products.update({
    where: { id },
    data: {
      name,
      sku,
      description,
      minimumStock,
      isActive,
      categoryId,
      locationId,
    },
    include: {
      category: true,
      location: true,
    },
  });

  res.json({
    success: true,
    message: 'Produk berhasil diperbarui',
    data: updated,
  });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const product = await prisma.products.findUnique({
    where: { id },
    include: {
      _count: {
        select: { stockMovements: true },
      },
    },
  });

  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  if (product._count.stockMovements > 0) {
    throw new AppError(
      'Tidak dapat menghapus produk karena memiliki riwayat perpindahan stok (Stock Movement)',
      400,
    );
  }

  await prisma.products.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Produk berhasil dihapus',
  });
});

export const getProductStock = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const product = await prisma.products.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      minimumStock: true,
    },
  });

  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  let status: 'safe' | 'low' | 'out' = 'safe';
  if (product.stock === 0) {
    status = 'out';
  } else if (product.stock <= product.minimumStock) {
    status = 'low';
  }

  res.json({
    success: true,
    message: 'Data stok produk berhasil diambil',
    data: {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      currentStock: product.stock,
      minimumStock: product.minimumStock,
      status,
    },
  });
});
