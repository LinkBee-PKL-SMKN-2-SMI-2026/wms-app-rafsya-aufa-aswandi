import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import type { GetSummaryQuery, GetLowStockQuery, LowStockProduct } from '../models/reporting.dto';

export const getSummary = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as GetSummaryQuery;

  let baseDate = new Date();
  if (query.date) {
    baseDate = new Date(`${query.date}T00:00:00.000Z`);
  }

  const startOfDay = new Date(baseDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(baseDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const [totalProducts, totalCategories, totalLocations, totalUsers, inboundToday, outboundToday] =
    await Promise.all([
      prisma.products.count(),
      prisma.categories.count(),
      prisma.locations.count(),
      prisma.users.count(),
      prisma.stock_Movements.aggregate({
        where: {
          type: 'INBOUND',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { quantity: true },
      }),
      prisma.stock_Movements.aggregate({
        where: {
          type: 'OUTBOUND',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { quantity: true },
      }),
    ]);

  res.json({
    success: true,
    message: 'Summary retrieved successfully',
    data: {
      totalProducts,
      totalCategories,
      totalLocations,
      totalStockInboundToday: inboundToday._sum.quantity || 0,
      totalStockOutboundToday: outboundToday._sum.quantity || 0,
      totalUsers,
    },
  });
});

export const getLowStock = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as GetLowStockQuery;
  const threshold = Number(query.threshold) || 10;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const whereClause = {
    stock: { lt: threshold },
    isActive: true,
  };

  const [total, rawProducts] = await Promise.all([
    prisma.products.count({ where: whereClause }),
    prisma.products.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true } },
        location: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
      skip,
      take: limit,
    }),
  ]);

  const products: LowStockProduct[] = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    minimumStock: p.minimumStock,
    categoryName: p.category?.name || 'Uncategorized',
    locationName: p.location?.name || 'Unassigned',
  }));

  res.json({
    success: true,
    message: 'Low stock products retrieved successfully',
    data: products,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
