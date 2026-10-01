import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/database/pool';

describe('Authoring APIs Integration (Courses, Lessons, Quizzes)', () => {
  let instructorToken = '';
  let learnerToken = '';
  let createdCourseId = '';
  let createdLessonId1 = '';
  let createdLessonId2 = '';
  let createdQuizId = '';
  let createdQuestionId = '';
  let createdOptionId = '';

  beforeAll(async () => {
    // Login as Sarah Instructor
    const instRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'sarah.instructor@learnsphere.dev', password: 'InstructorPass123!' });
    instructorToken = instRes.body.data.accessToken;

    // Login as Alex Learner
    const lrnRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alex.learner@learnsphere.dev', password: 'LearnerPass123!' });
    learnerToken = lrnRes.body.data.accessToken;
  });

  afterAll(async () => {
    if (createdCourseId) {
      await pool.query('DELETE FROM courses WHERE id = $1', [createdCourseId]);
    }
    await pool.end();
  });

  it('POST /api/v1/courses creates draft course', async () => {
    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Full-Stack Integration Testing Mastery',
        shortDescription: 'Hands-on guide to testing node and react.',
        level: 'intermediate',
        estimatedMinutes: 90,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.title).toBe('Full-Stack Integration Testing Mastery');
    createdCourseId = res.body.data.id;
  });

  it('POST /api/v1/courses/:courseId/publish fails if course has 0 lessons', async () => {
    const res = await request(app)
      .post(`/api/v1/courses/${createdCourseId}/publish`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('0 lessons');
  });

  it('POST /api/v1/courses/:courseId/lessons adds lessons', async () => {
    // Lesson 1
    const res1 = await request(app)
      .post(`/api/v1/courses/${createdCourseId}/lessons`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Setting up Vitest & Supertest',
        type: 'document',
        durationSeconds: 600,
        textContent: 'Configuring test runners.',
      });
    expect(res1.status).toBe(201);
    expect(res1.body.data.position).toBe(1);
    createdLessonId1 = res1.body.data.id;

    // Lesson 2
    const res2 = await request(app)
      .post(`/api/v1/courses/${createdCourseId}/lessons`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Writing End-to-End API Specs',
        type: 'video',
        durationSeconds: 1200,
      });
    expect(res2.status).toBe(201);
    expect(res2.body.data.position).toBe(2);
    createdLessonId2 = res2.body.data.id;
  });

  it('POST /api/v1/courses/:courseId/lessons/reorder atomically swaps lesson positions', async () => {
    const res = await request(app)
      .post(`/api/v1/courses/${createdCourseId}/lessons/reorder`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        lessonIds: [createdLessonId2, createdLessonId1],
      });

    expect(res.status).toBe(200);
    expect(res.body.data[0].id).toBe(createdLessonId2);
    expect(res.body.data[0].position).toBe(1);
    expect(res.body.data[1].id).toBe(createdLessonId1);
    expect(res.body.data[1].position).toBe(2);
  });

  it('POST /api/v1/courses/:courseId/publish succeeds once lessons exist', async () => {
    const res = await request(app)
      .post(`/api/v1/courses/${createdCourseId}/publish`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('published');
    expect(res.body.data.publishedAt).toBeDefined();
  });

  it('POST /api/v1/lessons/:lessonId/quiz creates quiz for lesson', async () => {
    const res = await request(app)
      .post(`/api/v1/lessons/${createdLessonId1}/quiz`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Testing Knowledge Evaluation',
        instructions: 'Pass with at least 80%',
        passingScore: 80,
        maxAttempts: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Testing Knowledge Evaluation');
    expect(res.body.data.passingScore).toBe(80);
    createdQuizId = res.body.data.id;
  });

  it('POST /api/v1/quizzes/:quizId/questions and options CRUD', async () => {
    // Add question
    const qRes = await request(app)
      .post(`/api/v1/quizzes/${createdQuizId}/questions`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        questionText: 'What is Supertest primarily used for?',
        points: 2,
      });
    expect(qRes.status).toBe(201);
    expect(qRes.body.data.points).toBe(2);
    createdQuestionId = qRes.body.data.id;

    // Add option 1 (correct)
    const optRes1 = await request(app)
      .post(`/api/v1/quizzes/${createdQuizId}/questions/${createdQuestionId}/options`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        optionText: 'Testing HTTP endpoints on an Express application without binding to a network port',
        isCorrect: true,
      });
    expect(optRes1.status).toBe(201);
    expect(optRes1.body.data.isCorrect).toBe(true);
    createdOptionId = optRes1.body.data.id;

    // Add option 2 (incorrect)
    const optRes2 = await request(app)
      .post(`/api/v1/quizzes/${createdQuizId}/questions/${createdQuestionId}/options`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        optionText: 'Compiling SCSS to CSS stylesheets',
        isCorrect: false,
      });
    expect(optRes2.status).toBe(201);
  });

  it('GET /api/v1/quizzes/:quizId returns isCorrect for instructor and STRIPS it for learner', async () => {
    // Instructor view
    const instView = await request(app)
      .get(`/api/v1/quizzes/${createdQuizId}`)
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(instView.status).toBe(200);
    expect(instView.body.data.questions[0].options[0]).toHaveProperty('isCorrect');

    // Learner view
    const lrnView = await request(app)
      .get(`/api/v1/quizzes/${createdQuizId}`)
      .set('Authorization', `Bearer ${learnerToken}`);
    expect(lrnView.status).toBe(200);
    expect(lrnView.body.data.questions[0].options[0].isCorrect).toBeUndefined();
  });
});
