import { z } from 'zod';

export const CreateLocationSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama lokasi minimal 3 karakter'),
    code: z.string().min(1, 'Kode lokasi wajib diisi').max(10, 'Kode lokasi maksimal 10 karakter'),
  }),
});

export const GetAllLocationSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    search: z.string().optional(),
    sort: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const GetLocationByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format ID lokasi harus UUID'),
  }),
});

export const UpdateLocationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format ID lokasi harus UUID'),
  }),
  body: z.object({
    name: z.string().min(3, 'Nama lokasi minimal 3 karakter').optional(),
    code: z.string().min(1).max(10, 'Kode lokasi maksimal 10 karakter').optional(),
    isActive: z.boolean().optional(),
  }),
});

export const DeleteLocationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format ID lokasi harus UUID'),
  }),
});
