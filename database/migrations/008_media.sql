-- 008_media.sql
-- Media file metadata (actual files live in StorageService)

CREATE TABLE media_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by   UUID NOT NULL REFERENCES users (id),
  storage_type  VARCHAR(20) NOT NULL DEFAULT 'local'
                  CHECK (storage_type IN ('local', 's3', 'supabase')),
  storage_key   VARCHAR(500) NOT NULL UNIQUE,  -- provider-specific key/path
  original_name VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  file_size     BIGINT NOT NULL CHECK (file_size > 0),
  media_type    VARCHAR(20) NOT NULL DEFAULT 'image'
                  CHECK (media_type IN ('image', 'video', 'document', 'avatar')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_files_uploaded_by ON media_files (uploaded_by);
CREATE INDEX idx_media_files_media_type ON media_files (media_type);

-- Add FK from lessons to media_files now that media_files exists
ALTER TABLE lessons
  ADD CONSTRAINT fk_lessons_media_id
  FOREIGN KEY (media_id) REFERENCES media_files (id) ON DELETE SET NULL;
