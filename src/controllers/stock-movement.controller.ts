import type { Response } from 'express';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { logActivity } from '../services/activity-log.service';
import type { AuthRequest } from '../types/auth.type';
import type {
  CreateInboundRequest,
  CreateOutboundRequest,
  GetMovementHistoryQuery,
} from '../models/stock-movement.dto';

export const createInbound = catchAsync(async (req: AuthRequest, res: Response) => {
  const { productId, quantity, notes } = req.body as CreateInboundRequest;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const productExists = await prisma.products.findUnique({
    where: { id: productId },
  });

  if (!productExists) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.products.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });

    const movement = await tx.stock_Movements.create({
      data: {
        type: 'INBOUND',
        quantity,
        notes,
        userId,
        productId,
      },
      include: {
        product: { select: { name: true, sku: true } },
        user: { select: { name: true } },
      },
    });

    return { movement, updatedProduct };
  });

  void logActivity({
    userId,
    action: 'CREATE',
    entity: 'Stock_Movements',
    entityId: result.movement.id,
    detail: { type: 'INBOUND', productId, quantity, notes },
  });

  res.status(201).json({
    success: true,
    message: 'Stok masuk berhasil dicatat',
    data: result.movement,
  });
});

export const createOutbound = catchAsync(async (req: AuthRequest, res: Response) => {
  const { productId, quantity, notes } = req.body as CreateOutboundRequest;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const product = await prisma.products.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  if (product.stock < quantity) {
    throw new AppError('Stok tidak mencukupi', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.products.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    const movement = await tx.stock_Movements.create({
      data: {
        type: 'OUTBOUND',
        quantity,
        notes,
        userId,
        productId,
      },
      include: {
        product: { select: { name: true, sku: true } },
        user: { select: { name: true } },
      },
    });

    return { movement, updatedProduct };
  });

  void logActivity({
    userId,
    action: 'CREATE',
    entity: 'Stock_Movements',
    entityId: result.movement.id,
    detail: { type: 'OUTBOUND', productId, quantity, notes },
  });

  res.status(201).json({
    success: true,
    message: 'Stok keluar berhasil dicatat',
    data: result.movement,
  });
});

export const getMovementHistory = catchAsync(async (req: AuthRequest, res: Response) => {
  const query = req.query as unknown as GetMovementHistoryQuery;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const whereClause: Record<string, unknown> = {};

  if (query.productId) {
    whereClause.productId = query.productId;
  }

  if (query.type) {
    whereClause.type = query.type;
  }

  if (query.startDate || query.endDate) {
    const createdAtFilter: Record<string, Date> = {};
    if (query.startDate) {
      createdAtFilter.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      createdAtFilter.lte = new Date(query.endDate);
    }
    whereClause.createdAt = createdAtFilter;
  }

  const [total, movements] = await Promise.all([
    prisma.stock_Movements.count({ where: whereClause }),
    prisma.stock_Movements.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  res.json({
    success: true,
    message: 'Riwayat pergerakan stok berhasil diambil',
    data: movements,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
