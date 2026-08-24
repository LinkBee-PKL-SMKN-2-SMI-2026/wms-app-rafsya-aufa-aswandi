import type { Response } from 'express';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import type { AuthRequest } from '../types/auth.type';
import type { GetActivityLogsQuery, ActivityLogResponse } from '../models/activity-log.dto';

export const getActivityLogs = catchAsync(async (req: AuthRequest, res: Response) => {
  const query = req.query as unknown as GetActivityLogsQuery;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (query.userId) {
    where.userId = query.userId;
  }
  if (query.action) {
    where.action = query.action;
  }
  if (query.entity) {
    where.entity = query.entity;
  }

  if (query.startDate || query.endDate) {
    const createdAtFilter: Record<string, Date> = {};
    if (query.startDate) {
      createdAtFilter.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      createdAtFilter.lte = new Date(query.endDate);
    }
    where.createdAt = createdAtFilter;
  }

  const [logs, total] = await Promise.all([
    prisma.activity_Logs.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activity_Logs.count({ where }),
  ]);

  const formattedLogs: ActivityLogResponse[] = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    detail: log.detail,
    userName: log.user?.name || 'Unknown User',
    createdAt: log.createdAt,
  }));

  res.json({
    success: true,
    message: 'Activity logs retrieved successfully',
    data: formattedLogs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
