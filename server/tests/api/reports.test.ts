import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/database/pool';

describe('Reports & User Governance API Integration', () => {
  let adminToken = '';
  let instructorToken = '';

  afterAll(async () => {
    await pool.end();
  });

  it('authenticates admin and instructor', async () => {
    const adminRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@learnsphere.dev',
      password: 'AdminPass123!',
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.accessToken;

    const instRes = await request(app).post('/api/v1/auth/login').send({
      email: 'sarah.instructor@learnsphere.dev',
      password: 'InstructorPass123!',
    });
    expect(instRes.status).toBe(200);
    instructorToken = instRes.body.data.accessToken;
  });

  it('GET /api/v1/instructor/reports returns instructor cohort analytics', async () => {
    const res = await request(app)
      .get('/api/v1/instructor/reports')
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalCourses');
    expect(res.body.data).toHaveProperty('totalEnrollments');
    expect(res.body.data).toHaveProperty('courseBreakdown');
    expect(res.body.data.courseBreakdown).toBeInstanceOf(Array);
  });

  it('GET /api/v1/admin/reports returns platform ecosystem counts', async () => {
    const res = await request(app)
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('userCounts');
    expect(res.body.data.userCounts.total).toBeGreaterThanOrEqual(1);
    expect(res.body.data).toHaveProperty('courseCounts');
    expect(res.body.data).toHaveProperty('learningStats');
    expect(res.body.data).toHaveProperty('recentAuditLogs');
  });

  it('GET /api/v1/admin/users lists users with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users?page=1&pageSize=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('PATCH /api/v1/admin/users/:userId/role modifies role and audits action', async () => {
    // Find a test learner
    const userRes = await pool.query("SELECT id FROM users WHERE role = 'learner' LIMIT 1");
    const testUserId = userRes.rows[0].id;

    const patchRes = await request(app)
      .patch(`/api/v1/admin/users/${testUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'instructor' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.role).toBe('instructor');

    // Revert back
    await pool.query("UPDATE users SET role = 'learner' WHERE id = $1", [testUserId]);
  });
});
