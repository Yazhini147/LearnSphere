// Storage provider interface — defines the contract for any storage backend.
// MVP uses LocalFileStorageProvider. Future: S3Provider, SupabaseStorageProvider.

export interface StoredFile {
  /** Provider-specific key used to retrieve/delete the file */
  storageKey: string;
  /** Storage backend type */
  storageType: 'local' | 's3' | 'supabase';
  /** Original file name as provided by the uploader */
  originalName: string;
  /** MIME type of the file */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
}

export interface IStorageProvider {
  /**
   * Save a file buffer under the given key.
   * The provider is responsible for ensuring the storage location is safe.
   */
  save(
    key: string,
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<StoredFile>;

  /**
   * Retrieve a file as a Buffer by its storage key.
   */
  get(key: string): Promise<Buffer>;

  /**
   * Delete a file by its storage key.
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Optional: generate a time-limited URL for direct client access.
   * Not implemented for local storage.
   */
  getSignedUrl?(key: string, expiresInSeconds: number): Promise<string>;
}
