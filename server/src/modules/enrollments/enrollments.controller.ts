import { Request, Response, NextFunction } from 'express';
import { EnrollmentsService } from './enrollments.service';
import { successResponse } from '../../utils/response';
import { AuthenticatedUser } from '../../middleware/auth.middleware';

const enrollmentsService = new EnrollmentsService();

export class EnrollmentsController {
  async enroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.courseId as string;
      const caller = (req as any).user as AuthenticatedUser;
      const enrollment = await enrollmentsService.enroll(courseId, caller);
      res.status(201).json(successResponse(enrollment));
    } catch (err) {
      next(err);
    }
  }

  async getMyEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const caller = (req as any).user as AuthenticatedUser;
      const enrollments = await enrollmentsService.getMyEnrollments(caller);
      res.json(successResponse(enrollments));
    } catch (err) {
      next(err);
    }
  }

  async getCourseProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courseId = req.params.courseId as string;
      const caller = (req as any).user as AuthenticatedUser;
      const progress = await enrollmentsService.getCourseProgress(courseId, caller);
      res.json(successResponse(progress));
    } catch (err) {
      next(err);
    }
  }

  async updateLessonProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lessonId = req.params.lessonId as string;
      const caller = (req as any).user as AuthenticatedUser;
      const { currentPositionSeconds, progressPercent } = req.body;
      const result = await enrollmentsService.updateLessonProgress(
        lessonId,
        { currentPositionSeconds, progressPercent },
        caller,
      );
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async completeLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lessonId = req.params.lessonId as string;
      const caller = (req as any).user as AuthenticatedUser;
      const result = await enrollmentsService.completeLesson(lessonId, caller);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  }
}
