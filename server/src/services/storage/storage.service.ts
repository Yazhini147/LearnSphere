import { IStorageProvider, StoredFile } from './storage.provider';
import { LocalFileStorageProvider } from './local-file.provider';

// The StorageService is the single point of access for all file operations.
// It delegates to the active provider (LocalFileStorageProvider in MVP).
// To migrate to S3 or Supabase Storage, replace the provider — not this service.
export class StorageService {
  private static instance: StorageService;
  private provider: IStorageProvider;

  private constructor(provider: IStorageProvider) {
    this.provider = provider;
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      // MVP: use local file storage
      StorageService.instance = new StorageService(new LocalFileStorageProvider());
    }
    return StorageService.instance;
  }

  async save(
    key: string,
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<StoredFile> {
    return this.provider.save(key, buffer, mimeType, originalName);
  }

  async get(key: string): Promise<Buffer> {
    return this.provider.get(key);
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.provider.exists(key);
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string | null> {
    if (this.provider.getSignedUrl) {
      return this.provider.getSignedUrl(key, expiresInSeconds);
    }
    return null;
  }
}

// Convenience re-exports
export { StoredFile, IStorageProvider } from './storage.provider';
export { LocalFileStorageProvider } from './local-file.provider';
