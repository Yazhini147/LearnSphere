import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/database/pool';

describe('Enrollment, Progress & Quiz Attempts Integration', () => {
  const testEmail = `learner_test_${Date.now()}@learnsphere.dev`;
  let learnerToken = '';
  let enrolledCourseId = '';
  let firstLessonId = '';
  let quizId = '';
  let quizQuestionId = '';
  let correctOptionId = '';

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    await pool.end();
  });

  it('registers a fresh learner account', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: testEmail,
      password: 'FreshPass123!',
      displayName: 'Fresh Test Learner',
    });
    expect(res.status).toBe(201);
    learnerToken = res.body.data.accessToken;
    expect(learnerToken).toBeTruthy();
  });

  it('POST /api/v1/courses/:courseId/enroll enrolls learner into published course', async () => {
    const coursesRes = await request(app).get('/api/v1/courses?pageSize=5');
    expect(coursesRes.status).toBe(200);
    enrolledCourseId = coursesRes.body.data[0].id;

    const enrollRes = await request(app)
      .post(`/api/v1/courses/${enrolledCourseId}/enroll`)
      .set('Authorization', `Bearer ${learnerToken}`);

    expect(enrollRes.status).toBe(201);
    expect(enrollRes.body.data).toHaveProperty('id');
    expect(enrollRes.body.data.courseId).toBe(enrolledCourseId);
    expect(['enrolled', 'in_progress']).toContain(enrollRes.body.data.status);
  });

  it('GET /api/v1/me/enrollments lists active enrollments', async () => {
    const res = await request(app)
      .get('/api/v1/me/enrollments')
      .set('Authorization', `Bearer ${learnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const item = res.body.data.find((e: any) => e.courseId === enrolledCourseId);
    expect(item).toBeTruthy();
    expect(item).toHaveProperty('courseTitle');
    expect(item).toHaveProperty('progressPercent');
    expect(item).toHaveProperty('instructor');
  });

  it('GET /api/v1/me/courses/:courseId/progress returns sequential lesson outline', async () => {
    const res = await request(app)
      .get(`/api/v1/me/courses/${enrolledCourseId}/progress`)
      .set('Authorization', `Bearer ${learnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('courseProgressPercent');
    expect(res.body.data.lessons).toBeInstanceOf(Array);
    expect(res.body.data.lessons.length).toBeGreaterThanOrEqual(1);

    firstLessonId = res.body.data.lessons[0].lessonId;
    expect(firstLessonId).toBeTruthy();
  });

  it('PATCH /api/v1/me/lessons/:lessonId/progress updates video position', async () => {
    const res = await request(app)
      .patch(`/api/v1/me/lessons/${firstLessonId}/progress`)
      .set('Authorization', `Bearer ${learnerToken}`)
      .send({
        currentPositionSeconds: 120,
        progressPercent: 40,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.current_position_seconds).toBe(120);
    expect(Number(res.body.data.progress_percent)).toBe(40);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('POST /api/v1/me/lessons/:lessonId/complete marks lesson completed', async () => {
    const res = await request(app)
      .post(`/api/v1/me/lessons/${firstLessonId}/complete`)
      .set('Authorization', `Bearer ${learnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.lessonId).toBe(firstLessonId);
  });

  it('POST /api/v1/quizzes/:quizId/attempts submits and grades answers', async () => {
    const quizRow = await pool.query(`
      SELECT q.id, qq.id AS question_id, qo.id AS correct_option_id
      FROM quizzes q
      JOIN quiz_questions qq ON q.id = qq.quiz_id
      JOIN quiz_options qo ON qq.id = qo.question_id AND qo.is_correct = true
      LIMIT 1
    `);

    if (quizRow.rows.length > 0) {
      quizId = quizRow.rows[0].id;
      quizQuestionId = quizRow.rows[0].question_id;
      correctOptionId = quizRow.rows[0].correct_option_id;

      const attemptRes = await request(app)
        .post(`/api/v1/quizzes/${quizId}/attempts`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          answers: [
            {
              questionId: quizQuestionId,
              selectedOptionId: correctOptionId,
            },
          ],
        });

      expect(attemptRes.status).toBe(201);
      expect(attemptRes.body.data).toHaveProperty('attemptNumber');
      expect(attemptRes.body.data).toHaveProperty('score');
      expect(attemptRes.body.data).toHaveProperty('passed');

      const listRes = await request(app)
        .get(`/api/v1/quizzes/${quizId}/attempts`)
        .set('Authorization', `Bearer ${learnerToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
    }
  });
});
