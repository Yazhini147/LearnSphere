import { pool, withTransaction } from '../../database/pool';

export interface GamificationSummary {
  totalPoints: number;
  streakDays: number;
  longestStreak: number;
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  earnedBadgesCount: number;
  totalBadgesCount: number;
  recentTransactions: Array<{
    id: string;
    sourceType: string;
    points: number;
    description: string;
    createdAt: string;
  }>;
  achievements: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    criteriaType: string;
    criteriaValue: number;
    pointsReward: number;
    isUnlocked: boolean;
    earnedAt: string | null;
    currentProgress: number;
  }>;
  badges: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    level: string;
    icon: string | null;
    isEarned: boolean;
    earnedAt: string | null;
  }>;
}

export class GamificationService {
  /**
   * Calculate current and longest consecutive learning streak in days
   */
  async calculateStreaks(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
    const res = await pool.query(
      `SELECT activity_date::text AS "activityDate"
       FROM learning_activity
       WHERE user_id = $1
       GROUP BY activity_date
       ORDER BY activity_date DESC`,
      [userId],
    );

    if (res.rows.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const dates: string[] = res.rows.map((r) => r.activityDate);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // 1. Current streak
    let currentStreak = 0;
    if (dates[0] === todayStr || dates[0] === yesterdayStr) {
      let expected = new Date(dates[0] + 'T00:00:00Z');
      for (const dStr of dates) {
        const actual = new Date(dStr + 'T00:00:00Z');
        const diff = Math.round((expected.getTime() - actual.getTime()) / 86400000);
        if (diff === 0) {
          currentStreak++;
          expected = new Date(actual.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    // 2. Longest streak
    let longestStreak = 1;
    let tempStreak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const d1 = new Date(dates[i] + 'T00:00:00Z');
      const d2 = new Date(dates[i + 1] + 'T00:00:00Z');
      const diff = Math.round((d1.getTime() - d2.getTime()) / 86400000);
      if (diff === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 1;
      }
    }

    return { currentStreak, longestStreak };
  }

  async calculateStreak(userId: string): Promise<number> {
    const { currentStreak } = await this.calculateStreaks(userId);
    return currentStreak;
  }

  /**
   * Automatically check criteria and grant eligible achievements & badges
   */
  async evaluateUserGamification(userId: string): Promise<void> {
    // 1. Gather stats
    const statsRes = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM enrollments WHERE user_id = $1 AND status = 'completed') AS "coursesCompleted",
         (SELECT COUNT(*)::int FROM lesson_progress WHERE user_id = $1 AND status = 'completed') AS "lessonsCompleted",
         (SELECT COUNT(DISTINCT quiz_id)::int FROM quiz_attempts WHERE user_id = $1 AND passed = true) AS "quizzesPassed",
         (SELECT COALESCE(SUM(points), 0)::int FROM point_transactions WHERE user_id = $1) AS "totalPoints",
         (SELECT COUNT(*)::int FROM enrollments WHERE user_id = $1) AS "totalEnrollments"`,
      [userId],
    );
    const stats = statsRes.rows[0];

    // 2. Evaluate all active achievements
    const achRes = await pool.query(
      `SELECT a.id, a.code, a.criteria_type, a.criteria_value, a.points_reward
       FROM achievements a
       WHERE a.is_active = true
         AND NOT EXISTS (
           SELECT 1 FROM user_achievements ua 
           WHERE ua.user_id = $1 AND ua.achievement_id = a.id
         )`,
      [userId],
    );

    for (const ach of achRes.rows) {
      let isEligible = false;
      if (ach.criteria_type === 'first_enrollment' && stats.totalEnrollments >= 1) isEligible = true;
      if (ach.criteria_type === 'first_completion' && stats.coursesCompleted >= 1) isEligible = true;
      if (ach.criteria_type === 'courses_completed' && stats.coursesCompleted >= ach.criteria_value) isEligible = true;
      if (ach.criteria_type === 'lessons_completed' && stats.lessonsCompleted >= ach.criteria_value) isEligible = true;
      if (ach.criteria_type === 'quizzes_passed' && stats.quizzesPassed >= ach.criteria_value) isEligible = true;
      if (ach.criteria_type === 'points_earned' && stats.totalPoints >= ach.criteria_value) isEligible = true;

      if (isEligible) {
        await withTransaction(async (client) => {
          await client.query(
            `INSERT INTO user_achievements (user_id, achievement_id, earned_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT DO NOTHING`,
            [userId, ach.id],
          );

          if (ach.points_reward > 0) {
            await client.query(
              `INSERT INTO point_transactions (user_id, source_type, source_id, points, description)
               VALUES ($1, 'achievement_unlock', $2, $3, $4)
               ON CONFLICT DO NOTHING`,
              [userId, ach.id, ach.points_reward, `Unlocked achievement: ${ach.code}`],
            );
          }
        });
      }
    }

    // 3. Evaluate badges
    const badgeRes = await pool.query(
      `SELECT b.id, b.code, b.criteria_type, b.criteria_value
       FROM badges b
       WHERE NOT EXISTS (
         SELECT 1 FROM user_badges ub 
         WHERE ub.user_id = $1 AND ub.badge_id = b.id
       )`,
      [userId],
    );

    for (const badge of badgeRes.rows) {
      let eligible = false;
      if (badge.criteria_type === 'courses_completed' && stats.coursesCompleted >= badge.criteria_value) eligible = true;
      if (badge.criteria_type === 'lessons_completed' && stats.lessonsCompleted >= badge.criteria_value) eligible = true;
      if (badge.criteria_type === 'points_earned' && stats.totalPoints >= badge.criteria_value) eligible = true;

      if (eligible) {
        await pool.query(
          `INSERT INTO user_badges (user_id, badge_id, earned_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT DO NOTHING`,
          [userId, badge.id],
        );
      }
    }
  }

  /**
   * Get complete gamification profile
   */
  async getGamificationSummary(userId: string): Promise<GamificationSummary> {
    // Run evaluation first to unlock any pending items
    await this.evaluateUserGamification(userId);

    // Total points
    const pointsRes = await pool.query(
      'SELECT COALESCE(SUM(points), 0)::int AS total FROM point_transactions WHERE user_id = $1',
      [userId],
    );
    const totalPoints = pointsRes.rows[0].total;

    // Streaks
    const { currentStreak, longestStreak } = await this.calculateStreaks(userId);
    const streakDays = currentStreak;

    // Recent transactions
    const txRes = await pool.query(
      `SELECT id, source_type AS "sourceType", points, description, created_at AS "createdAt"
       FROM point_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 15`,
      [userId],
    );

    // Stats for progress bar calculation
    const statsRes = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM enrollments WHERE user_id = $1 AND status = 'completed') AS "coursesCompleted",
         (SELECT COUNT(*)::int FROM lesson_progress WHERE user_id = $1 AND status = 'completed') AS "lessonsCompleted",
         (SELECT COUNT(DISTINCT quiz_id)::int FROM quiz_attempts WHERE user_id = $1 AND passed = true) AS "quizzesPassed"`,
      [userId],
    );
    const stats = statsRes.rows[0];

    // Achievements list
    const achSql = `
      SELECT 
        a.id,
        a.code,
        a.name,
        a.description,
        a.icon,
        a.criteria_type AS "criteriaType",
        a.criteria_value AS "criteriaValue",
        a.points_reward AS "pointsReward",
        (ua.achievement_id IS NOT NULL) AS "isUnlocked",
        ua.earned_at AS "earnedAt"
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      WHERE a.is_active = true
      ORDER BY (ua.achievement_id IS NOT NULL) DESC, a.points_reward ASC
    `;
    const achRes = await pool.query(achSql, [userId]);

    const achievements = achRes.rows.map((a) => {
      let currentVal = 0;
      if (a.criteriaType === 'courses_completed') currentVal = stats.coursesCompleted;
      if (a.criteriaType === 'lessons_completed') currentVal = stats.lessonsCompleted;
      if (a.criteriaType === 'quizzes_passed') currentVal = stats.quizzesPassed;
      if (a.criteriaType === 'points_earned') currentVal = totalPoints;
      if (a.criteriaType === 'first_enrollment' || a.criteriaType === 'first_completion') {
        currentVal = a.isUnlocked ? 1 : 0;
      }
      return {
        ...a,
        currentProgress: Math.min(a.criteriaValue, currentVal),
      };
    });

    // Badges list
    const badgeSql = `
      SELECT 
        b.id,
        b.code,
        b.name,
        b.description,
        b.level,
        b.icon,
        (ub.badge_id IS NOT NULL) AS "isEarned",
        ub.earned_at AS "earnedAt"
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
      ORDER BY (ub.badge_id IS NOT NULL) DESC, b.criteria_value ASC
    `;
    const badgeRes = await pool.query(badgeSql, [userId]);

    return {
      totalPoints,
      streakDays,
      longestStreak,
      unlockedAchievementsCount: achievements.filter((a) => a.isUnlocked).length,
      totalAchievementsCount: achievements.length,
      earnedBadgesCount: badgeRes.rows.filter((b) => b.isEarned).length,
      totalBadgesCount: badgeRes.rows.length,
      recentTransactions: txRes.rows,
      achievements,
      badges: badgeRes.rows,
    };
  }
}

export const gamificationService = new GamificationService();
