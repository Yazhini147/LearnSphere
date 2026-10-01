-- 006_tags.sql
-- Tags and course-tag many-to-many

CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) UNIQUE NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags (slug);

CREATE TABLE course_tags (
  course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, tag_id)
);

CREATE INDEX idx_course_tags_tag_id ON course_tags (tag_id);
