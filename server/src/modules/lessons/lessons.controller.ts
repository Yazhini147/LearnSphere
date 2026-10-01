import { Request, Response, NextFunction } from 'express';
import { lessonsService } from './lessons.service';
import { successResponse } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';

export async function listCourseLessons(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseId = req.params.courseId as string;
    const lessons = await lessonsService.listLessons(courseId, req.user);
    res.json(successResponse(lessons));
  } catch (err) {
    next(err);
  }
}

export async function getLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lessonId = req.params.lessonId as string;
    const lesson = await lessonsService.getLesson(lessonId, req.user);
    res.json(successResponse(lesson));
  } catch (err) {
    next(err);
  }
}

export async function createLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const courseId = req.params.courseId as string;
    const lesson = await lessonsService.createLesson(courseId, req.user, req.body);
    res.status(201).json(successResponse(lesson));
  } catch (err) {
    next(err);
  }
}

export async function updateLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const lessonId = req.params.lessonId as string;
    const lesson = await lessonsService.updateLesson(lessonId, req.user, req.body);
    res.json(successResponse(lesson));
  } catch (err) {
    next(err);
  }
}

export async function deleteLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const lessonId = req.params.lessonId as string;
    await lessonsService.deleteLesson(lessonId, req.user);
    res.json(successResponse({ message: 'Lesson deleted successfully' }));
  } catch (err) {
    next(err);
  }
}

export async function reorderLessons(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const courseId = req.params.courseId as string;
    const { lessonIds } = req.body;
    if (!Array.isArray(lessonIds)) {
      throw new BadRequestError('lessonIds must be an array of strings');
    }
    const lessons = await lessonsService.reorderLessons(courseId, req.user, lessonIds);
    res.json(successResponse(lessons));
  } catch (err) {
    next(err);
  }
}
