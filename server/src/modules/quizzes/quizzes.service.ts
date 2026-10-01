import { pool, withTransaction } from '../../database/pool';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { AuthenticatedUser } from '../../middleware/auth.middleware';

export interface QuizOptionData {
  id: string;
  questionId: string;
  optionText: string;
  position: number;
  isCorrect?: boolean;
}

export interface QuizQuestionData {
  id: string;
  quizId: string;
  questionText: string;
  position: number;
  points: number;
  options: QuizOptionData[];
}

export interface QuizFullData {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  instructions: string | null;
  passingScore: number;
  maxAttempts: number;
  questions: QuizQuestionData[];
}

export class QuizzesService {
  private async checkQuizOwnerOrAdmin(quizId: string, caller: AuthenticatedUser): Promise<void> {
    const res = await pool.query(
      `SELECT c.instructor_id
       FROM quizzes q
       JOIN lessons l ON q.lesson_id = l.id
       JOIN courses c ON l.course_id = c.id
       WHERE q.id = $1`,
      [quizId],
    );
    if (res.rows.length === 0) throw new NotFoundError('Quiz not found');
    if (caller.role !== 'admin' && res.rows[0].instructor_id !== caller.userId) {
      throw new ForbiddenError('You do not have permission to manage this quiz');
    }
  }

  private async checkLessonOwnerOrAdmin(lessonId: string, caller: AuthenticatedUser): Promise<void> {
    const res = await pool.query(
      `SELECT c.instructor_id
       FROM lessons l
       JOIN courses c ON l.course_id = c.id
       WHERE l.id = $1`,
      [lessonId],
    );
    if (res.rows.length === 0) throw new NotFoundError('Lesson not found');
    if (caller.role !== 'admin' && res.rows[0].instructor_id !== caller.userId) {
      throw new ForbiddenError('You do not have permission to manage quizzes for this lesson');
    }
  }

  async getQuiz(quizId: string, caller?: AuthenticatedUser): Promise<QuizFullData> {
    const quizRes = await pool.query(
      `SELECT 
        q.id,
        q.lesson_id AS "lessonId",
        l.course_id AS "courseId",
        q.title,
        q.instructions,
        q.passing_score::float AS "passingScore",
        q.max_attempts AS "maxAttempts",
        c.instructor_id,
        c.status AS course_status
       FROM quizzes q
       JOIN lessons l ON q.lesson_id = l.id
       JOIN courses c ON l.course_id = c.id
       WHERE q.id = $1`,
      [quizId],
    );

    if (quizRes.rows.length === 0) throw new NotFoundError('Quiz not found');
    const quiz = quizRes.rows[0];

    const isInstructorOrAdmin =
      caller && (caller.role === 'admin' || caller.userId === quiz.instructor_id);

    // If caller is learner/guest and course is not published, forbid
    if (!isInstructorOrAdmin && quiz.course_status !== 'published') {
      throw new NotFoundError('Quiz not found');
    }

    // Fetch questions
    const qSql = `
      SELECT 
        id,
        quiz_id AS "quizId",
        question_text AS "questionText",
        position,
        points::float AS points
      FROM quiz_questions
      WHERE quiz_id = $1
      ORDER BY position ASC
    `;
    const questionsRes = await pool.query(qSql, [quizId]);
    const questions = questionsRes.rows;

    // Fetch options for all questions
    if (questions.length > 0) {
      const qIds = questions.map((q) => q.id);
      const optSql = `
        SELECT 
          id,
          question_id AS "questionId",
          option_text AS "optionText",
          position,
          is_correct AS "isCorrect"
        FROM quiz_options
        WHERE question_id = ANY($1::uuid[])
        ORDER BY position ASC
      `;
      const optRes = await pool.query(optSql, [qIds]);

      const optMap = new Map<string, QuizOptionData[]>();
      for (const opt of optRes.rows) {
        if (!optMap.has(opt.questionId)) optMap.set(opt.questionId, []);

        // CRITICAL: NEVER include is_correct for learners!
        const optionItem: QuizOptionData = {
          id: opt.id,
          questionId: opt.questionId,
          optionText: opt.optionText,
          position: opt.position,
        };
        if (isInstructorOrAdmin) {
          optionItem.isCorrect = opt.isCorrect;
        }
        optMap.get(opt.questionId)!.push(optionItem);
      }

      for (const q of questions) {
        q.options = optMap.get(q.id) || [];
      }
    }

    return {
      id: quiz.id,
      lessonId: quiz.lessonId,
      courseId: quiz.courseId,
      title: quiz.title,
      instructions: quiz.instructions,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      questions,
    };
  }

  async createQuiz(
    lessonId: string,
    caller: AuthenticatedUser,
    data: {
      title: string;
      instructions?: string;
      passingScore?: number;
      maxAttempts?: number;
    },
  ): Promise<QuizFullData> {
    await this.checkLessonOwnerOrAdmin(lessonId, caller);

    // Verify lesson exists and doesn't already have a quiz
    const existing = await pool.query('SELECT id FROM quizzes WHERE lesson_id = $1', [lessonId]);
    if (existing.rows.length > 0) {
      throw new BadRequestError('A quiz already exists for this lesson');
    }

    const insertSql = `
      INSERT INTO quizzes (lesson_id, title, instructions, passing_score, max_attempts)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const res = await pool.query(insertSql, [
      lessonId,
      data.title,
      data.instructions || null,
      data.passingScore !== undefined ? data.passingScore : 70,
      data.maxAttempts !== undefined ? data.maxAttempts : 3,
    ]);

    // Also ensure lesson type is 'quiz'
    await pool.query("UPDATE lessons SET type = 'quiz' WHERE id = $1", [lessonId]);

    return this.getQuiz(res.rows[0].id, caller);
  }

  async updateQuiz(
    quizId: string,
    caller: AuthenticatedUser,
    data: {
      title?: string;
      instructions?: string;
      passingScore?: number;
      maxAttempts?: number;
    },
  ): Promise<QuizFullData> {
    await this.checkQuizOwnerOrAdmin(quizId, caller);

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(data.title);
    }
    if (data.instructions !== undefined) {
      updates.push(`instructions = $${idx++}`);
      values.push(data.instructions);
    }
    if (data.passingScore !== undefined) {
      updates.push(`passing_score = $${idx++}`);
      values.push(data.passingScore);
    }
    if (data.maxAttempts !== undefined) {
      updates.push(`max_attempts = $${idx++}`);
      values.push(data.maxAttempts);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(quizId);
      await pool.query(`UPDATE quizzes SET ${updates.join(', ')} WHERE id = $${idx}`, values);
    }

    return this.getQuiz(quizId, caller);
  }

  async deleteQuiz(quizId: string, caller: AuthenticatedUser): Promise<void> {
    await this.checkQuizOwnerOrAdmin(quizId, caller);
    await pool.query('DELETE FROM quizzes WHERE id = $1', [quizId]);
  }

  // ---- Question CRUD ----

  async addQuestion(
    quizId: string,
    caller: AuthenticatedUser,
    data: { questionText: string; points?: number },
  ): Promise<QuizQuestionData> {
    await this.checkQuizOwnerOrAdmin(quizId, caller);

    return withTransaction(async (client) => {
      const posRes = await client.query(
        'SELECT COALESCE(MAX(position), 0)::int AS max_pos FROM quiz_questions WHERE quiz_id = $1',
        [quizId],
      );
      const position = (posRes.rows[0].max_pos || 0) + 1;

      const res = await client.query(
        `INSERT INTO quiz_questions (quiz_id, question_text, position, points)
         VALUES ($1, $2, $3, $4)
         RETURNING id, quiz_id AS "quizId", question_text AS "questionText", position, points::float AS points`,
        [quizId, data.questionText, position, data.points || 1],
      );

      return { ...res.rows[0], options: [] };
    });
  }

  async updateQuestion(
    quizId: string,
    questionId: string,
    caller: AuthenticatedUser,
    data: { questionText?: string; points?: number },
  ): Promise<QuizQuestionData> {
    await this.checkQuizOwnerOrAdmin(quizId, caller);

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.questionText !== undefined) {
      updates.push(`question_text = $${idx++}`);
      values.push(data.questionText);
    }
    if (data.points !== undefined) {
      updates.push(`points = $${idx++}`);
      values.push(data.points);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(questionId);
      values.push(quizId);
      await pool.query(
        `UPDATE quiz_questions SET ${updates.join(', ')} WHERE id = $${idx++} AND quiz_id = $${idx}`,
        values,
      );
    }

    const res = await pool.query(
      `SELECT id, quiz_id AS "quizId", question_text AS "questionText", position, points::float AS points
       FROM quiz_questions WHERE id = $1`,
      [questionId],
    );
    if (res.rows.length === 0) throw new NotFoundError('Question not found');
    return res.rows[0];
  }

  async deleteQuestion(
    quizId: string,
    questionId: string,
    caller: AuthenticatedUser,
  ): Promise<void> {
    await this.checkQuizOwnerOrAdmin(quizId, caller);

    await withTransaction(async (client) => {
      await client.query('DELETE FROM quiz_questions WHERE id = $1 AND quiz_id = $2', [
        questionId,
        quizId,
      ]);

      // Re-compact question positions
      const remaining = await client.query(
        'SELECT id FROM quiz_questions WHERE quiz_id = $1 ORDER BY position ASC',
        [quizId],
      );
      for (let i = 0; i < remaining.rows.length; i++) {
        await client.query('UPDATE quiz_questions SET position = $1 WHERE id = $2', [
          i + 1,
          remaining.rows[i].id,
        ]);
      }
    });
  }

  // ---- Option CRUD ----

  async addOption(
    quizId: string,
    questionId: string,
    caller: AuthenticatedUser,
    data: { optionText: string; isCorrect?: boolean },
  ): Promise<QuizOptionData> {
    await this.checkQuizOwnerOrAdmin(quizId, caller);

    return withTransaction(async (client) => {
      const posRes = await client.query(
        'SELECT COALESCE(MAX(position), 0)::int AS max_pos FROM quiz_options WHERE question_id = $1',
        [questionId],
      );
      const position = (posRes.rows[0].max_pos || 0) + 1;

      const res = await client.query(
        `INSERT INTO quiz_options (question_id, option_text, position, is_correct)
         VALUES ($1, $2, $3, $4)
         RETURNING id, question_id AS "questionId", option_text AS "optionText", position, is_correct AS "isCorrect"`,
        [questionId, data.optionText, position, data.isCorrect || false],
      );

      return res.rows[0];
    });
  }

  async updateOption(
    quizId: string,
    questionId: string,
    optionId: string,
    caller: AuthenticatedUser,
    data: { optionText?: string; isCorrect?: boolean },
  ): Promise<QuizOptionData> {
    await this.checkQuizOwnerOrAdmin(quizId, caller);

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.optionText !== undefined) {
      updates.push(`option_text = $${idx++}`);
      values.push(data.optionText);
    }
    if (data.isCorrect !== undefined) {
      updates.push(`is_correct = $${idx++}`);
      values.push(data.isCorrect);
    }

    if (updates.length > 0) {
      values.push(optionId);
      values.push(questionId);
      await pool.query(
        `UPDATE quiz_options SET ${updates.join(', ')} WHERE id = $${idx++} AND question_id = $${idx}`,
        values,
      );
    }

    const res = await pool.query(
      `SELECT id, question_id AS "questionId", option_text AS "optionText", position, is_correct AS "isCorrect"
       FROM quiz_options WHERE id = $1`,
      [optionId],
    );
    if (res.rows.length === 0) throw new NotFoundError('Option not found');
    return res.rows[0];
  }

  async deleteOption(
    quizId: string,
    questionId: string,
    optionId: string,
    caller: AuthenticatedUser,
  ): Promise<void> {
    await this.checkQuizOwnerOrAdmin(quizId, caller);

    await withTransaction(async (client) => {
      await client.query('DELETE FROM quiz_options WHERE id = $1 AND question_id = $2', [
        optionId,
        questionId,
      ]);

      const remaining = await client.query(
        'SELECT id FROM quiz_options WHERE question_id = $1 ORDER BY position ASC',
        [questionId],
      );
      for (let i = 0; i < remaining.rows.length; i++) {
        await client.query('UPDATE quiz_options SET position = $1 WHERE id = $2', [
          i + 1,
          remaining.rows[i].id,
        ]);
      }
    });
  }

  /**
   * Submit an attempt for a quiz
   */
  async submitAttempt(
    quizId: string,
    answers: Array<{ questionId: string; selectedOptionId: string }>,
    caller: AuthenticatedUser,
  ): Promise<any> {
    const quizRes = await pool.query(
      `SELECT q.id, q.lesson_id, q.title, q.passing_score AS "passingScore", 
              q.max_attempts AS "maxAttempts", l.course_id AS "courseId"
       FROM quizzes q
       JOIN lessons l ON q.lesson_id = l.id
       WHERE q.id = $1`,
      [quizId],
    );
    if (quizRes.rows.length === 0) throw new NotFoundError('Quiz not found');
    const quiz = quizRes.rows[0];

    // Find enrollment
    const enrollRes = await pool.query(
      `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status != 'cancelled'`,
      [caller.userId, quiz.courseId],
    );
    const enrollmentId = enrollRes.rows.length > 0 ? enrollRes.rows[0].id : null;

    // Check attempts count
    const attemptsCountRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2',
      [quizId, caller.userId],
    );
    const attemptCount = attemptsCountRes.rows[0].count;
    if (attemptCount >= quiz.maxAttempts) {
      throw new BadRequestError(`Maximum attempts (${quiz.maxAttempts}) reached for this quiz`);
    }

    const attemptNumber = attemptCount + 1;

    // Fetch questions and correct options
    const questionsRes = await pool.query(
      `SELECT 
         q.id,
         q.question_text AS "questionText",
         q.points,
         o.id AS "correctOptionId"
       FROM quiz_questions q
       LEFT JOIN quiz_options o ON q.id = o.question_id AND o.is_correct = true
       WHERE q.quiz_id = $1
       ORDER BY q.position ASC`,
      [quizId],
    );
    const questions = questionsRes.rows;

    let totalPoints = 0;
    let earnedPoints = 0;
    const answerRecords: Array<{
      questionId: string;
      selectedOptionId: string | null;
      isCorrect: boolean;
      pointsAwarded: number;
    }> = [];

    const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));

    for (const q of questions) {
      const qPoints = Number(q.points) || 1;
      totalPoints += qPoints;

      const selectedOptId = answerMap.get(q.id) || null;
      const isCorrect = selectedOptId !== null && selectedOptId === q.correctOptionId;
      const pointsAwarded = isCorrect ? qPoints : 0;

      earnedPoints += pointsAwarded;
      answerRecords.push({
        questionId: q.id,
        selectedOptionId: selectedOptId,
        isCorrect,
        pointsAwarded,
      });
    }

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= Number(quiz.passingScore);

    let attemptId = '';

    await withTransaction(async (client) => {
      // 1. Create quiz attempt
      const attemptInsert = await client.query(
        `INSERT INTO quiz_attempts (
           quiz_id, user_id, enrollment_id, attempt_number, 
           score, max_score, percentage, passed, submitted_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING id`,
        [
          quizId,
          caller.userId,
          enrollmentId,
          attemptNumber,
          earnedPoints,
          totalPoints,
          percentage,
          passed,
        ],
      );
      attemptId = attemptInsert.rows[0].id;

      // 2. Insert quiz answers
      for (const ans of answerRecords) {
        await client.query(
          `INSERT INTO quiz_answers (
             attempt_id, question_id, selected_option_id, is_correct, points_awarded
           )
           VALUES ($1, $2, $3, $4, $5)`,
          [attemptId, ans.questionId, ans.selectedOptionId, ans.isCorrect, ans.pointsAwarded],
        );
      }

      // 3. Record learning activity
      await client.query(
        `INSERT INTO learning_activity (user_id, activity_date, activity_type, source_id)
         VALUES ($1, CURRENT_DATE, 'quiz_attempted', $2)
         ON CONFLICT DO NOTHING`,
        [caller.userId, quizId],
      );

      // 4. If passed and enrolled, update lesson progress and award points
      if (passed && enrollmentId) {
        await client.query(
          `INSERT INTO lesson_progress (
             user_id, enrollment_id, lesson_id, status, progress_percent, completed_at, updated_at
           )
           VALUES ($1, $2, $3, 'completed', 100, NOW(), NOW())
           ON CONFLICT (enrollment_id, lesson_id)
           DO UPDATE SET status = 'completed', progress_percent = 100, completed_at = NOW(), updated_at = NOW()`,
          [caller.userId, enrollmentId, quiz.lesson_id],
        );

        // Award quiz pass points (25 pts)
        await client.query(
          `INSERT INTO point_transactions (user_id, source_type, source_id, points, description)
           VALUES ($1, 'quiz_pass', $2, 25, $3)
           ON CONFLICT DO NOTHING`,
          [caller.userId, quizId, `Passed quiz: ${quiz.title}`],
        );
      }
    });

    return {
      attemptId,
      attemptNumber,
      score: earnedPoints,
      maxScore: totalPoints,
      percentage,
      passed,
      passingScore: Number(quiz.passingScore),
      answers: answerRecords,
    };
  }

  /**
   * List caller's attempts for a quiz
   */
  async listAttempts(quizId: string, caller: AuthenticatedUser): Promise<any[]> {
    const res = await pool.query(
      `SELECT 
         id,
         attempt_number AS "attemptNumber",
         score,
         max_score AS "maxScore",
         percentage,
         passed,
         started_at AS "startedAt",
         submitted_at AS "submittedAt"
       FROM quiz_attempts
       WHERE quiz_id = $1 AND user_id = $2
       ORDER BY attempt_number DESC`,
      [quizId, caller.userId],
    );
    return res.rows;
  }
}

export const quizzesService = new QuizzesService();
