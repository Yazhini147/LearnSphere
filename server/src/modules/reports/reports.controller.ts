import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { successResponse, listResponse, buildPaginationMeta } from '../../utils/response';
import { AuthenticatedUser } from '../../middleware/auth.middleware';

export class ReportsController {
  async getInstructorReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const caller = (req as any).user as AuthenticatedUser;
      const reports = await reportsService.getInstructorReports(caller.userId);
      res.json(successResponse(reports));
    } catch (err) {
      next(err);
    }
  }

  async getAdminReports(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reports = await reportsService.getAdminReports();
      res.json(successResponse(reports));
    } catch (err) {
      next(err);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;

      const { data, total } = await reportsService.listUsers({ page, pageSize, search, role });
      const meta = buildPaginationMeta(page, pageSize, total);
      res.json(listResponse(data, meta));
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId as string;
      const { role } = req.body;
      const caller = (req as any).user as AuthenticatedUser;
      const result = await reportsService.updateUserRole(userId, role, caller);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();
