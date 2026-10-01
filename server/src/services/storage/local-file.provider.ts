import fs from 'fs';
import path from 'path';
import { IStorageProvider, StoredFile } from './storage.provider';
import { config } from '../../config/env';

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Videos
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
]);

const MEDIA_TYPE_DIRS: Record<string, string> = {
  'image/jpeg': 'images',
  'image/png': 'images',
  'image/gif': 'images',
  'image/webp': 'images',
  'image/svg+xml': 'images',
  'application/pdf': 'documents',
  'application/msword': 'documents',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'documents',
  'video/mp4': 'videos',
  'video/webm': 'videos',
  'video/ogg': 'videos',
  'video/quicktime': 'videos',
};

export class LocalFileStorageProvider implements IStorageProvider {
  private readonly rootDir: string;

  constructor() {
    this.rootDir = path.resolve(config.STORAGE_ROOT);
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = ['images', 'videos', 'documents', 'avatars', 'courses'];
    for (const dir of dirs) {
      const dirPath = path.join(this.rootDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
  }

  private resolveKey(key: string): string {
    // Prevent path traversal: normalize and ensure the resolved path
    // is strictly within rootDir
    const resolved = path.resolve(this.rootDir, key);
    if (!resolved.startsWith(this.rootDir + path.sep) && resolved !== this.rootDir) {
      throw new Error('Invalid storage key: path traversal detected');
    }
    return resolved;
  }

  async save(
    key: string,
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<StoredFile> {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }

    const absolutePath = this.resolveKey(key);
    const dir = path.dirname(absolutePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, buffer);

    return {
      storageKey: key,
      storageType: 'local',
      originalName,
      mimeType,
      fileSize: buffer.length,
    };
  }

  async get(key: string): Promise<Buffer> {
    const absolutePath = this.resolveKey(key);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${key}`);
    }
    return fs.readFileSync(absolutePath);
  }

  async delete(key: string): Promise<void> {
    const absolutePath = this.resolveKey(key);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const absolutePath = this.resolveKey(key);
      return fs.existsSync(absolutePath);
    } catch {
      return false;
    }
  }

  /**
   * Generate a storage key for a new file, organizing by MIME type directory.
   * Uses a timestamp + random suffix to avoid name collisions.
   */
  static generateKey(mimeType: string, prefix?: string): string {
    const dir = MEDIA_TYPE_DIRS[mimeType] ?? 'documents';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin';
    const filename = `${timestamp}-${random}.${ext}`;
    return prefix ? path.join(prefix, filename) : path.join(dir, filename);
  }
}
