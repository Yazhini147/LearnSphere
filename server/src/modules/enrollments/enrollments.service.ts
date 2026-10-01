import { pool, withTransaction } from '../../database/pool';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors';
import { AuthenticatedUser } from '../../middleware/auth.middleware';

export interface EnrollmentListItem {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  shortDescription: string | null;
  thumbnailPath: string | null;
  level: string;
  estimatedMinutes: number;
  status: string;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  instructor: {
    id: string;
    displayName: string;
    avatarPath: string | null;
  };
}

export interface LessonProgressItem {
  lessonId: string;
  title: string;
  type: string;
  position: number;
  isRequired: boolean;
  durationSeconds: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  currentPositionSeconds: number;
  completedAt: string | null;
}

export interface CourseProgressDetail {
  enrollmentId: string;
  courseId: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  courseProgressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  lessons: LessonProgressItem[];
}

export class EnrollmentsService {
  /**
   * Enroll the authenticated user into a course.
   */
  async enroll(courseId: string, caller: AuthenticatedUser): Promise<any> {
    // Verify course exists
    const courseRes = await pool.query(
      'SELECT id, title, status, instructor_id FROM courses WHERE id = $1',
      [courseId],
    );
    if (courseRes.rows.length === 0) {
      throw new NotFoundError('Course not found');
    }

    const course = courseRes.rows[0];

    // Only allow enrolling in published courses unless instructor owner or admin
    if (
      course.status !== 'published' &&
      caller.role !== 'admin' &&
      caller.userId !== course.instructor_id
    ) {
      throw new BadRequestError('Cannot enroll in an unpublished course');
    }

    let enrollment: any;

    await withTransaction(async (client) => {
      // Upsert enrollment
      const enrollRes = await client.query(
        `INSERT INTO enrollments (user_id, course_id, status, enrolled_at)
         VALUES ($1, $2, 'enrolled', NOW())
         ON CONFLICT (user_id, course_id)
         DO UPDATE SET status = CASE WHEN enrollments.status = 'cancelled' THEN 'enrolled' ELSE enrollments.status END,
                       updated_at = NOW()
         RETURNING id, user_id AS "userId", course_id AS "courseId", status, enrolled_at AS "enrolledAt"`,
        [caller.userId, courseId],
      );
      enrollment = enrollRes.rows[0];

      // Record learning activity
      await client.query(
        `INSERT INTO learning_activity (user_id, activity_date, activity_type, source_id)
         VALUES ($1, CURRENT_DATE, 'course_enrolled', $2)
         ON CONFLICT DO NOTHING`,
        [caller.userId, courseId],
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id)
         VALUES ($1, 'course.enrolled', 'course', $2)`,
        [caller.userId, courseId],
      );

      // Check first enrollment points reward (50 points)
      await client.query(
        `INSERT INTO point_transactions (user_id, source_type, source_id, points, description)
         VALUES ($1, 'first_enrollment', $2, 50, 'Enrolled in first course')
         ON CONFLICT DO NOTHING`,
        [caller.userId, courseId],
      );
    });

    return enrollment;
  }

  /**
   * List all enrollments for the current learner.
   */
  async getMyEnrollments(caller: AuthenticatedUser): Promise<EnrollmentListItem[]> {
    const sql = `
      SELECT 
        e.id,
        e.course_id AS "courseId",
        c.title AS "courseTitle",
        c.slug AS "courseSlug",
        c.short_description AS "shortDescription",
        c.thumbnail_path AS "thumbnailPath",
        c.level,
        c.estimated_minutes AS "estimatedMinutes",
        e.status,
        e.enrolled_at AS "enrolledAt",
        e.started_at AS "startedAt",
        e.completed_at AS "completedAt",
        COALESCE(
          (SELECT COUNT(*)::int FROM lessons l WHERE l.course_id = c.id),
          0
        ) AS "totalLessonsCount",
        COALESCE(
          (SELECT COUNT(*)::int 
           FROM lesson_progress lp 
           WHERE lp.enrollment_id = e.id AND lp.status = 'completed'),
          0
        ) AS "completedLessonsCount",
        json_build_object(
          'id', u.id,
          'displayName', COALESCE(p.display_name, 'Instructor'),
          'avatarPath', p.avatar_path
        ) AS instructor
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE e.user_id = $1 AND e.status != 'cancelled'
      ORDER BY e.updated_at DESC
    `;

    const res = await pool.query(sql, [caller.userId]);

    return res.rows.map((row) => {
      const total = row.totalLessonsCount || 0;
      const completed = row.completedLessonsCount || 0;
      const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        ...row,
        progressPercent,
      };
    });
  }

  /**
   * Get detailed course progress for a learner.
   */
  async getCourseProgress(courseId: string, caller: AuthenticatedUser): Promise<CourseProgressDetail> {
    const enrollRes = await pool.query(
      `SELECT id, status, enrolled_at, started_at, completed_at
       FROM enrollments
       WHERE user_id = $1 AND course_id = $2 AND status != 'cancelled'`,
      [caller.userId, courseId],
    );

    if (enrollRes.rows.length === 0) {
      throw new NotFoundError('Not enrolled in this course');
    }

    const enrollment = enrollRes.rows[0];

    const lessonsSql = `
      SELECT 
        l.id AS "lessonId",
        l.title,
        l.type,
        l.position,
        l.is_required AS "isRequired",
        l.duration_seconds AS "durationSeconds",
        COALESCE(lp.status, 'not_started') AS status,
        COALESCE(lp.progress_percent, 0)::float AS "progressPercent",
        COALESCE(lp.current_position_seconds, 0) AS "currentPositionSeconds",
        lp.completed_at AS "completedAt"
      FROM lessons l
      LEFT JOIN lesson_progress lp 
        ON l.id = lp.lesson_id AND lp.enrollment_id = $1
      WHERE l.course_id = $2
      ORDER BY l.position ASC
    `;

    const lessonsRes = await pool.query(lessonsSql, [enrollment.id, courseId]);
    const lessons: LessonProgressItem[] = lessonsRes.rows;

    const totalLessons = lessons.length;
    const completedLessons = lessons.filter((l) => l.status === 'completed').length;
    const courseProgressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      enrollmentId: enrollment.id,
      courseId,
      status: enrollment.status,
      enrolledAt: enrollment.enrolled_at,
      completedAt: enrollment.completed_at,
      courseProgressPercent,
      completedLessonsCount: completedLessons,
      totalLessonsCount: totalLessons,
      lessons,
    };
  }

  /**
   * Update video/playback position or partial progress.
   */
  async updateLessonProgress(
    lessonId: string,
    data: { currentPositionSeconds?: number; progressPercent?: number },
    caller: AuthenticatedUser,
  ): Promise<any> {
    // Find lesson and course
    const lessonRes = await pool.query(
      'SELECT id, course_id, duration_seconds FROM lessons WHERE id = $1',
      [lessonId],
    );
    if (lessonRes.rows.length === 0) throw new NotFoundError('Lesson not found');
    const lesson = lessonRes.rows[0];

    // Find enrollment
    const enrollRes = await pool.query(
      'SELECT id, status FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [caller.userId, lesson.course_id],
    );
    if (enrollRes.rows.length === 0) {
      throw new ForbiddenError('You are not enrolled in this course');
    }
    const enrollment = enrollRes.rows[0];

    const currentPos = Math.max(0, data.currentPositionSeconds || 0);
    const progressPct = Math.min(100, Math.max(0, data.progressPercent || 0));
    const status = progressPct >= 100 ? 'completed' : progressPct > 0 ? 'in_progress' : 'not_started';

    const sql = `
      INSERT INTO lesson_progress (
        user_id, enrollment_id, lesson_id, status, 
        progress_percent, current_position_seconds, 
        started_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (enrollment_id, lesson_id)
      DO UPDATE SET 
        status = CASE WHEN lesson_progress.status = 'completed' THEN 'completed' ELSE $4 END,
        progress_percent = GREATEST(lesson_progress.progress_percent, $5),
        current_position_seconds = $6,
        updated_at = NOW()
      RETURNING *
    `;

    const res = await pool.query(sql, [
      caller.userId,
      enrollment.id,
      lessonId,
      status,
      progressPct,
      currentPos,
    ]);

    // Ensure enrollment is marked in_progress
    if (enrollment.status === 'enrolled') {
      await pool.query(
        "UPDATE enrollments SET status = 'in_progress', started_at = COALESCE(started_at, NOW()) WHERE id = $1",
        [enrollment.id],
      );
    }

    return res.rows[0];
  }

  /**
   * Mark a lesson as fully completed.
   */
  async completeLesson(lessonId: string, caller: AuthenticatedUser): Promise<any> {
    const lessonRes = await pool.query(
      'SELECT l.id, l.title, l.course_id, c.title AS "courseTitle" FROM lessons l JOIN courses c ON l.course_id = c.id WHERE l.id = $1',
      [lessonId],
    );
    if (lessonRes.rows.length === 0) throw new NotFoundError('Lesson not found');
    const lesson = lessonRes.rows[0];

    const enrollRes = await pool.query(
      'SELECT id, status FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [caller.userId, lesson.course_id],
    );
    if (enrollRes.rows.length === 0) {
      throw new ForbiddenError('You are not enrolled in this course');
    }
    const enrollment = enrollRes.rows[0];

    let isCourseCompleted = false;

    await withTransaction(async (client) => {
      // 1. Mark lesson progress as completed
      await client.query(
        `INSERT INTO lesson_progress (
           user_id, enrollment_id, lesson_id, status, 
           progress_percent, started_at, completed_at, updated_at
         )
         VALUES ($1, $2, $3, 'completed', 100, NOW(), NOW(), NOW())
         ON CONFLICT (enrollment_id, lesson_id)
         DO UPDATE SET 
           status = 'completed',
           progress_percent = 100,
           completed_at = COALESCE(lesson_progress.completed_at, NOW()),
           updated_at = NOW()`,
        [caller.userId, enrollment.id, lessonId],
      );

      // 2. Set enrollment to in_progress if was enrolled
      await client.query(
        `UPDATE enrollments 
         SET status = CASE WHEN status = 'enrolled' THEN 'in_progress' ELSE status END,
             started_at = COALESCE(started_at, NOW()),
             updated_at = NOW()
         WHERE id = $1`,
        [enrollment.id],
      );

      // 3. Record learning activity
      await client.query(
        `INSERT INTO learning_activity (user_id, activity_date, activity_type, source_id)
         VALUES ($1, CURRENT_DATE, 'lesson_completed', $2)
         ON CONFLICT DO NOTHING`,
        [caller.userId, lessonId],
      );

      // 4. Award lesson complete points (10 points)
      await client.query(
        `INSERT INTO point_transactions (user_id, source_type, source_id, points, description)
         VALUES ($1, 'lesson_complete', $2, 10, $3)
         ON CONFLICT DO NOTHING`,
        [caller.userId, lessonId, `Completed lesson: ${lesson.title}`],
      );

      // 5. Check if all required lessons in course are completed
      const pendingRes = await client.query(
        `SELECT COUNT(*)::int AS pending_count
         FROM lessons l
         WHERE l.course_id = $1 
           AND l.is_required = true
           AND NOT EXISTS (
             SELECT 1 FROM lesson_progress lp
             WHERE lp.enrollment_id = $2 
               AND lp.lesson_id = l.id 
               AND lp.status = 'completed'
           )`,
        [lesson.course_id, enrollment.id],
      );

      if (pendingRes.rows[0].pending_count === 0) {
        // Course is now fully completed!
        isCourseCompleted = true;
        await client.query(
          `UPDATE enrollments 
           SET status = 'completed', completed_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [enrollment.id],
        );

        // Course completed activity
        await client.query(
          `INSERT INTO learning_activity (user_id, activity_date, activity_type, source_id)
           VALUES ($1, CURRENT_DATE, 'course_completed', $2)
           ON CONFLICT DO NOTHING`,
          [caller.userId, lesson.course_id],
        );

        // Course completed points (100 points)
        await client.query(
          `INSERT INTO point_transactions (user_id, source_type, source_id, points, description)
           VALUES ($1, 'course_complete', $2, 100, $3)
           ON CONFLICT DO NOTHING`,
          [caller.userId, lesson.course_id, `Completed course: ${lesson.courseTitle}`],
        );
      }
    });

    return {
      lessonId,
      status: 'completed',
      isCourseCompleted,
    };
  }
}
