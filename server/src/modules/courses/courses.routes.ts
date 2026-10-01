import { Router } from 'express';
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
} from './courses.controller';
import { optionalAuth, authenticateToken, requireRole } from '../../middleware/auth.middleware';
import { courseLessonsRouter } from '../lessons/lessons.routes';
import { courseEnrollRouter } from '../enrollments/enrollments.routes';

const router = Router();

// Sub-resource routes: /api/v1/courses/:courseId/lessons and enroll
router.use('/:courseId/lessons', courseLessonsRouter);
router.use('/:courseId/enroll', courseEnrollRouter);

// Public / Guest / Enrolled routes
router.get('/', optionalAuth, listCourses);
router.get('/:courseId', optionalAuth, getCourse);

// Instructor / Admin Authoring routes
router.post('/', authenticateToken, requireRole('instructor', 'admin'), createCourse);
router.patch('/:courseId', authenticateToken, requireRole('instructor', 'admin'), updateCourse);
router.delete('/:courseId', authenticateToken, requireRole('instructor', 'admin'), deleteCourse);
router.post('/:courseId/publish', authenticateToken, requireRole('instructor', 'admin'), publishCourse);
router.post('/:courseId/unpublish', authenticateToken, requireRole('instructor', 'admin'), unpublishCourse);

export default router;
