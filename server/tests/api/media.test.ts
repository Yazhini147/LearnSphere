import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/database/pool';

describe('Media Upload API Integration', () => {
  let instructorToken = '';
  let uploadedMediaId = '';

  afterAll(async () => {
    if (uploadedMediaId) {
      await pool.query('DELETE FROM media_files WHERE id = $1', [uploadedMediaId]);
    }
    await pool.end();
  });

  it('authenticates instructor', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'sarah.instructor@learnsphere.dev',
      password: 'InstructorPass123!',
    });
    expect(res.status).toBe(200);
    instructorToken = res.body.data.accessToken;
  });

  it('POST /api/v1/media/upload uploads file and stores metadata', async () => {
    const dummyBuffer = Buffer.from('fake image content for testing');

    const res = await request(app)
      .post('/api/v1/media/upload')
      .set('Authorization', `Bearer ${instructorToken}`)
      .attach('file', dummyBuffer, 'test-image.png');

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('url');
    expect(res.body.data.url).toContain('/uploads/');
    expect(res.body.data.originalName).toBe('test-image.png');
    expect(res.body.data.mimeType).toBe('image/png');

    uploadedMediaId = res.body.data.id;
  });

  it('GET /api/v1/media/:mediaId retrieves metadata', async () => {
    const res = await request(app).get(`/api/v1/media/${uploadedMediaId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(uploadedMediaId);
    expect(res.body.data.originalName).toBe('test-image.png');
  });

  it('DELETE /api/v1/media/:mediaId deletes file and metadata', async () => {
    const res = await request(app)
      .delete(`/api/v1/media/${uploadedMediaId}`)
      .set('Authorization', `Bearer ${instructorToken}`);
    expect(res.status).toBe(200);

    const getRes = await request(app).get(`/api/v1/media/${uploadedMediaId}`);
    expect(getRes.status).toBe(404);
    uploadedMediaId = '';
  });
});
