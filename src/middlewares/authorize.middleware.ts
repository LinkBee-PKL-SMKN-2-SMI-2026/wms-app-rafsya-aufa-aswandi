import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/auth.type';
import { AppError } from '../utils/AppError';

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AppError('Akses dilarang. Anda tidak memiliki izin', 403);
    }
    next();
  };
};
