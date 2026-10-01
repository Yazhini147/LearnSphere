import { apiClient } from './api-client';
import type { ApiSuccess } from '../types';

export interface EnrolledCourseItem {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  shortDescription: string | null;
  thumbnailPath: string | null;
  level: string;
  estimatedMinutes: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'cancelled';
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

export interface LessonProgressOutline {
  lessonId: string;
  title: string;
  type: 'video' | 'document' | 'image' | 'quiz';
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
  lessons: LessonProgressOutline[];
}

export interface QuizAttemptResult {
  attemptId: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  answers: Array<{
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    pointsAwarded: number;
  }>;
}

export const learningApi = {
  async enroll(courseId: string): Promise<any> {
    const res = await apiClient.post<ApiSuccess<any>>(`/api/v1/courses/${courseId}/enroll`);
    return res.data;
  },

  async getMyEnrollments(): Promise<EnrolledCourseItem[]> {
    const res = await apiClient.get<ApiSuccess<EnrolledCourseItem[]>>('/api/v1/me/enrollments');
    return res.data;
  },

  async getCourseProgress(courseId: string): Promise<CourseProgressDetail> {
    const res = await apiClient.get<ApiSuccess<CourseProgressDetail>>(
      `/api/v1/me/courses/${courseId}/progress`,
    );
    return res.data;
  },

  async updateLessonProgress(
    lessonId: string,
    data: { currentPositionSeconds?: number; progressPercent?: number },
  ): Promise<any> {
    const res = await apiClient.patch<ApiSuccess<any>>(
      `/api/v1/me/lessons/${lessonId}/progress`,
      data,
    );
    return res.data;
  },

  async completeLesson(lessonId: string): Promise<{
    lessonId: string;
    status: string;
    isCourseCompleted: boolean;
  }> {
    const res = await apiClient.post<ApiSuccess<any>>(`/api/v1/me/lessons/${lessonId}/complete`);
    return res.data;
  },

  async submitQuizAttempt(
    quizId: string,
    answers: Array<{ questionId: string; selectedOptionId: string }>,
  ): Promise<QuizAttemptResult> {
    const res = await apiClient.post<ApiSuccess<QuizAttemptResult>>(
      `/api/v1/quizzes/${quizId}/attempts`,
      { answers },
    );
    return res.data;
  },

  async getQuizAttempts(quizId: string): Promise<any[]> {
    const res = await apiClient.get<ApiSuccess<any[]>>(`/api/v1/quizzes/${quizId}/attempts`);
    return res.data;
  },

  async getGamification(): Promise<GamificationData> {
    const res = await apiClient.get<ApiSuccess<GamificationData>>('/api/v1/me/gamification');
    return res.data;
  },
};

export interface GamificationData {
  totalPoints: number;
  streakDays: number;
  longestStreak?: number;
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

