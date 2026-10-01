import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsOrigins } from './config/env';
import { errorHandler } from './utils/error-handler';
import authRoutes from './modules/auth/auth.routes';
import coursesRoutes from './modules/courses/courses.routes';
import tagsRoutes from './modules/tags/tags.routes';
import lessonsRouter from './modules/lessons/lessons.routes';
import quizzesRouter from './modules/quizzes/quizzes.routes';
import { meRouter } from './modules/enrollments/enrollments.routes';
import { instructorReportsRouter, adminRouter } from './modules/reports/reports.routes';

import mediaRoutes from './modules/media/media.routes';
import { config } from './config/env';

const app = express();

// ---- Security headers ----
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// ---- CORS ----
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ---- Body parsing ----
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---- Static uploads ----
app.use('/uploads', express.static(config.STORAGE_ROOT));

// ---- Health check ----
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- API routes ----
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', coursesRoutes);
app.use('/api/v1/tags', tagsRoutes);
app.use('/api/v1/lessons', lessonsRouter);
app.use('/api/v1/quizzes', quizzesRouter);
app.use('/api/v1/me', meRouter);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/instructor/reports', instructorReportsRouter);
app.use('/api/v1/admin', adminRouter);

// ---- 404 handler ----
app.use((_req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

// ---- Global error handler ----
app.use(errorHandler);

export default app;
