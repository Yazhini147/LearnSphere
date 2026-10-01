import { Request, Response, NextFunction } from 'express';
import { quizzesService } from './quizzes.service';
import { successResponse } from '../../utils/response';

export async function getQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const quizId = req.params.quizId as string;
    const quiz = await quizzesService.getQuiz(quizId, req.user);
    res.json(successResponse(quiz));
  } catch (err) {
    next(err);
  }
}

export async function createQuizForLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const lessonId = req.params.lessonId as string;
    const quiz = await quizzesService.createQuiz(lessonId, req.user, req.body);
    res.status(201).json(successResponse(quiz));
  } catch (err) {
    next(err);
  }
}

export async function updateQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const quizId = req.params.quizId as string;
    const quiz = await quizzesService.updateQuiz(quizId, req.user, req.body);
    res.json(successResponse(quiz));
  } catch (err) {
    next(err);
  }
}

export async function deleteQuiz(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const quizId = req.params.quizId as string;
    await quizzesService.deleteQuiz(quizId, req.user);
    res.json(successResponse({ message: 'Quiz deleted successfully' }));
  } catch (err) {
    next(err);
  }
}

export async function addQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const quizId = req.params.quizId as string;
    const question = await quizzesService.addQuestion(quizId, req.user, req.body);
    res.status(201).json(successResponse(question));
  } catch (err) {
    next(err);
  }
}

export async function updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const quizId = req.params.quizId as string;
    const questionId = req.params.questionId as string;
    const question = await quizzesService.updateQuestion(quizId, questionId, req.user, req.body);
    res.json(successResponse(question));
  } catch (err) {
    next(err);
  }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const quizId = req.params.quizId as string;
    const questionId = req.params.questionId as string;
    await quizzesService.deleteQuestion(quizId, questionId, req.user);
    res.json(successResponse({ message: 'Question deleted successfully' }));
  } catch (err) {
    next(err);
  }
}

export async function addOption(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const quizId = req.params.quizId as string;
    const questionId = req.params.questionId as string;
    const option = await quizzesService.addOption(quizId, questionId, req.user, req.body);
    res.status(201).json(successResponse(option));
  } catch (err) {
    next(err);
  }
}

export async function updateOption(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const quizId = req.params.quizId as string;
    const questionId = req.params.questionId as string;
    const optionId = req.params.optionId as string;
    const option = await quizzesService.updateOption(quizId, questionId, optionId, req.user, req.body);
    res.json(successResponse(option));
  } catch (err) {
    next(err);
  }
}

export async function deleteOption(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const quizId = req.params.quizId as string;
    const questionId = req.params.questionId as string;
    const optionId = req.params.optionId as string;
    await quizzesService.deleteOption(quizId, questionId, optionId, req.user);
    res.json(successResponse({ message: 'Option deleted successfully' }));
  } catch (err) {
    next(err);
  }
}

export async function submitAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const quizId = req.params.quizId as string;
    const { answers } = req.body;
    const result = await quizzesService.submitAttempt(quizId, answers || [], req.user);
    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function listAttempts(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Error('Unauthenticated');
    const quizId = req.params.quizId as string;
    const attempts = await quizzesService.listAttempts(quizId, req.user);
    res.json(successResponse(attempts));
  } catch (err) {
    next(err);
  }
}

