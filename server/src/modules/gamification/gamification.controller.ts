import { Request, Response, NextFunction } from 'express';
import { gamificationService } from './gamification.service';
import { successResponse } from '../../utils/response';
import { AuthenticatedUser } from '../../middleware/auth.middleware';

export async function getGamificationSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const caller = (req as any).user as AuthenticatedUser;
    const summary = await gamificationService.getGamificationSummary(caller.userId);
    res.json(successResponse(summary));
  } catch (err) {
    next(err);
  }
}
