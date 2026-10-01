-- 005_courses.sql
-- Course catalog

CREATE TABLE courses (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              VARCHAR(255) NOT NULL,
  slug               VARCHAR(255) UNIQUE NOT NULL,
  short_description  VARCHAR(500),
  description        TEXT,
  thumbnail_path     VARCHAR(500),
  instructor_id      UUID NOT NULL REFERENCES users (id),
  status             VARCHAR(20) NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'published', 'archived')),
  level              VARCHAR(20) NOT NULL DEFAULT 'beginner'
                       CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes  INTEGER NOT NULL DEFAULT 0 CHECK (estimated_minutes >= 0),
  view_count         INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at       TIMESTAMPTZ
);

CREATE INDEX idx_courses_instructor_id ON courses (instructor_id);
CREATE INDEX idx_courses_status ON courses (status);
CREATE INDEX idx_courses_slug ON courses (slug);
CREATE INDEX idx_courses_level ON courses (level);
-- Full-text search index
CREATE INDEX idx_courses_search ON courses
  USING gin ((to_tsvector('english', title || ' ' || COALESCE(short_description, '') || ' ' || COALESCE(description, ''))));
