import { Router } from 'express';
import {
  getQuiz,
  createQuizForLesson,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  addOption,
  updateOption,
  deleteOption,
  submitAttempt,
  listAttempts,
} from './quizzes.controller';
import { optionalAuth, authenticateToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();

// Retrieve quiz (both learners & instructors, learner gets is_correct stripped)
router.get('/:quizId', optionalAuth, getQuiz);

// Quiz attempts (learners)
router.post('/:quizId/attempts', authenticateToken, submitAttempt);
router.get('/:quizId/attempts', authenticateToken, listAttempts);

// Quiz metadata CRUD (instructor / admin)
router.patch('/:quizId', authenticateToken, requireRole('instructor', 'admin'), updateQuiz);
router.delete('/:quizId', authenticateToken, requireRole('instructor', 'admin'), deleteQuiz);

// Questions CRUD
router.post('/:quizId/questions', authenticateToken, requireRole('instructor', 'admin'), addQuestion);
router.patch(
  '/:quizId/questions/:questionId',
  authenticateToken,
  requireRole('instructor', 'admin'),
  updateQuestion,
);
router.delete(
  '/:quizId/questions/:questionId',
  authenticateToken,
  requireRole('instructor', 'admin'),
  deleteQuestion,
);

// Options CRUD
router.post(
  '/:quizId/questions/:questionId/options',
  authenticateToken,
  requireRole('instructor', 'admin'),
  addOption,
);
router.patch(
  '/:quizId/questions/:questionId/options/:optionId',
  authenticateToken,
  requireRole('instructor', 'admin'),
  updateOption,
);
router.delete(
  '/:quizId/questions/:questionId/options/:optionId',
  authenticateToken,
  requireRole('instructor', 'admin'),
  deleteOption,
);

export { createQuizForLesson };
export default router;
