-- 004_profiles.sql
-- Extended user profile (1:1 with users)

CREATE TABLE profiles (
  user_id      UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL DEFAULT '',
  bio          TEXT,
  avatar_path  VARCHAR(500),
  language     VARCHAR(10) NOT NULL DEFAULT 'en',
  timezone     VARCHAR(100) NOT NULL DEFAULT 'UTC',
  theme        VARCHAR(20) NOT NULL DEFAULT 'light'
                 CHECK (theme IN ('light', 'dark', 'system')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
