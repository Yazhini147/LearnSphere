import { Router } from 'express';
import {
  listCourseLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from './lessons.controller';
import { optionalAuth, authenticateToken, requireRole } from '../../middleware/auth.middleware';

// Router for /api/v1/courses/:courseId/lessons
export const courseLessonsRouter = Router({ mergeParams: true });

courseLessonsRouter.get('/', optionalAuth, listCourseLessons);
courseLessonsRouter.post(
  '/',
  authenticateToken,
  requireRole('instructor', 'admin'),
  createLesson,
);
courseLessonsRouter.post(
  '/reorder',
  authenticateToken,
  requireRole('instructor', 'admin'),
  reorderLessons,
);

import { createQuizForLesson } from '../quizzes/quizzes.controller';

// Router for /api/v1/lessons/:lessonId
export const lessonsRouter = Router();

lessonsRouter.get('/:lessonId', optionalAuth, getLesson);
lessonsRouter.patch(
  '/:lessonId',
  authenticateToken,
  requireRole('instructor', 'admin'),
  updateLesson,
);
lessonsRouter.delete(
  '/:lessonId',
  authenticateToken,
  requireRole('instructor', 'admin'),
  deleteLesson,
);
lessonsRouter.post(
  '/:lessonId/quiz',
  authenticateToken,
  requireRole('instructor', 'admin'),
  createQuizForLesson,
);

export default lessonsRouter;
