import { Router } from 'express';
import { EnrollmentsController } from './enrollments.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { getGamificationSummary } from '../gamification/gamification.controller';

const controller = new EnrollmentsController();

// Learner Personal Router (/api/v1/me)
export const meRouter = Router();
meRouter.use(authenticateToken);

meRouter.get('/enrollments', (req, res, next) => controller.getMyEnrollments(req, res, next));
meRouter.get('/courses/:courseId/progress', (req, res, next) => controller.getCourseProgress(req, res, next));
meRouter.patch('/lessons/:lessonId/progress', (req, res, next) => controller.updateLessonProgress(req, res, next));
meRouter.post('/lessons/:lessonId/complete', (req, res, next) => controller.completeLesson(req, res, next));
meRouter.get('/gamification', (req, res, next) => getGamificationSummary(req, res, next));

// Course Enrollment Sub-router (/api/v1/courses/:courseId/enroll)
export const courseEnrollRouter = Router({ mergeParams: true });
courseEnrollRouter.post('/', authenticateToken, (req, res, next) => controller.enroll(req, res, next));
