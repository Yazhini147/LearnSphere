-- 012_gamification.sql
-- Points ledger, achievements, and badges

-- Append-only point ledger
CREATE TABLE point_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL
                CHECK (source_type IN ('lesson_complete', 'quiz_pass', 'course_complete',
                                       'first_enrollment', 'achievement_unlock', 'streak_bonus')),
  source_id   UUID NOT NULL,  -- ID of the event source (lesson/quiz/course)
  points      INTEGER NOT NULL CHECK (points > 0),
  description VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Idempotency: one point award per user per source event
  UNIQUE (user_id, source_type, source_id)
);

CREATE INDEX idx_point_transactions_user_id ON point_transactions (user_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions (created_at);

-- Achievement definitions
CREATE TABLE achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           VARCHAR(100) UNIQUE NOT NULL,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  icon           VARCHAR(100),
  criteria_type  VARCHAR(50) NOT NULL
                   CHECK (criteria_type IN ('courses_completed', 'lessons_completed',
                                            'quizzes_passed', 'streak_days', 'points_earned',
                                            'first_enrollment', 'first_completion')),
  criteria_value INTEGER NOT NULL DEFAULT 1,
  points_reward  INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true
);

-- User achievement grants (idempotent by unique constraint)
CREATE TABLE user_achievements (
  user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements (id) ON DELETE CASCADE,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements (user_id);

-- Badge definitions
CREATE TABLE badges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           VARCHAR(100) UNIQUE NOT NULL,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  level          VARCHAR(20) NOT NULL DEFAULT 'bronze'
                   CHECK (level IN ('bronze', 'silver', 'gold', 'platinum')),
  criteria_type  VARCHAR(50) NOT NULL,
  criteria_value INTEGER NOT NULL DEFAULT 1,
  icon           VARCHAR(100)
);

-- User badge grants
CREATE TABLE user_badges (
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES badges (id) ON DELETE CASCADE,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges (user_id);
