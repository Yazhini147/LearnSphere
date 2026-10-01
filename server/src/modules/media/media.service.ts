import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../database/pool';
import { StorageService } from '../../services/storage/storage.service';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { AuthenticatedUser } from '../../middleware/auth.middleware';

export interface UploadMediaResult {
  id: string;
  storageKey: string;
  url: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  mediaType: 'image' | 'video' | 'document' | 'avatar';
}

export class MediaService {
  private storage = StorageService.getInstance();

  async uploadFile(
    file: Express.Multer.File,
    caller: AuthenticatedUser,
    customMediaType?: 'image' | 'video' | 'document' | 'avatar',
  ): Promise<UploadMediaResult> {
    if (!file) throw new BadRequestError('No file provided');

    // Infer media type
    let mediaType: 'image' | 'video' | 'document' | 'avatar' = 'image';
    if (customMediaType) {
      mediaType = customMediaType;
    } else if (file.mimetype.startsWith('video/')) {
      mediaType = 'video';
    } else if (file.mimetype.startsWith('image/')) {
      mediaType = 'image';
    } else {
      mediaType = 'document';
    }

    // Generate unique storage key
    const ext = path.extname(file.originalname).toLowerCase();
    const subfolder = mediaType === 'avatar' ? 'avatars' : `${mediaType}s`;
    const storageKey = `${subfolder}/${uuidv4()}${ext}`;

    // Save to storage provider
    const stored = await this.storage.save(storageKey, file.buffer, file.mimetype, file.originalname);

    // Save metadata in database
    const insertSql = `
      INSERT INTO media_files (
        uploaded_by, storage_type, storage_key, 
        original_name, mime_type, file_size, media_type
      )
      VALUES ($1, 'local', $2, $3, $4, $5, $6)
      RETURNING id, storage_key AS "storageKey", original_name AS "originalName",
                mime_type AS "mimeType", file_size AS "fileSize", media_type AS "mediaType"
    `;

    const res = await pool.query(insertSql, [
      caller.userId,
      stored.storageKey,
      file.originalname,
      file.mimetype,
      file.size,
      mediaType,
    ]);

    const record = res.rows[0];

    return {
      id: record.id,
      storageKey: record.storageKey,
      url: `/uploads/${record.storageKey}`,
      originalName: record.originalName,
      mimeType: record.mimeType,
      fileSize: Number(record.fileSize),
      mediaType: record.mediaType,
    };
  }

  async getMediaById(mediaId: string): Promise<UploadMediaResult> {
    const res = await pool.query(
      `SELECT id, storage_key AS "storageKey", original_name AS "originalName",
              mime_type AS "mimeType", file_size AS "fileSize", media_type AS "mediaType"
       FROM media_files WHERE id = $1`,
      [mediaId],
    );
    if (res.rows.length === 0) throw new NotFoundError('Media file not found');
    const record = res.rows[0];
    return {
      id: record.id,
      storageKey: record.storageKey,
      url: `/uploads/${record.storageKey}`,
      originalName: record.originalName,
      mimeType: record.mimeType,
      fileSize: Number(record.fileSize),
      mediaType: record.mediaType,
    };
  }

  async deleteMedia(mediaId: string, caller: AuthenticatedUser): Promise<void> {
    const res = await pool.query(
      'SELECT id, uploaded_by, storage_key FROM media_files WHERE id = $1',
      [mediaId],
    );
    if (res.rows.length === 0) throw new NotFoundError('Media file not found');
    const media = res.rows[0];

    if (caller.role !== 'admin' && media.uploaded_by !== caller.userId) {
      throw new BadRequestError('You do not have permission to delete this media file');
    }

    await this.storage.delete(media.storage_key);
    await pool.query('DELETE FROM media_files WHERE id = $1', [mediaId]);
  }
}

export const mediaService = new MediaService();
