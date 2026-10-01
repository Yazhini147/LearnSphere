import { pool } from '../../database/pool';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { AuthenticatedUser } from '../../middleware/auth.middleware';

export interface InstructorReportSummary {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  overallCompletionRate: number;
  totalViews: number;
  averageQuizScore: number;
  courseBreakdown: Array<{
    courseId: string;
    courseTitle: string;
    status: string;
    enrolledCount: number;
    completedCount: number;
    completionRate: number;
    viewCount: number;
    lessonCount: number;
  }>;
  recentEnrollments: Array<{
    id: string;
    enrolledAt: string;
    status: string;
    courseId: string;
    courseTitle: string;
    learnerName: string | null;
    learnerEmail: string;
  }>;
}

export interface AdminReportSummary {
  userCounts: {
    total: number;
    learners: number;
    instructors: number;
    admins: number;
  };
  courseCounts: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  learningStats: {
    totalEnrollments: number;
    totalCompletions: number;
    totalLessonsCompleted: number;
    totalQuizzesPassed: number;
  };
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    createdAt: string;
  }>;
  recentRegistrations: Array<{
    id: string;
    email: string;
    role: string;
    displayName: string | null;
    createdAt: string;
  }>;
  topCourses: Array<{
    id: string;
    title: string;
    status: string;
    instructorName: string | null;
    enrollmentCount: number;
    completionCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    activityType: string;
    activityDate: string;
    createdAt: string;
    email: string;
    userName: string | null;
  }>;
}

export class ReportsService {
  /**
   * Analytics for instructors on their taught courses
   */
  async getInstructorReports(instructorId: string): Promise<InstructorReportSummary> {
    // 1. Get all courses taught by this instructor
    const coursesRes = await pool.query(
      `SELECT 
         c.id AS "courseId",
         c.title AS "courseTitle",
         c.status,
         c.view_count AS "viewCount",
         (SELECT COUNT(*)::int FROM lessons l WHERE l.course_id = c.id) AS "lessonCount",
         (SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = c.id) AS "enrolledCount",
         (SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = c.id AND e.status = 'completed') AS "completedCount"
       FROM courses c
       WHERE c.instructor_id = $1
       ORDER BY c.created_at DESC`,
      [instructorId],
    );

    const courses = coursesRes.rows.map((row) => {
      const enr = row.enrolledCount || 0;
      const comp = row.completedCount || 0;
      const completionRate = enr > 0 ? Math.round((comp / enr) * 100) : 0;
      return {
        ...row,
        completionRate,
      };
    });

    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c) => c.status === 'published').length;
    const draftCourses = courses.filter((c) => c.status === 'draft').length;
    const totalEnrollments = courses.reduce((sum, c) => sum + c.enrolledCount, 0);
    const totalCompletions = courses.reduce((sum, c) => sum + c.completedCount, 0);
    const overallCompletionRate =
      totalEnrollments > 0 ? Math.round((totalCompletions / totalEnrollments) * 100) : 0;
    const totalViews = courses.reduce((sum, c) => sum + (c.viewCount || 0), 0);

    // Quiz average score across instructor's courses
    const quizRes = await pool.query(
      `SELECT COALESCE(AVG(qa.percentage), 0)::float AS "avgScore"
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       JOIN lessons l ON q.lesson_id = l.id
       JOIN courses c ON l.course_id = c.id
       WHERE c.instructor_id = $1`,
      [instructorId],
    );
    const averageQuizScore = Math.round(quizRes.rows[0].avgScore || 0);

    // Recent enrollments in instructor's courses
    const enrollmentsRes = await pool.query(
      `SELECT 
         e.id,
         e.enrolled_at AS "enrolledAt",
         e.status,
         c.title AS "courseTitle",
         c.id AS "courseId",
         p.display_name AS "learnerName",
         u.email AS "learnerEmail"
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.user_id = u.id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE c.instructor_id = $1
       ORDER BY e.enrolled_at DESC
       LIMIT 10`,
      [instructorId],
    );

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      totalEnrollments,
      totalCompletions,
      overallCompletionRate,
      totalViews,
      averageQuizScore,
      courseBreakdown: courses,
      recentEnrollments: enrollmentsRes.rows,
    };
  }

  /**
   * System-wide operational reports for administrators
   */
  async getAdminReports(): Promise<AdminReportSummary> {
    // User counts
    const usersRes = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE role = 'learner')::int AS learners,
        COUNT(*) FILTER (WHERE role = 'instructor')::int AS instructors,
        COUNT(*) FILTER (WHERE role = 'admin')::int AS admins
      FROM users
    `);

    // Course counts
    const coursesRes = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'published')::int AS published,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
        COUNT(*) FILTER (WHERE status = 'archived')::int AS archived
      FROM courses
    `);

    // Learning platform activity
    const activityRes = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM enrollments) AS "totalEnrollments",
        (SELECT COUNT(*)::int FROM enrollments WHERE status = 'completed') AS "totalCompletions",
        (SELECT COUNT(*)::int FROM lesson_progress WHERE status = 'completed') AS "totalLessonsCompleted",
        (SELECT COUNT(*)::int FROM quiz_attempts WHERE passed = true) AS "totalQuizzesPassed"
    `);

    // Recent audit logs
    const auditRes = await pool.query(`
      SELECT id, action, entity_type AS "entityType", entity_id AS "entityId", created_at AS "createdAt"
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Recent registrations
    const regRes = await pool.query(`
      SELECT u.id, u.email, u.role, u.created_at AS "createdAt", p.display_name AS "displayName"
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 8
    `);

    // Top courses by enrollment
    const topRes = await pool.query(`
      SELECT c.id, c.title, c.status, p.display_name AS "instructorName",
             COUNT(e.id)::int AS "enrollmentCount",
             COUNT(e.id) FILTER (WHERE e.status = 'completed')::int AS "completionCount"
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      GROUP BY c.id, c.title, c.status, p.display_name
      ORDER BY "enrollmentCount" DESC
      LIMIT 6
    `);

    // Recent activity log
    const recentActRes = await pool.query(`
      SELECT la.id, la.activity_type AS "activityType", la.activity_date AS "activityDate",
             la.created_at AS "createdAt", u.email, p.display_name AS "userName"
      FROM learning_activity la
      JOIN users u ON la.user_id = u.id
      LEFT JOIN profiles p ON p.user_id = u.id
      ORDER BY la.created_at DESC
      LIMIT 8
    `);

    return {
      userCounts: usersRes.rows[0],
      courseCounts: coursesRes.rows[0],
      learningStats: activityRes.rows[0],
      recentAuditLogs: auditRes.rows,
      recentRegistrations: regRes.rows,
      topCourses: topRes.rows,
      recentActivity: recentActRes.rows,
    };
  }

  /**
   * List users for Admin Management
   */
  async listUsers(
    params: { page?: number; pageSize?: number; search?: string; role?: string },
  ): Promise<{ data: any[]; total: number }> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.role && params.role !== 'all') {
      conditions.push(`u.role = $${idx++}`);
      values.push(params.role);
    }

    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push(`(u.email ILIKE $${idx} OR p.display_name ILIKE $${idx})`);
      values.push(term);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM users u LEFT JOIN profiles p ON u.id = p.user_id ${whereClause}`,
      values,
    );
    const total = countRes.rows[0].total;

    values.push(pageSize);
    values.push(offset);

    const usersRes = await pool.query(
      `SELECT 
         u.id,
         u.email,
         u.role,
         u.created_at AS "createdAt",
         p.display_name AS "displayName",
         p.avatar_path AS "avatarPath",
         (SELECT COUNT(*)::int FROM enrollments e WHERE e.user_id = u.id) AS "enrollmentCount",
         (SELECT COUNT(*)::int FROM courses c WHERE c.instructor_id = u.id) AS "coursesTaughtCount"
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    );

    return {
      data: usersRes.rows,
      total,
    };
  }

  /**
   * Change user role (Admin only)
   */
  async updateUserRole(
    targetUserId: string,
    newRole: 'learner' | 'instructor' | 'admin',
    caller: AuthenticatedUser,
  ): Promise<any> {
    if (!['learner', 'instructor', 'admin'].includes(newRole)) {
      throw new BadRequestError('Invalid role specified');
    }

    const userRes = await pool.query('SELECT id, role FROM users WHERE id = $1', [targetUserId]);
    if (userRes.rows.length === 0) throw new NotFoundError('User not found');

    await pool.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [
      newRole,
      targetUserId,
    ]);

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'user.role_change', 'user', $2, $3)`,
      [caller.userId, targetUserId, JSON.stringify({ oldRole: userRes.rows[0].role, newRole })],
    );

    return { userId: targetUserId, role: newRole };
  }
}

export const reportsService = new ReportsService();
