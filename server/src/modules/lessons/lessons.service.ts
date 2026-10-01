import { pool, withTransaction } from '../../database/pool';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { AuthenticatedUser } from '../../middleware/auth.middleware';

export interface CreateLessonInput {
  title: string;
  description?: string;
  type: 'video' | 'document' | 'image' | 'quiz';
  isRequired?: boolean;
  durationSeconds?: number;
  textContent?: string;
  mediaId?: string;
}

export interface UpdateLessonInput {
  title?: string;
  description?: string;
  type?: 'video' | 'document' | 'image' | 'quiz';
  isRequired?: boolean;
  durationSeconds?: number;
  textContent?: string;
  mediaId?: string;
}

export interface LessonDetail {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  type: string;
  position: number;
  isRequired: boolean;
  durationSeconds: number;
  textContent: string | null;
  mediaId: string | null;
  createdAt: string;
  updatedAt: string;
  quiz?: {
    id: string;
    title: string;
    passingScore: number;
    maxAttempts: number;
    questionCount: number;
  } | null;
}

export class LessonsService {
  private async checkCourseOwnerOrAdmin(courseId: string, caller: AuthenticatedUser): Promise<void> {
    const res = await pool.query('SELECT instructor_id FROM courses WHERE id = $1', [courseId]);
    if (res.rows.length === 0) throw new NotFoundError('Course');
    if (caller.role !== 'admin' && res.rows[0].instructor_id !== caller.userId) {
      throw new ForbiddenError('You do not have permission to manage lessons for this course');
    }
  }

  private async checkLessonOwnerOrAdmin(lessonId: string, caller: AuthenticatedUser): Promise<string> {
    const res = await pool.query(
      `SELECT l.id, l.course_id, c.instructor_id 
       FROM lessons l 
       JOIN courses c ON l.course_id = c.id 
       WHERE l.id = $1`,
      [lessonId],
    );
    if (res.rows.length === 0) throw new NotFoundError('Lesson');
    if (caller.role !== 'admin' && res.rows[0].instructor_id !== caller.userId) {
      throw new ForbiddenError('You do not have permission to manage this lesson');
    }
    return res.rows[0].course_id;
  }

  async listLessons(courseId: string, caller?: AuthenticatedUser): Promise<LessonDetail[]> {
    // Check if course exists and caller has view permission
    const courseRes = await pool.query('SELECT status, instructor_id FROM courses WHERE id = $1', [courseId]);
    if (courseRes.rows.length === 0) throw new NotFoundError('Course');

    const course = courseRes.rows[0];
    if (course.status !== 'published') {
      const isOwner = caller && caller.userId === course.instructor_id;
      const isAdmin = caller && caller.role === 'admin';
      if (!isOwner && !isAdmin) {
        throw new NotFoundError('Course');
      }
    }

    const sql = `
      SELECT 
        l.id,
        l.course_id AS "courseId",
        l.title,
        l.description,
        l.type,
        l.position,
        l.is_required AS "isRequired",
        l.duration_seconds AS "durationSeconds",
        l.text_content AS "textContent",
        l.media_id AS "mediaId",
        l.created_at AS "createdAt",
        l.updated_at AS "updatedAt",
        CASE 
          WHEN q.id IS NOT NULL THEN json_build_object(
            'id', q.id,
            'title', q.title,
            'passingScore', q.passing_score,
            'maxAttempts', q.max_attempts,
            'questionCount', (SELECT COUNT(*)::int FROM quiz_questions WHERE quiz_id = q.id)
          )
          ELSE NULL 
        END AS quiz
      FROM lessons l
      LEFT JOIN quizzes q ON l.id = q.lesson_id
      WHERE l.course_id = $1
      ORDER BY l.position ASC
    `;
    const res = await pool.query(sql, [courseId]);
    return res.rows;
  }

  async getLesson(lessonId: string, caller?: AuthenticatedUser): Promise<LessonDetail> {
    const sql = `
      SELECT 
        l.id,
        l.course_id AS "courseId",
        l.title,
        l.description,
        l.type,
        l.position,
        l.is_required AS "isRequired",
        l.duration_seconds AS "durationSeconds",
        l.text_content AS "textContent",
        l.media_id AS "mediaId",
        l.created_at AS "createdAt",
        l.updated_at AS "updatedAt",
        c.status AS course_status,
        c.instructor_id,
        CASE 
          WHEN q.id IS NOT NULL THEN json_build_object(
            'id', q.id,
            'title', q.title,
            'passingScore', q.passing_score,
            'maxAttempts', q.max_attempts,
            'questionCount', (SELECT COUNT(*)::int FROM quiz_questions WHERE quiz_id = q.id)
          )
          ELSE NULL 
        END AS quiz
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      LEFT JOIN quizzes q ON l.id = q.lesson_id
      WHERE l.id = $1
    `;
    const res = await pool.query(sql, [lessonId]);
    if (res.rows.length === 0) throw new NotFoundError('Lesson');

    const lesson = res.rows[0];
    if (lesson.course_status !== 'published') {
      const isOwner = caller && caller.userId === lesson.instructor_id;
      const isAdmin = caller && caller.role === 'admin';
      if (!isOwner && !isAdmin) {
        throw new NotFoundError('Lesson');
      }
    }

    return lesson;
  }

  async createLesson(
    courseId: string,
    caller: AuthenticatedUser,
    input: CreateLessonInput,
  ): Promise<LessonDetail> {
    await this.checkCourseOwnerOrAdmin(courseId, caller);

    const lessonId = await withTransaction(async (client) => {
      // Find current max position
      const posRes = await client.query(
        'SELECT COALESCE(MAX(position), 0)::int AS max_pos FROM lessons WHERE course_id = $1',
        [courseId],
      );
      const nextPosition = (posRes.rows[0].max_pos || 0) + 1;

      const insertSql = `
        INSERT INTO lessons (
          course_id, title, description, type, position, is_required,
          duration_seconds, text_content, media_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;
      const res = await client.query(insertSql, [
        courseId,
        input.title,
        input.description || null,
        input.type || 'video',
        nextPosition,
        input.isRequired !== undefined ? input.isRequired : true,
        input.durationSeconds || 0,
        input.textContent || null,
        input.mediaId || null,
      ]);

      return res.rows[0].id;
    });

    return this.getLesson(lessonId, caller);
  }

  async updateLesson(
    lessonId: string,
    caller: AuthenticatedUser,
    input: UpdateLessonInput,
  ): Promise<LessonDetail> {
    await this.checkLessonOwnerOrAdmin(lessonId, caller);

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(input.title);
    }
    if (input.description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(input.description);
    }
    if (input.type !== undefined) {
      updates.push(`type = $${idx++}`);
      values.push(input.type);
    }
    if (input.isRequired !== undefined) {
      updates.push(`is_required = $${idx++}`);
      values.push(input.isRequired);
    }
    if (input.durationSeconds !== undefined) {
      updates.push(`duration_seconds = $${idx++}`);
      values.push(input.durationSeconds);
    }
    if (input.textContent !== undefined) {
      updates.push(`text_content = $${idx++}`);
      values.push(input.textContent);
    }
    if (input.mediaId !== undefined) {
      updates.push(`media_id = $${idx++}`);
      values.push(input.mediaId);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(lessonId);
      await pool.query(
        `UPDATE lessons SET ${updates.join(', ')} WHERE id = $${idx}`,
        values,
      );
    }

    return this.getLesson(lessonId, caller);
  }

  async deleteLesson(lessonId: string, caller: AuthenticatedUser): Promise<void> {
    const courseId = await this.checkLessonOwnerOrAdmin(lessonId, caller);

    await withTransaction(async (client) => {
      // Delete the target lesson
      await client.query('DELETE FROM lessons WHERE id = $1', [lessonId]);

      // Re-compact positions of remaining lessons
      const remaining = await client.query(
        'SELECT id FROM lessons WHERE course_id = $1 ORDER BY position ASC',
        [courseId],
      );

      for (let i = 0; i < remaining.rows.length; i++) {
        await client.query('UPDATE lessons SET position = $1 WHERE id = $2', [
          i + 1,
          remaining.rows[i].id,
        ]);
      }
    });
  }

  async reorderLessons(
    courseId: string,
    caller: AuthenticatedUser,
    lessonIds: string[],
  ): Promise<LessonDetail[]> {
    await this.checkCourseOwnerOrAdmin(courseId, caller);

    await withTransaction(async (client) => {
      // Fetch all lessons for this course
      const existing = await client.query(
        'SELECT id FROM lessons WHERE course_id = $1',
        [courseId],
      );

      if (existing.rows.length !== lessonIds.length) {
        throw new BadRequestError('lessonIds array must contain all lessons for the course');
      }

      const existingSet = new Set(existing.rows.map((r) => r.id));
      for (const id of lessonIds) {
        if (!existingSet.has(id)) {
          throw new BadRequestError(`Lesson ${id} does not belong to course ${courseId}`);
        }
      }

      // To avoid unique(course_id, position) collisions during in-place updates,
      // first set positions to a safe temporary positive offset (> 0)
      for (let i = 0; i < lessonIds.length; i++) {
        await client.query('UPDATE lessons SET position = $1 WHERE id = $2', [
          100000 + i,
          lessonIds[i],
        ]);
      }

      // Then assign the final 1-indexed positive positions
      for (let i = 0; i < lessonIds.length; i++) {
        await client.query('UPDATE lessons SET position = $1, updated_at = NOW() WHERE id = $2', [
          i + 1,
          lessonIds[i],
        ]);
      }
    });

    return this.listLessons(courseId, caller);
  }
}

export const lessonsService = new LessonsService();
