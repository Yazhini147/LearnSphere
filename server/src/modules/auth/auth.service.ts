import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/env';
import { pool, queryOne, withTransaction } from '../../database/pool';
import { UnauthorizedError, ConflictError, BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { AccessTokenPayload, UserRole } from '../../middleware/auth.middleware';

const BCRYPT_ROUNDS = 12;

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

// ---- Token helpers ----

function hashRefreshToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateRawRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

function signAccessToken(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string {
  // jwt.sign expects expiresIn as a string (e.g. '15m') or number (seconds)
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as string,
  } as jwt.SignOptions);
}

function getRefreshExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + config.REFRESH_TOKEN_EXPIRES_DAYS);
  return d;
}

// ---- Service ----

export class AuthService {
  async register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    // Check duplicate email
    const existing = await queryOne<UserRecord>(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()],
    );
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    return withTransaction(async (client) => {
      // Insert user
      const userResult = await client.query<UserRecord>(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, 'learner')
         RETURNING id, email, role, is_active`,
        [email.toLowerCase(), passwordHash],
      );
      const user = userResult.rows[0];

      // Insert profile
      await client.query(
        `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)`,
        [user.id, displayName.trim()],
      );

      // Create first session
      const rawRefreshToken = generateRawRefreshToken();
      const tokenHash = hashRefreshToken(rawRefreshToken);
      const expiresAt = getRefreshExpiry();

      await client.query(
        `INSERT INTO sessions (id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), user.id, tokenHash, expiresAt],
      );

      const accessToken = signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role as UserRole,
      });

      return { accessToken, refreshToken: rawRefreshToken, userId: user.id };
    });
  }

  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    const user = await queryOne<UserRecord>(
      'SELECT id, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()],
    );

    // Use constant-time comparison to prevent timing attacks
    const dummyHash = '$2a$12$invalidhashjustforconstanttime1234567890';
    const passwordMatch = await bcrypt.compare(
      password,
      user?.password_hash ?? dummyHash,
    );

    if (!user || !passwordMatch) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new ForbiddenError('Your account has been deactivated');
    }

    const rawRefreshToken = generateRawRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresAt = getRefreshExpiry();

    await pool.query(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), user.id, tokenHash, expiresAt, ipAddress ?? null, userAgent ?? null],
    );

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken, refreshToken: rawRefreshToken, userId: user.id };
  }

  async refresh(rawRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const tokenHash = hashRefreshToken(rawRefreshToken);

    const session = await queryOne<SessionRecord & { user_email: string; user_role: UserRole; user_active: boolean }>(
      `SELECT s.id, s.user_id, s.token_hash, s.expires_at, s.revoked_at,
              u.email as user_email, u.role as user_role, u.is_active as user_active
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1`,
      [tokenHash],
    );

    if (!session) {
      throw new UnauthorizedError('Invalid refresh token', 'TOKEN_INVALID');
    }

    if (session.revoked_at) {
      // Token reuse detected — if revoked more than 15 seconds ago, treat as token theft and revoke all sessions.
      // A brief 15-second window prevents concurrent request races from killing legitimate rotated sessions.
      const revokedAtMs = new Date(session.revoked_at).getTime();
      const elapsedMs = Date.now() - revokedAtMs;
      if (elapsedMs > 15000) {
        await pool.query(
          `UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
          [session.user_id],
        );
      }
      throw new UnauthorizedError('Refresh token has been revoked', 'TOKEN_REVOKED');
    }

    if (new Date(session.expires_at) < new Date()) {
      throw new UnauthorizedError('Refresh token expired', 'TOKEN_EXPIRED');
    }

    if (!session.user_active) {
      throw new ForbiddenError('Account is deactivated');
    }

    // Rotate: revoke old token and issue new one
    const newRawToken = generateRawRefreshToken();
    const newTokenHash = hashRefreshToken(newRawToken);
    const newExpiresAt = getRefreshExpiry();

    await withTransaction(async (client) => {
      // Revoke old session
      await client.query(
        `UPDATE sessions SET revoked_at = NOW() WHERE id = $1`,
        [session.id],
      );
      // Issue new session
      await client.query(
        `INSERT INTO sessions (id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), session.user_id, newTokenHash, newExpiresAt],
      );
    });

    const accessToken = signAccessToken({
      sub: session.user_id,
      email: session.user_email,
      role: session.user_role,
    });

    return { accessToken, refreshToken: newRawToken };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    await pool.query(
      `UPDATE sessions SET revoked_at = NOW()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash],
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentSessionHash: string,
  ): Promise<void> {
    const user = await queryOne<UserRecord>(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [userId],
    );

    if (!user) {
      throw new UnauthorizedError();
    }

    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) {
      throw new BadRequestError('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await withTransaction(async (client) => {
      // Update password
      await client.query(
        `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [newHash, userId],
      );

      // Revoke all sessions EXCEPT the current one
      await client.query(
        `UPDATE sessions SET revoked_at = NOW()
         WHERE user_id = $1 AND token_hash != $2 AND revoked_at IS NULL`,
        [userId, currentSessionHash],
      );
    });
  }

  async getMe(userId: string): Promise<{
    id: string;
    email: string;
    role: UserRole;
    displayName: string;
    avatarPath: string | null;
  } | null> {
    return queryOne(
      `SELECT u.id, u.email, u.role, p.display_name as "displayName", p.avatar_path as "avatarPath"
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.is_active = true`,
      [userId],
    );
  }

  async getProfile(userId: string): Promise<any> {
    const res = await pool.query(
      `SELECT u.id, u.email, u.role, u.created_at AS "createdAt",
              p.display_name AS "displayName", p.bio, p.avatar_path AS "avatarPath"
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [userId],
    );
    if (res.rows.length === 0) throw new NotFoundError('User not found');
    return res.rows[0];
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; bio?: string; avatarPath?: string },
  ): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.displayName !== undefined) {
      updates.push(`display_name = $${idx++}`);
      values.push(data.displayName);
    }
    if (data.bio !== undefined) {
      updates.push(`bio = $${idx++}`);
      values.push(data.bio);
    }
    if (data.avatarPath !== undefined) {
      updates.push(`avatar_path = $${idx++}`);
      values.push(data.avatarPath);
    }

    if (updates.length > 0) {
      values.push(userId);
      await pool.query(
        `UPDATE profiles SET ${updates.join(', ')}, updated_at = NOW() WHERE user_id = $${idx}`,
        values,
      );
    }

    return this.getProfile(userId);
  }
}

export const authService = new AuthService();
