import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { config } from '../../config/env';
import { successResponse } from '../../utils/response';
import { UnauthorizedError } from '../../utils/errors';
import crypto from 'crypto';

const COOKIE_NAME = 'ls_refresh_token';

function setRefreshCookie(res: Response, token: string): void {
  const maxAge = config.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000;
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

function getRefreshToken(req: Request): string | null {
  return (req.cookies as Record<string, string>)[COOKIE_NAME] ?? null;
}

// ---- Validation schemas ----

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must be at most 100 characters')
    .trim(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ---- Controller ----

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body.email, body.password, body.displayName);
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json(successResponse({ accessToken: result.accessToken, userId: result.userId }));
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await authService.login(body.email, body.password, ipAddress, userAgent);
    setRefreshCookie(res, result.refreshToken);
    res.json(successResponse({ accessToken: result.accessToken, userId: result.userId }));
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = getRefreshToken(req);
    if (!rawToken) {
      throw new UnauthorizedError('No refresh token', 'TOKEN_MISSING');
    }
    const result = await authService.refresh(rawToken);
    setRefreshCookie(res, result.refreshToken);
    res.json(successResponse({ accessToken: result.accessToken }));
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = getRefreshToken(req);
    if (rawToken) {
      await authService.logout(rawToken);
    }
    clearRefreshCookie(res);
    res.json(successResponse({ message: 'Logged out successfully' }));
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const user = await authService.getMe(req.user.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    res.json(successResponse(user));
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const body = changePasswordSchema.parse(req.body);

    // Get the current refresh token hash so we can keep the current session
    const rawToken = getRefreshToken(req);
    const currentSessionHash = rawToken
      ? crypto.createHash('sha256').update(rawToken).digest('hex')
      : '';

    await authService.changePassword(
      req.user.userId,
      body.currentPassword,
      body.newPassword,
      currentSessionHash,
    );

    res.json(successResponse({ message: 'Password changed successfully. Other sessions have been revoked.' }));
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const profile = await authService.getProfile(req.user.userId);
    res.json(successResponse(profile));
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const { displayName, bio, avatarPath } = req.body;
    const updated = await authService.updateProfile(req.user.userId, { displayName, bio, avatarPath });
    res.json(successResponse(updated));
  } catch (err) {
    next(err);
  }
}

