import type { z } from 'zod';
import type {
  GetDashboardStatsSchema,
  GetRecentMovementsSchema,
} from '../validations/dashboard.validation';

export type GetDashboardStatsQuery = z.infer<typeof GetDashboardStatsSchema>['query'];
export type GetRecentMovementsQuery = z.infer<typeof GetRecentMovementsSchema>['query'];

export interface TopProductItem {
  id: string;
  name: string;
  sku: string;
  totalMovement: number;
}

export interface CategoryDistributionItem {
  categoryName: string;
  productCount: number;
  totalStock: number;
}

export interface DashboardStatsResponse {
  overview: {
    totalProducts: number;
    totalStock: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  movements: {
    totalInbound: number;
    totalOutbound: number;
    netMovement: number;
  };
  topProducts: TopProductItem[];
  categoryDistribution: CategoryDistributionItem[];
}
