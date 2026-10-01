import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../../config/env';
import { authenticateToken } from '../../middleware/auth.middleware';
import {
  register,
  login,
  refresh,
  logout,
  me,
  changePassword,
  getProfile,
  updateProfile,
} from './auth.controller';

const router = Router();

const authLimiter = rateLimit({
  windowMs: config.AUTH_RATE_LIMIT_WINDOW_MS,
  max: config.AUTH_RATE_LIMIT_MAX,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);
router.get('/me', authenticateToken, me);
router.get('/profile', authenticateToken, getProfile);
router.patch('/profile', authenticateToken, updateProfile);
router.post('/change-password', authLimiter, authenticateToken, changePassword);

export default router;
