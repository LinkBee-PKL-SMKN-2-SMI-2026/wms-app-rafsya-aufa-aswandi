import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import type {
  GetDashboardStatsQuery,
  GetRecentMovementsQuery,
  TopProductItem,
  CategoryDistributionItem,
} from '../models/dashboard.dto';

export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as GetDashboardStatsQuery;
  const period = query.period || 'week';

  const now = new Date();
  let dateFilter: Date;

  if (period === 'today') {
    dateFilter = new Date(now);
    dateFilter.setUTCHours(0, 0, 0, 0);
  } else if (period === 'month') {
    dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    // Default 'week' (7 hari terakhir)
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const [allProducts, inboundStats, outboundStats, groupedMovements, categoriesWithProducts] =
    await Promise.all([
      // 1. Ambil list produk untuk overview (total, sum stock, low & out of stock)
      prisma.products.findMany({
        where: { isActive: true },
        select: { id: true, stock: true, minimumStock: true },
      }),

      // 2. Total Inbound
      prisma.stock_Movements.aggregate({
        where: {
          type: 'INBOUND',
          createdAt: { gte: dateFilter },
        },
        _sum: { quantity: true },
      }),

      // 3. Total Outbound
      prisma.stock_Movements.aggregate({
        where: {
          type: 'OUTBOUND',
          createdAt: { gte: dateFilter },
        },
        _sum: { quantity: true },
      }),

      // 4. Top 5 Produk berdasarkan jumlah movement
      prisma.stock_Movements.groupBy({
        by: ['productId'],
        where: {
          createdAt: { gte: dateFilter },
        },
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      }),

      // 5. Distribusi Produk & Stok per Kategori
      prisma.categories.findMany({
        where: { isActive: true },
        select: {
          name: true,
          products: {
            where: { isActive: true },
            select: { stock: true },
          },
        },
      }),
    ]);

  // Kalkulasi overview
  const totalProducts = allProducts.length;
  let totalStock = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const prod of allProducts) {
    totalStock += prod.stock;
    if (prod.stock === 0) {
      outOfStockCount += 1;
    }
    if (prod.stock < prod.minimumStock) {
      lowStockCount += 1;
    }
  }

  // Kalkulasi movements
  const totalInbound = inboundStats._sum.quantity || 0;
  const totalOutbound = outboundStats._sum.quantity || 0;
  const netMovement = totalInbound - totalOutbound;

  // Detail data Top Products
  const topProductIds = groupedMovements.map((m) => m.productId);
  const topProductDetails = await prisma.products.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, sku: true },
  });

  const productMap = new Map(topProductDetails.map((p) => [p.id, p]));

  const topProducts: TopProductItem[] = groupedMovements
    .map((item) => {
      const prod = productMap.get(item.productId);
      return {
        id: item.productId,
        name: prod?.name || 'Unknown Product',
        sku: prod?.sku || '-',
        totalMovement: item._sum.quantity || 0,
      };
    })
    .filter((p) => p.name !== 'Unknown Product');

  // Kalkulasi distribusi kategori
  const categoryDistribution: CategoryDistributionItem[] = categoriesWithProducts.map((cat) => ({
    categoryName: cat.name,
    productCount: cat.products.length,
    totalStock: cat.products.reduce((acc, curr) => acc + curr.stock, 0),
  }));

  res.json({
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: {
      overview: {
        totalProducts,
        totalStock,
        lowStockCount,
        outOfStockCount,
      },
      movements: {
        totalInbound,
        totalOutbound,
        netMovement,
      },
      topProducts,
      categoryDistribution,
    },
  });
});

export const getRecentMovements = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as GetRecentMovementsQuery;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const [total, movements] = await Promise.all([
    prisma.stock_Movements.count(),
    prisma.stock_Movements.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  res.json({
    success: true,
    message: 'Recent movements retrieved successfully',
    data: movements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
