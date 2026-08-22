import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import type { RegisterRequest, LoginRequest } from '../models/auth.dto';
import type { AuthRequest, TokenPayload } from '../types/auth.type';

export const register = catchAsync(
  async (
    req: Request<Record<string, never>, Record<string, never>, RegisterRequest>,
    res: Response,
  ) => {
    const { name, email, password, role } = req.body;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Email sudah terdaftar', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'STAFF',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    logger.info({ event: 'USER_REGISTERED', userId: user.id }, `User terdaftar: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'User berhasil didaftarkan',
      data: user,
    });
  },
);

export const login = catchAsync(
  async (
    req: Request<Record<string, never>, Record<string, never>, LoginRequest>,
    res: Response,
  ) => {
    const { email, password } = req.body;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Email atau password salah', 401);
    }

    if (!user.isActive) {
      throw new AppError('Akun dinonaktifkan', 403);
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const secret: string = process.env.JWT_SECRET || 'supersecret';
    const token = jwt.sign(payload, secret, {
      expiresIn: '1d',
    });

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  },
);

export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await prisma.users.findUnique({
    where: { id: req.user?.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User tidak ditemukan', 404);
  }

  res.json({
    success: true,
    message: 'Profile berhasil diambil',
    data: user,
  });
});
