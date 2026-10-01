import { Router } from 'express';
import { uploadMiddleware, uploadMedia, getMedia, deleteMedia } from './media.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

router.post('/upload', authenticateToken, uploadMiddleware, uploadMedia);
router.get('/:mediaId', getMedia);
router.delete('/:mediaId', authenticateToken, deleteMedia);

export default router;
