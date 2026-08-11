import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth.type';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';

export const authorize = (...roles: string[]) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AppError('Unauthorized', 401));
      }

      // Ambil role user langsung dari database (karena JWT hanya berisi userId & email)
      const user = await prisma.users.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      });

      if (!user) {
        return next(new AppError('User tidak ditemukan', 404));
      }

      // Cek apakah role user diizinkan
      if (!roles.includes(user.role)) {
        return next(new AppError('Forbidden: Anda tidak memiliki akses', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};