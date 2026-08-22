import { z } from 'zod';
import {
  CreateLocationSchema,
  GetAllLocationSchema,
  GetLocationByIdSchema,
  UpdateLocationSchema,
  DeleteLocationSchema,
} from '../validations/location.validation';

export type CreateLocationDTO = z.infer<typeof CreateLocationSchema>['body'];
export type GetAllLocationDTO = z.infer<typeof GetAllLocationSchema>['query'];
export type GetLocationByIdDTO = z.infer<typeof GetLocationByIdSchema>['params'];
export type UpdateLocationBodyDTO = z.infer<typeof UpdateLocationSchema>['body'];
export type UpdateLocationParamsDTO = z.infer<typeof UpdateLocationSchema>['params'];
export type DeleteLocationDTO = z.infer<typeof DeleteLocationSchema>['params'];
