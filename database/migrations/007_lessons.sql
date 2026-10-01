-- 007_lessons.sql
-- Ordered instructional units within courses

CREATE TABLE lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  type             VARCHAR(20) NOT NULL DEFAULT 'video'
                     CHECK (type IN ('video', 'document', 'image', 'quiz')),
  position         INTEGER NOT NULL CHECK (position > 0),
  is_required      BOOLEAN NOT NULL DEFAULT true,
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  text_content     TEXT,
  media_id         UUID,    -- FK added after media table (see 008)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, position)
);

CREATE INDEX idx_lessons_course_id ON lessons (course_id);
CREATE INDEX idx_lessons_type ON lessons (type);
