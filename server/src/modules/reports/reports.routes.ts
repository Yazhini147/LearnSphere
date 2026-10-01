import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';

export const instructorReportsRouter = Router();
instructorReportsRouter.use(authenticateToken, requireRole('instructor', 'admin'));
instructorReportsRouter.get('/', (req, res, next) => reportsController.getInstructorReports(req, res, next));

export const adminRouter = Router();
adminRouter.use(authenticateToken, requireRole('admin'));
adminRouter.get('/reports', (req, res, next) => reportsController.getAdminReports(req, res, next));
adminRouter.get('/users', (req, res, next) => reportsController.listUsers(req, res, next));
adminRouter.patch('/users/:userId/role', (req, res, next) => reportsController.updateUserRole(req, res, next));
