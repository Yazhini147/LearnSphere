import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export type UserRole = 'learner' | 'instructor' | 'admin';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
}

// Extend Express Request with the authenticated user payload
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface AccessTokenPayload {
  sub: string;       // userId
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Verifies the Authorization: Bearer <token> header.
 * Sets req.user on success. Throws 401 on failure.
 */
export function authenticateToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    next(new UnauthorizedError('No access token provided'));
    return;
  }

  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
    req.user = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Access token expired', 'TOKEN_EXPIRED'));
    } else {
      next(new UnauthorizedError('Invalid access token', 'TOKEN_INVALID'));
    }
  }
}

/**
 * Requires the user to have one of the given roles.
 * Must be used AFTER authenticateToken.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Requires one of: ${roles.join(', ')}`));
      return;
    }
    next();
  };
}

/**
 * Convenience: require the authenticated user owns a specific resource.
 * Pass a resolver function that extracts the owner ID from the request.
 * Admins bypass ownership checks.
 */
export function requireOwnership(
  resolveOwnerId: (req: Request) => string | undefined,
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    // Admins always pass
    if (req.user.role === 'admin') {
      next();
      return;
    }
    const ownerId = resolveOwnerId(req);
    if (!ownerId || ownerId !== req.user.userId) {
      next(new ForbiddenError('You do not have permission to access this resource'));
      return;
    }
    next();
  };
}

/**
 * Optional auth — sets req.user if token present but does NOT reject if absent.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
    req.user = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Token present but invalid — still continue without user
  }

  next();
}
