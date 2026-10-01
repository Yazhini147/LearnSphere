// Shared TypeScript types used across the client application

export type UserRole = 'learner' | 'instructor' | 'admin';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type LessonType = 'video' | 'document' | 'image' | 'quiz';
export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'cancelled';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

// ---- Auth ----

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatarPath: string | null;
}

// ---- API Response shapes ----

export interface ApiSuccess<T> {
  data: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiList<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ---- User ----

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  displayName: string;
  avatarPath: string | null;
}

// ---- Tag ----

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

// ---- Course ----

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  thumbnailPath: string | null;
  instructorId: string;
  instructorName: string;
  status: CourseStatus;
  level: CourseLevel;
  estimatedMinutes: number;
  viewCount: number;
  lessonCount: number;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  // Learner-specific (only when enrolled)
  enrollmentStatus?: EnrollmentStatus;
  progressPercent?: number;
}

// ---- Lesson ----

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  type: LessonType;
  position: number;
  isRequired: boolean;
  durationSeconds: number;
  textContent: string | null;
  mediaId: string | null;
  createdAt: string;
  updatedAt: string;
  // Learner-specific
  progressStatus?: ProgressStatus;
  progressPercent?: number;
}

// ---- Enrollment ----

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  course: Course;
  progressPercent: number;
}

// ---- Quiz ----

export interface QuizOption {
  id: string;
  optionText: string;
  position: number;
  // is_correct only included for instructors
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  position: number;
  points: number;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  passingScore: number;
  maxAttempts: number;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string | null;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  pointsAwarded: number;
}

// ---- Gamification ----

export interface PointTransaction {
  id: string;
  sourceType: string;
  points: number;
  description: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  pointsReward: number;
  earnedAt: string | null; // null = not earned
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string | null;
  earnedAt: string | null;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

// ---- Reports ----

export interface InstructorReport {
  courseId: string;
  courseTitle: string;
  status: CourseStatus;
  totalEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  lessonCount: number;
}

export interface AdminReport {
  totalUsers: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  recentRegistrations: number; // last 30 days
}
