import { Response, NextFunction } from 'express';
import { AuthRequest, TokenPayload } from '../types/auth.type'; // Sesuaikan lokasi tipe
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token tidak ditemukan atau format salah', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token) as TokenPayload;
    req.user = payload; // Simpan payload JWT ke req.user
    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return next(new AppError('Token tidak valid atau expired', 401));
  }
};
