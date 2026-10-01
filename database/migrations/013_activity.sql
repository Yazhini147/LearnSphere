-- 013_activity.sql
-- Learning activity events for streak and recency calculations

CREATE TABLE learning_activity (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activity_type VARCHAR(50) NOT NULL
                  CHECK (activity_type IN ('lesson_viewed', 'lesson_completed',
                                           'quiz_attempted', 'course_enrolled',
                                           'course_completed')),
  source_id     UUID NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One event per user/date/type/source
  UNIQUE (user_id, activity_date, activity_type, source_id)
);

CREATE INDEX idx_learning_activity_user_id ON learning_activity (user_id);
CREATE INDEX idx_learning_activity_date ON learning_activity (user_id, activity_date DESC);

-- Course view tracking
CREATE TABLE course_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users (id) ON DELETE SET NULL,  -- NULL = anonymous
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_course_views_course_id ON course_views (course_id);
