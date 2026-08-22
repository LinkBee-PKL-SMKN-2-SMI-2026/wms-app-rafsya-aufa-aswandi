import { z } from 'zod';
import {
  CreateProductSchema,
  GetAllProductSchema,
  GetProductByIdSchema,
  UpdateProductSchema,
  DeleteProductSchema,
} from '../validations/product.validation';

export type CreateProductDTO = z.infer<typeof CreateProductSchema>['body'];
export type GetAllProductDTO = z.infer<typeof GetAllProductSchema>['query'];
export type GetProductByIdDTO = z.infer<typeof GetProductByIdSchema>['params'];
export type UpdateProductBodyDTO = z.infer<typeof UpdateProductSchema>['body'];
export type UpdateProductParamsDTO = z.infer<typeof UpdateProductSchema>['params'];
export type DeleteProductDTO = z.infer<typeof DeleteProductSchema>['params'];
