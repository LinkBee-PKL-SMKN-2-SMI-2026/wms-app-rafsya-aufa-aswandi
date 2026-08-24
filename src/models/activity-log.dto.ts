import type { z } from 'zod';
import type { GetActivityLogsSchema } from '../validations/activity-log.validation';

export type GetActivityLogsQuery = z.infer<typeof GetActivityLogsSchema>['query'];

export interface ActivityLogResponse {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: unknown;
  userName: string;
  createdAt: Date;
}
