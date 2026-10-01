-- 009_enrollments.sql
-- Learner-course enrollment with status lifecycle

CREATE TABLE enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'enrolled'
                 CHECK (status IN ('enrolled', 'in_progress', 'completed', 'cancelled')),
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX idx_enrollments_user_id ON enrollments (user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments (course_id);
CREATE INDEX idx_enrollments_status ON enrollments (status);
