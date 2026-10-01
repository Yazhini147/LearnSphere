import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/database/pool';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config/env';

describe('Auth Session Persistence & Refresh Architecture', () => {
  const testEmail = `session_test_${Date.now()}@learnsphere.dev`;
  const testPassword = 'Password123!Secure';
  let userId = '';
  let validAccessToken = '';
  let refreshCookie = '';

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    await pool.end();
  });

  it('registers a user and issues an in-memory access token and HttpOnly refresh cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        displayName: 'Session Refresh Tester',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('userId');
    userId = res.body.data.userId;
    validAccessToken = res.body.data.accessToken;

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
    expect(cookieStr).toContain('ls_refresh_token');
    expect(cookieStr).toContain('HttpOnly');
    expect(cookieStr).toContain('Path=/');
    refreshCookie = cookieStr.split(';')[0];
  });

  it('expired access token is rejected by protected endpoints with 401 TOKEN_EXPIRED', async () => {
    // Generate an expired access token signed with the actual secret
    const expiredToken = jwt.sign(
      { sub: userId, email: testEmail, role: 'learner' },
      config.JWT_ACCESS_SECRET,
      { expiresIn: '-1s' },
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('POST /api/v1/auth/refresh restores session from cookie and issues new access token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    const newAccessToken = res.body.data.accessToken;
    expect(newAccessToken).not.toBe(validAccessToken);

    // New access token works for authenticated requests
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${newAccessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(testEmail);

    // Update refresh cookie from rotation
    const cookies = res.headers['set-cookie'];
    const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
    refreshCookie = cookieStr.split(';')[0];
  });

  it('handles concurrent refresh requests safely without server crash or session corruption', async () => {
    // Send two concurrent refresh calls
    const [res1, res2] = await Promise.all([
      request(app).post('/api/v1/auth/refresh').set('Cookie', refreshCookie),
      request(app).post('/api/v1/auth/refresh').set('Cookie', refreshCookie),
    ]);

    // At least one must succeed with 200, and neither should return a 500 server error
    expect([200, 401]).toContain(res1.status);
    expect([200, 401]).toContain(res2.status);
    expect(res1.status === 200 || res2.status === 200).toBe(true);

    const successfulRes = res1.status === 200 ? res1 : res2;
    const cookies = successfulRes.headers['set-cookie'];
    const cookieStr = Array.isArray(cookies) ? cookies.join(';') : cookies;
    refreshCookie = cookieStr.split(';')[0];
  });

  it('explicit logout invalidates the session and subsequent refresh fails with 401', async () => {
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshCookie);

    expect(logoutRes.status).toBe(200);

    // Subsequent refresh attempt must fail
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshRes.status).toBe(401);
  });
});
