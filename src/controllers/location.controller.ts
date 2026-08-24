import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { logActivity } from '../services/activity-log.service';
import type { AuthRequest } from '../types/auth.type';

export const createLocation = catchAsync(async (req: AuthRequest, res: Response) => {
  const { name, code } = req.body;
  const userId = req.user?.userId;

  const existingName = await prisma.locations.findUnique({ where: { name } });
  if (existingName) {
    throw new AppError('Nama lokasi sudah digunakan', 400);
  }

  const existingCode = await prisma.locations.findUnique({ where: { code } });
  if (existingCode) {
    throw new AppError('Kode lokasi sudah digunakan', 400);
  }

  const location = await prisma.locations.create({
    data: { name, code },
  });

  logger.info(
    { event: 'LOCATION_CREATED', locationId: location.id },
    `Lokasi dibuat: ${location.name}`,
  );

  if (userId) {
    void logActivity({
      userId,
      action: 'CREATE',
      entity: 'Locations',
      entityId: location.id,
      detail: { name: location.name, code: location.code },
    });
  }

  res.status(201).json({
    success: true,
    message: 'Lokasi berhasil dibuat',
    data: location,
  });
});

export const getAllLocations = catchAsync(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.max(1, parseInt(String(req.query.limit || '10'), 10));
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const sort = req.query.sort === 'asc' ? ('asc' as const) : ('desc' as const);
  const skip = (page - 1) * limit;

  const whereClause = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [total, locations] = await Promise.all([
    prisma.locations.count({ where: whereClause }),
    prisma.locations.findMany({
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
    message: 'Berhasil mengambil daftar lokasi',
    data: locations,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getLocationById = catchAsync(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const location = await prisma.locations.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!location) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  res.json({
    success: true,
    message: 'Data lokasi berhasil diambil',
    data: location,
  });
});

export const updateLocation = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, code, isActive } = req.body;
  const userId = req.user?.userId;

  const location = await prisma.locations.findUnique({ where: { id } });
  if (!location) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  if (name && name !== location.name) {
    const duplicateName = await prisma.locations.findUnique({ where: { name } });
    if (duplicateName) {
      throw new AppError('Nama lokasi sudah digunakan oleh lokasi lain', 400);
    }
  }

  if (code && code !== location.code) {
    const duplicateCode = await prisma.locations.findUnique({ where: { code } });
    if (duplicateCode) {
      throw new AppError('Kode lokasi sudah digunakan oleh lokasi lain', 400);
    }
  }

  const updated = await prisma.locations.update({
    where: { id },
    data: { name, code, isActive },
  });

  if (userId) {
    void logActivity({
      userId,
      action: 'UPDATE',
      entity: 'Locations',
      entityId: updated.id,
      detail: { name, code, isActive },
    });
  }

  res.json({
    success: true,
    message: 'Lokasi berhasil diperbarui',
    data: updated,
  });
});

export const deleteLocation = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = req.user?.userId;

  const location = await prisma.locations.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!location) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  if (location._count.products > 0) {
    throw new AppError('Tidak dapat menghapus lokasi karena masih memiliki produk terkait', 400);
  }

  await prisma.locations.delete({ where: { id } });

  if (userId) {
    void logActivity({
      userId,
      action: 'DELETE',
      entity: 'Locations',
      entityId: id,
    });
  }

  res.json({
    success: true,
    message: 'Lokasi berhasil dihapus',
  });
});
