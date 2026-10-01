import { Request, Response, NextFunction } from 'express';
import { coursesService } from './courses.service';
import { successResponse, listResponse } from '../../utils/response';

export async function listCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
    const level = typeof req.query.level === 'string' ? req.query.level : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const instructorId = typeof req.query.instructorId === 'string' ? req.query.instructorId : undefined;
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined;
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const result = await coursesService.listCourses(
      {
        page,
        pageSize,
        search,
        tag,
        level,
        status,
        instructorId,
        sortBy,
        sortOrder,
      },
      req.user,
    );

    res.json(listResponse(result.data, result.meta));
  } catch (err) {
    next(err);
  }
}

export async function getCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courseId = req.params.courseId as string;
    const course = await coursesService.getCourseById(courseId, req.user, true);
    res.json(successResponse(course));
  } catch (err) {
    next(err);
  }
}

export async function createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const course = await coursesService.createCourse(req.user.userId, req.body);
    res.status(201).json(successResponse(course));
  } catch (err) {
    next(err);
  }
}

export async function updateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const courseId = req.params.courseId as string;
    const course = await coursesService.updateCourse(courseId, req.user, req.body);
    res.json(successResponse(course));
  } catch (err) {
    next(err);
  }
}

export async function deleteCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const courseId = req.params.courseId as string;
    await coursesService.deleteCourse(courseId, req.user);
    res.json(successResponse({ message: 'Course deleted successfully' }));
  } catch (err) {
    next(err);
  }
}

export async function publishCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const courseId = req.params.courseId as string;
    const course = await coursesService.publishCourse(courseId, req.user);
    res.json(successResponse(course));
  } catch (err) {
    next(err);
  }
}

export async function unpublishCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const courseId = req.params.courseId as string;
    const course = await coursesService.unpublishCourse(courseId, req.user);
    res.json(successResponse(course));
  } catch (err) {
    next(err);
  }
}
