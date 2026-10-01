-- 011_quizzes.sql
-- Quiz definitions, questions, options, attempts, and answers

-- Quiz attached to a lesson
CREATE TABLE quizzes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     UUID NOT NULL UNIQUE REFERENCES lessons (id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  instructions  TEXT,
  passing_score NUMERIC(5,2) NOT NULL DEFAULT 70
                  CHECK (passing_score >= 0 AND passing_score <= 100),
  max_attempts  INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Questions ordered within a quiz
CREATE TABLE quiz_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       UUID NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  position      INTEGER NOT NULL CHECK (position > 0),
  points        NUMERIC(6,2) NOT NULL DEFAULT 1 CHECK (points > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (quiz_id, position)
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions (quiz_id);

-- Answer options for each question
CREATE TABLE quiz_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions (id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  position    INTEGER NOT NULL CHECK (position > 0),
  is_correct  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (question_id, position)
);

CREATE INDEX idx_quiz_options_question_id ON quiz_options (question_id);

-- Attempt records (one per submission)
CREATE TABLE quiz_attempts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        UUID NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  enrollment_id  UUID REFERENCES enrollments (id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  score          NUMERIC(8,2) NOT NULL DEFAULT 0,
  max_score      NUMERIC(8,2) NOT NULL DEFAULT 0,
  percentage     NUMERIC(5,2) NOT NULL DEFAULT 0
                   CHECK (percentage >= 0 AND percentage <= 100),
  passed         BOOLEAN NOT NULL DEFAULT false,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at   TIMESTAMPTZ,
  UNIQUE (quiz_id, user_id, attempt_number)
);

CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts (quiz_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts (user_id);

-- Per-question answers within an attempt
CREATE TABLE quiz_answers (
  attempt_id         UUID NOT NULL REFERENCES quiz_attempts (id) ON DELETE CASCADE,
  question_id        UUID NOT NULL REFERENCES quiz_questions (id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES quiz_options (id) ON DELETE SET NULL,
  is_correct         BOOLEAN NOT NULL DEFAULT false,
  points_awarded     NUMERIC(6,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (attempt_id, question_id)
);

CREATE INDEX idx_quiz_answers_attempt_id ON quiz_answers (attempt_id);
