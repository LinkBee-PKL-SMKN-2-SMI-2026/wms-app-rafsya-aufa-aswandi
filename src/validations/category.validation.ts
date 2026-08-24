import { z } from 'zod';

export const CreateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama kategori minimal 3 karakter'),
    description: z.string().optional(),
  }),
});

export const GetAllCategorySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    sort: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const GetCategoryByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format ID kategori harus UUID'),
  }),
});

export const UpdateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Format ID kategori harus UUID'),
  }),
  body: z.object({
    name: z.string().min(3, 'Nama kategori minimal 3 karakter').optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const DeleteCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Format ID kategori harus UUID'),
  }),
});
