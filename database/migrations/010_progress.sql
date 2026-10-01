-- 010_progress.sql
-- Per-user per-lesson progress tracking

CREATE TABLE lesson_progress (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  enrollment_id            UUID NOT NULL REFERENCES enrollments (id) ON DELETE CASCADE,
  lesson_id                UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  progress_percent         NUMERIC(5,2) NOT NULL DEFAULT 0
                             CHECK (progress_percent >= 0 AND progress_percent <= 100),
  current_position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (current_position_seconds >= 0),
  status                   VARCHAR(20) NOT NULL DEFAULT 'not_started'
                             CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at               TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user_id ON lesson_progress (user_id);
CREATE INDEX idx_lesson_progress_enrollment_id ON lesson_progress (enrollment_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress (lesson_id);
CREATE INDEX idx_lesson_progress_status ON lesson_progress (status);
