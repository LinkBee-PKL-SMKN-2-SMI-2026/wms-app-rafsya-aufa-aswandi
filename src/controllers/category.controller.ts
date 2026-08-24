import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { logActivity } from '../services/activity-log.service';
import type { AuthRequest } from '../types/auth.type';

export const createCategory = catchAsync(async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  const userId = req.user?.userId;

  const existing = await prisma.categories.findUnique({ where: { name } });
  if (existing) {
    throw new AppError('Nama kategori sudah digunakan', 400);
  }

  const category = await prisma.categories.create({
    data: { name, description },
  });

  logger.info(
    { event: 'CATEGORY_CREATED', categoryId: category.id },
    `Kategori dibuat: ${category.name}`,
  );

  if (userId) {
    void logActivity({
      userId,
      action: 'CREATE',
      entity: 'Categories',
      entityId: category.id,
      detail: { name: category.name },
    });
  }

  res.status(201).json({
    success: true,
    message: 'Kategori berhasil dibuat',
    data: category,
  });
});

export const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.max(1, parseInt(String(req.query.limit || '10'), 10));
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const sort = req.query.sort === 'asc' ? ('asc' as const) : ('desc' as const);
  const skip = (page - 1) * limit;

  const whereClause = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [total, categories] = await Promise.all([
    prisma.categories.count({ where: whereClause }),
    prisma.categories.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: sort },
      include: {
        _count: {
          select: { products: true },
        },
      },
    }),
  ]);

  res.json({
    success: true,
    message: 'Berhasil mengambil daftar kategori',
    data: categories,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const category = await prisma.categories.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }

  res.json({
    success: true,
    message: 'Data kategori berhasil diambil',
    data: category,
  });
});

export const updateCategory = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, description, isActive } = req.body;
  const userId = req.user?.userId;

  const category = await prisma.categories.findUnique({ where: { id } });
  if (!category) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }

  if (name && name !== category.name) {
    const duplicate = await prisma.categories.findUnique({ where: { name } });
    if (duplicate) {
      throw new AppError('Nama kategori sudah digunakan oleh kategori lain', 400);
    }
  }

  const updated = await prisma.categories.update({
    where: { id },
    data: { name, description, isActive },
  });

  if (userId) {
    void logActivity({
      userId,
      action: 'UPDATE',
      entity: 'Categories',
      entityId: updated.id,
      detail: { name, description, isActive },
    });
  }

  res.json({
    success: true,
    message: 'Kategori berhasil diperbarui',
    data: updated,
  });
});

export const deleteCategory = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = req.user?.userId;

  const category = await prisma.categories.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }

  if (category._count.products > 0) {
    throw new AppError('Tidak dapat menghapus kategori karena masih memiliki produk terkait', 400);
  }

  await prisma.categories.delete({ where: { id } });

  if (userId) {
    void logActivity({
      userId,
      action: 'DELETE',
      entity: 'Categories',
      entityId: id,
    });
  }

  res.json({
    success: true,
    message: 'Kategori berhasil dihapus',
  });
});
