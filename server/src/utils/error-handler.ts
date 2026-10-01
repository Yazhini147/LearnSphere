import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './errors';
import { config } from '../config/env';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    const response: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
    };
    res.status(422).json(response);
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Unknown errors — never leak stack traces in production
  console.error('Unhandled error:', err);
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message:
        config.NODE_ENV === 'development' && err instanceof Error
          ? err.message
          : 'An unexpected error occurred',
    },
  };
  res.status(500).json(response);
}
