import { pool, withTransaction } from '../../database/pool';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { buildPaginationMeta, PaginationMeta } from '../../utils/response';
import { AuthenticatedUser } from '../../middleware/auth.middleware';
import { slugify } from '../../utils/helpers';

export interface CourseFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tag?: string;
  level?: string;
  status?: string;
  instructorId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailPath: string | null;
  status: string;
  level: string;
  estimatedMinutes: number;
  viewCount: number;
  createdAt: string;
  publishedAt: string | null;
  instructor: {
    id: string;
    displayName: string;
    avatarPath: string | null;
  };
  tags: Array<{ id: string; name: string; slug: string }>;
  lessonCount: number;
  enrollmentCount: number;
}

export interface CourseDetail extends CourseListItem {
  description: string | null;
  instructor: {
    id: string;
    displayName: string;
    bio: string | null;
    avatarPath: string | null;
  };
  lessons: Array<{
    id: string;
    title: string;
    description: string | null;
    type: string;
    position: number;
    isRequired: boolean;
    durationSeconds: number;
  }>;
  isEnrolled: boolean;
  enrollmentId?: string | null;
  enrollmentStatus?: string | null;
  progressPercent?: number;
}

export class CoursesService {
  async listCourses(
    params: CourseFilterParams,
    caller?: AuthenticatedUser,
  ): Promise<{ data: CourseListItem[]; meta: PaginationMeta }> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const offset = (page - 1) * pageSize;
    const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const sortColumns: Record<string, string> = {
      createdAt: 'c.created_at',
      title: 'c.title',
      estimatedMinutes: 'c.estimated_minutes',
      viewCount: 'c.view_count',
      popular: 'c.view_count',
    };
    const sortColumn = sortColumns[params.sortBy || 'createdAt'] || 'c.created_at';

    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    // Status filter: guests and regular learners only see 'published' courses
    const canSeeNonPublished = caller && (caller.role === 'admin' || caller.role === 'instructor');
    if (!canSeeNonPublished) {
      conditions.push(`c.status = 'published'`);
    } else if (params.status) {
      conditions.push(`c.status = $${paramIdx++}`);
      values.push(params.status);
    }

    // Instructor filter (e.g. for instructor dashboard)
    if (params.instructorId) {
      conditions.push(`c.instructor_id = $${paramIdx++}`);
      values.push(params.instructorId);
    }

    // Level filter
    if (params.level) {
      conditions.push(`c.level = $${paramIdx++}`);
      values.push(params.level);
    }

    // Tag filter (by slug or name)
    if (params.tag) {
      conditions.push(`EXISTS (
        SELECT 1 FROM course_tags ct 
        JOIN tags t ON ct.tag_id = t.id 
        WHERE ct.course_id = c.id AND (t.slug = $${paramIdx} OR t.name ILIKE $${paramIdx})
      )`);
      values.push(params.tag);
      paramIdx++;
    }

    // Search filter: full-text or ILIKE fallback
    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push(`(
        c.title ILIKE $${paramIdx} OR 
        c.short_description ILIKE $${paramIdx} OR 
        c.description ILIKE $${paramIdx}
      )`);
      values.push(term);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countSql = `SELECT COUNT(*)::int AS total FROM courses c ${whereClause}`;
    const countRes = await pool.query(countSql, values);
    const total = countRes.rows[0]?.total || 0;

    // Fetch page rows
    const dataSql = `
      SELECT 
        c.id,
        c.title,
        c.slug,
        c.short_description AS "shortDescription",
        c.thumbnail_path AS "thumbnailPath",
        c.status,
        c.level,
        c.estimated_minutes AS "estimatedMinutes",
        c.view_count AS "viewCount",
        c.created_at AS "createdAt",
        c.published_at AS "publishedAt",
        json_build_object(
          'id', u.id,
          'displayName', COALESCE(p.display_name, 'Instructor'),
          'avatarPath', p.avatar_path
        ) AS instructor,
        COALESCE(
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug))
           FROM course_tags ct
           JOIN tags t ON ct.tag_id = t.id
           WHERE ct.course_id = c.id),
          '[]'::json
        ) AS tags,
        (SELECT COUNT(*)::int FROM lessons l WHERE l.course_id = c.id) AS "lessonCount",
        (SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = c.id) AS "enrollmentCount"
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const dataRes = await pool.query(dataSql, [...values, pageSize, offset]);
    const meta = buildPaginationMeta(page, pageSize, total);

    return { data: dataRes.rows, meta };
  }

  async getCourseById(
    courseIdOrSlug: string,
    caller?: AuthenticatedUser,
    trackView = false,
  ): Promise<CourseDetail> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      courseIdOrSlug,
    );
    const filterCondition = isUuid ? 'c.id = $1' : 'c.slug = $1';

    const courseSql = `
      SELECT 
        c.id,
        c.title,
        c.slug,
        c.short_description AS "shortDescription",
        c.description,
        c.thumbnail_path AS "thumbnailPath",
        c.status,
        c.level,
        c.estimated_minutes AS "estimatedMinutes",
        c.view_count AS "viewCount",
        c.created_at AS "createdAt",
        c.published_at AS "publishedAt",
        c.instructor_id AS "instructorId",
        json_build_object(
          'id', u.id,
          'displayName', COALESCE(p.display_name, 'Instructor'),
          'bio', p.bio,
          'avatarPath', p.avatar_path
        ) AS instructor,
        COALESCE(
          (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug))
           FROM course_tags ct
           JOIN tags t ON ct.tag_id = t.id
           WHERE ct.course_id = c.id),
          '[]'::json
        ) AS tags,
        (SELECT COUNT(*)::int FROM lessons l WHERE l.course_id = c.id) AS "lessonCount",
        (SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = c.id) AS "enrollmentCount"
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE ${filterCondition}
    `;

    const courseRes = await pool.query(courseSql, [courseIdOrSlug]);
    if (courseRes.rows.length === 0) {
      throw new NotFoundError('Course not found');
    }

    const course = courseRes.rows[0];

    // Check visibility permissions
    if (course.status !== 'published') {
      const isOwner = caller && caller.userId === course.instructorId;
      const isAdmin = caller && caller.role === 'admin';
      if (!isOwner && !isAdmin) {
        throw new NotFoundError('Course not found');
      }
    }

    // Fetch lessons outline
    const lessonsSql = `
      SELECT 
        id,
        title,
        description,
        type,
        position,
        is_required AS "isRequired",
        duration_seconds AS "durationSeconds"
      FROM lessons
      WHERE course_id = $1
      ORDER BY position ASC
    `;
    const lessonsRes = await pool.query(lessonsSql, [course.id]);

    // Check enrollment and progress if caller is present
    let isEnrolled = false;
    let enrollmentId: string | null = null;
    let enrollmentStatus: string | null = null;
    let progressPercent = 0;

    if (caller) {
      const enrollSql = `
        SELECT id, status FROM enrollments WHERE user_id = $1 AND course_id = $2
      `;
      const enrollRes = await pool.query(enrollSql, [caller.userId, course.id]);
      if (enrollRes.rows.length > 0) {
        isEnrolled = true;
        enrollmentId = enrollRes.rows[0].id;
        enrollmentStatus = enrollRes.rows[0].status;

        // Calculate progress percentage
        const progressSql = `
          SELECT 
            COUNT(CASE WHEN lp.status = 'completed' THEN 1 END)::float / 
            NULLIF(COUNT(l.id), 0)::float * 100 AS pct
          FROM lessons l
          LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.enrollment_id = $1
          WHERE l.course_id = $2
        `;
        const progRes = await pool.query(progressSql, [enrollmentId, course.id]);
        progressPercent = Math.round(Number(progRes.rows[0]?.pct || 0));
      }
    }

    // Track course view asynchronously if requested
    if (trackView) {
      const userId = caller ? caller.userId : null;
      pool
        .query(
          'INSERT INTO course_views (course_id, user_id, viewed_at) VALUES ($1, $2, NOW())',
          [course.id, userId],
        )
        .catch(() => {});
      pool
        .query('UPDATE courses SET view_count = view_count + 1 WHERE id = $1', [course.id])
        .catch(() => {});
    }

    return {
      ...course,
      lessons: lessonsRes.rows,
      isEnrolled,
      enrollmentId,
      enrollmentStatus,
      progressPercent,
    };
  }

  async createCourse(
    instructorId: string,
    data: {
      title: string;
      shortDescription?: string;
      description?: string;
      level?: string;
      estimatedMinutes?: number;
      tagIds?: string[];
      thumbnailPath?: string;
    },
  ): Promise<CourseDetail> {
    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let count = 1;

    // Check slug uniqueness
    while (true) {
      const existing = await pool.query('SELECT 1 FROM courses WHERE slug = $1', [slug]);
      if (existing.rows.length === 0) break;
      slug = `${baseSlug}-${count++}`;
    }

    const course = await withTransaction(async (client) => {
      const insertSql = `
        INSERT INTO courses (
          title, slug, short_description, description, level, estimated_minutes,
          instructor_id, status, thumbnail_path
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8)
        RETURNING id
      `;
      const res = await client.query(insertSql, [
        data.title,
        slug,
        data.shortDescription || null,
        data.description || null,
        data.level || 'beginner',
        data.estimatedMinutes || 0,
        instructorId,
        data.thumbnailPath || null,
      ]);

      const courseId = res.rows[0].id;

      if (data.tagIds && data.tagIds.length > 0) {
        for (const tagId of data.tagIds) {
          await client.query(
            'INSERT INTO course_tags (course_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [courseId, tagId],
          );
        }
      }

      return courseId;
    });

    return this.getCourseById(course, { userId: instructorId, email: '', role: 'instructor' });
  }

  async updateCourse(
    courseId: string,
    caller: AuthenticatedUser,
    data: {
      title?: string;
      shortDescription?: string;
      description?: string;
      level?: string;
      estimatedMinutes?: number;
      tagIds?: string[];
      thumbnailPath?: string;
    },
  ): Promise<CourseDetail> {
    const existing = await pool.query('SELECT instructor_id FROM courses WHERE id = $1', [courseId]);
    if (existing.rows.length === 0) throw new NotFoundError('Course not found');

    if (caller.role !== 'admin' && existing.rows[0].instructor_id !== caller.userId) {
      throw new ForbiddenError('You do not have permission to edit this course');
    }

    await withTransaction(async (client) => {
      const updates: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (data.title !== undefined) {
        updates.push(`title = $${idx++}`);
        values.push(data.title);
      }
      if (data.shortDescription !== undefined) {
        updates.push(`short_description = $${idx++}`);
        values.push(data.shortDescription);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${idx++}`);
        values.push(data.description);
      }
      if (data.level !== undefined) {
        updates.push(`level = $${idx++}`);
        values.push(data.level);
      }
      if (data.estimatedMinutes !== undefined) {
        updates.push(`estimated_minutes = $${idx++}`);
        values.push(data.estimatedMinutes);
      }
      if (data.thumbnailPath !== undefined) {
        updates.push(`thumbnail_path = $${idx++}`);
        values.push(data.thumbnailPath);
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(courseId);
        await client.query(
          `UPDATE courses SET ${updates.join(', ')} WHERE id = $${idx}`,
          values,
        );
      }

      if (data.tagIds !== undefined) {
        await client.query('DELETE FROM course_tags WHERE course_id = $1', [courseId]);
        for (const tagId of data.tagIds) {
          await client.query(
            'INSERT INTO course_tags (course_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [courseId, tagId],
          );
        }
      }
    });

    return this.getCourseById(courseId, caller);
  }

  async deleteCourse(courseId: string, caller: AuthenticatedUser): Promise<void> {
    const existing = await pool.query('SELECT instructor_id FROM courses WHERE id = $1', [courseId]);
    if (existing.rows.length === 0) throw new NotFoundError('Course not found');

    if (caller.role !== 'admin' && existing.rows[0].instructor_id !== caller.userId) {
      throw new ForbiddenError('You do not have permission to delete this course');
    }

    await pool.query('DELETE FROM courses WHERE id = $1', [courseId]);
  }

  async publishCourse(courseId: string, caller: AuthenticatedUser): Promise<CourseDetail> {
    const existing = await pool.query(
      'SELECT instructor_id, (SELECT COUNT(*)::int FROM lessons WHERE course_id = courses.id) AS lesson_count FROM courses WHERE id = $1',
      [courseId],
    );
    if (existing.rows.length === 0) throw new NotFoundError('Course not found');

    if (caller.role !== 'admin' && existing.rows[0].instructor_id !== caller.userId) {
      throw new ForbiddenError('You do not have permission to publish this course');
    }

    if (existing.rows[0].lesson_count === 0) {
      throw new BadRequestError('Cannot publish a course with 0 lessons. Add at least one lesson first.');
    }

    await pool.query(
      "UPDATE courses SET status = 'published', published_at = NOW(), updated_at = NOW() WHERE id = $1",
      [courseId],
    );

    return this.getCourseById(courseId, caller);
  }

  async unpublishCourse(courseId: string, caller: AuthenticatedUser): Promise<CourseDetail> {
    const existing = await pool.query('SELECT instructor_id FROM courses WHERE id = $1', [courseId]);
    if (existing.rows.length === 0) throw new NotFoundError('Course not found');

    if (caller.role !== 'admin' && existing.rows[0].instructor_id !== caller.userId) {
      throw new ForbiddenError('You do not have permission to unpublish this course');
    }

    await pool.query(
      "UPDATE courses SET status = 'draft', updated_at = NOW() WHERE id = $1",
      [courseId],
    );

    return this.getCourseById(courseId, caller);
  }
}

export const coursesService = new CoursesService();
