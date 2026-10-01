import { Request, Response, NextFunction } from 'express';
import { tagsService } from './tags.service';
import { successResponse } from '../../utils/response';

export async function getTags(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tags = await tagsService.getAllTags();
    res.json(successResponse(tags));
  } catch (err) {
    next(err);
  }
}
