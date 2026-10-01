import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { mediaService } from './media.service';
import { successResponse } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';
import { AuthenticatedUser } from '../../middleware/auth.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

export const uploadMiddleware = upload.single('file');

export async function uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const caller = (req as any).user as AuthenticatedUser;
    if (!req.file) {
      throw new BadRequestError('No file uploaded in form field "file"');
    }
    const mediaType = req.body.mediaType as any;
    const result = await mediaService.uploadFile(req.file, caller, mediaType);
    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function getMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const mediaId = req.params.mediaId as string;
    const result = await mediaService.getMediaById(mediaId);
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function deleteMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const caller = (req as any).user as AuthenticatedUser;
    const mediaId = req.params.mediaId as string;
    await mediaService.deleteMedia(mediaId, caller);
    res.json(successResponse({ message: 'Media file deleted successfully' }));
  } catch (err) {
    next(err);
  }
}

