import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface LogActivityParams {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  detail?: Record<string, unknown>;
}

export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await prisma.activity_Logs.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        detail: params.detail ? JSON.parse(JSON.stringify(params.detail)) : undefined,
        userId: params.userId,
      },
    });
  } catch (error) {
    logger.error({ event: 'ACTIVITY_LOG_ERROR', error }, 'Gagal mencatat activity log');
  }
};
