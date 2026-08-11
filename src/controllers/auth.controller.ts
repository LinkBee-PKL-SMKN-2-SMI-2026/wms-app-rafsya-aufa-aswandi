import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { RegisterRequest, LoginRequest } from '../models/auth.dto';
import { AuthRequest, TokenPayload } from '../types/auth.type';

// 1. REGISTER
export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password }: RegisterRequest = req.body;

  // Cek apakah email sudah terdaftar
  const existingUser = await prisma.users.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email sudah terdaftar', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Simpan user baru ke database
  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  logger.info(`User baru terdaftar: ${user.email}`);

  // Generate Token
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    },
  });
});

// 2. LOGIN
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password }: LoginRequest = req.body;

  // Cari user berdasarkan email
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Email atau password salah', 401);
  }

  // Bandingkan password
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new AppError('Email atau password salah', 401);
  }

  logger.info(`User berhasil login: ${user.email}`);

  // Generate Token
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  res.json({
    success: true,
    message: 'Login berhasil',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    },
  });
});

export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user as TokenPayload;

  const user = await prisma.users.findUnique({
    where: { id: userId },
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
    message: 'Data user berhasil diambil',
    data: user,
  });
});