import type { Response, NextFunction } from 'express';
import jwt, { type Secret } from 'jsonwebtoken';
import type { AuthRequest, TokenPayload } from '../types/auth.type';
import { AppError } from '../utils/AppError';

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Akses ditolak. Token tidak ditemukan', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError('Akses ditolak. Token tidak ditemukan', 401);
  }

  const secret: Secret = process.env.JWT_SECRET || 'supersecret';

  try {
    const decoded = jwt.verify(token, secret) as unknown as TokenPayload;
    req.user = decoded;
    next();
  } catch {
    throw new AppError('Token tidak valid atau telah kedaluwarsa', 401);
  }
};
