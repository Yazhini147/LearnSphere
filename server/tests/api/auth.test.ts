import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/database/pool';

describe('Auth Endpoints Integration', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const newPassword = 'NewPassword456!';
  const displayName = 'Test User';
  let accessToken = '';
  let refreshCookie = '';

  afterAll(async () => {
    // Cleanup test user
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    await pool.end();
  });

  it('POST /api/v1/auth/register creates user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: testEmail, password: testPassword, displayName });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('userId');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
    expect(cookieStr).toContain('ls_refresh_token');
    expect(cookieStr).toContain('HttpOnly');
    refreshCookie = cookieStr.split(';')[0];
  });

  it('POST /api/v1/auth/login succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    accessToken = res.body.data.accessToken;

    const cookies = res.headers['set-cookie'];
    const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
    refreshCookie = cookieStr.split(';')[0];
  });

  it('GET /api/v1/auth/me returns current user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.displayName).toBe(displayName);
    expect(res.body.data.role).toBe('learner');
  });

  it('POST /api/v1/auth/refresh rotates token and cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    accessToken = res.body.data.accessToken;

    const cookies = res.headers['set-cookie'];
    const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
    expect(cookieStr).toContain('ls_refresh_token');
    refreshCookie = cookieStr.split(';')[0];
  });

  it('POST /api/v1/auth/change-password updates password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', refreshCookie)
      .send({
        currentPassword: testPassword,
        newPassword: newPassword,
        confirmPassword: newPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('Password changed');
  });

  it('POST /api/v1/auth/logout invalidates session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshCookie);

    expect(res.status).toBe(200);

    // Refresh should now fail
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshRes.status).toBe(401);
  });

  it('POST /api/v1/auth/refresh fails when cookie is missing', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });

  it('POST /api/v1/auth/refresh fails when token is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'ls_refresh_token=completely_invalid_random_string_1234567890');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });
});
