import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/database/pool';

describe('Profile & Settings API Integration', () => {
  let learnerToken = '';
  let learnerUserId = '';

  afterAll(async () => {
    await pool.end();
  });

  it('authenticates learner', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'alex.learner@learnsphere.dev',
      password: 'LearnerPass123!',
    });
    expect(res.status).toBe(200);
    learnerToken = res.body.data.accessToken;
    learnerUserId = res.body.data.userId;
  });

  it('GET /api/v1/auth/profile returns user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${learnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('email');
    expect(res.body.data).toHaveProperty('displayName');
    expect(res.body.data).toHaveProperty('role');
    expect(res.body.data.role).toBe('learner');
  });

  it('PATCH /api/v1/auth/profile updates display name and bio', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({
        displayName: 'Alex Learner Updated',
        bio: 'Aspiring distributed systems and backend engineer.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe('Alex Learner Updated');
    expect(res.body.data.bio).toBe('Aspiring distributed systems and backend engineer.');

    // Revert
    await pool.query("UPDATE profiles SET display_name = 'Alex Rivera' WHERE user_id = $1", [
      learnerUserId,
    ]);
  });
});
