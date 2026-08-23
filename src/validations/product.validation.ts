import { z } from 'zod';

export const CreateProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama produk minimal 3 karakter'),
    sku: z.string().min(3, 'SKU minimal 3 karakter'),
    description: z.string().optional(),
    stock: z.number().int().min(0).optional().default(0),
    minimumStock: z.number().int().min(0).optional().default(10),
    categoryId: z.string().uuid('Format categoryId harus UUID'),
    locationId: z.string().uuid('Format locationId harus UUID'),
  }),
});

export const GetAllProductSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    sort: z.enum(['asc', 'desc']).optional().default('desc'),
    categoryId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
  }),
});

export const GetProductByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format ID produk harus UUID'),
  }),
});

export const UpdateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format ID produk harus UUID'),
  }),
  body: z.object({
    name: z.string().min(3).optional(),
    sku: z.string().min(3).optional(),
    description: z.string().optional(),
    minimumStock: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    categoryId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
  }),
});

export const DeleteProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format ID produk harus UUID'),
  }),
});
