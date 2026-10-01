import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/database/pool';

describe('Courses & Tags API Integration', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('GET /api/v1/tags returns tag list with counts', async () => {
    const res = await request(app).get('/api/v1/tags');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(10);
    const tag = res.body.data[0];
    expect(tag).toHaveProperty('id');
    expect(tag).toHaveProperty('name');
    expect(tag).toHaveProperty('slug');
    expect(tag).toHaveProperty('courseCount');
  });

  it('GET /api/v1/courses returns published courses with pagination', async () => {
    const res = await request(app).get('/api/v1/courses?page=1&pageSize=10');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    // Seed has 6 published courses
    expect(res.body.data.length).toBe(6);
    expect(res.body.meta).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        total: 6,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      }),
    );
    const first = res.body.data[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('instructor');
    expect(first.instructor).toHaveProperty('displayName');
    expect(first).toHaveProperty('tags');
    expect(first).toHaveProperty('lessonCount');
  });

  it('GET /api/v1/courses?search=React filters correctly', async () => {
    const res = await request(app).get('/api/v1/courses?search=React');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.some((c: any) => c.title.includes('React'))).toBe(true);
  });

  it('GET /api/v1/courses?level=beginner returns only beginner courses', async () => {
    const res = await request(app).get('/api/v1/courses?level=beginner');
    expect(res.status).toBe(200);
    expect(res.body.data.every((c: any) => c.level === 'beginner')).toBe(true);
  });

  it('GET /api/v1/courses/:slug returns detailed course and lesson outline', async () => {
    const res = await request(app).get('/api/v1/courses/modern-full-stack-react-typescript');
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Modern Full-Stack React & TypeScript');
    expect(res.body.data.lessons).toBeInstanceOf(Array);
    expect(res.body.data.lessons.length).toBe(6);
    expect(res.body.data.lessons[0].title).toBe('Introduction to React 18 & TypeScript Tooling');
    expect(res.body.data.isEnrolled).toBe(false);
  });

  it('GET /api/v1/courses/:slug hides draft courses from unauthenticated users', async () => {
    const res = await request(app).get('/api/v1/courses/advanced-state-management-patterns');
    expect(res.status).toBe(404);
  });
});
