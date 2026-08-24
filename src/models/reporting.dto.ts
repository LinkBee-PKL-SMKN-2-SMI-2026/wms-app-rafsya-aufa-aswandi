import type { z } from 'zod';
import type { GetSummarySchema, GetLowStockSchema } from '../validations/reporting.validation';

export type GetSummaryQuery = z.infer<typeof GetSummarySchema>['query'];
export type GetLowStockQuery = z.infer<typeof GetLowStockSchema>['query'];

export interface SummaryResponse {
  totalProducts: number;
  totalCategories: number;
  totalLocations: number;
  totalStockInboundToday: number;
  totalStockOutboundToday: number;
  totalUsers: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minimumStock: number;
  categoryName: string;
  locationName: string;
}
