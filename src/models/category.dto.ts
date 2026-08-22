import { z } from 'zod';
import {
  CreateCategorySchema,
  GetAllCategorySchema,
  GetCategoryByIdSchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
} from '../validations/category.validation';

export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>['body'];
export type GetAllCategoryDTO = z.infer<typeof GetAllCategorySchema>['query'];
export type GetCategoryByIdDTO = z.infer<typeof GetCategoryByIdSchema>['params'];
export type UpdateCategoryBodyDTO = z.infer<typeof UpdateCategorySchema>['body'];
export type UpdateCategoryParamsDTO = z.infer<typeof UpdateCategorySchema>['params'];
export type DeleteCategoryDTO = z.infer<typeof DeleteCategorySchema>['params'];
