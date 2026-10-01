import { apiClient } from './api-client';
import type { ApiList, ApiSuccess, PaginationMeta, CourseLevel } from '../types';

export interface TagWithCount {
  id: string;
  name: string;
  slug: string;
  courseCount: number;
}

export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailPath: string | null;
  status: string;
  level: CourseLevel;
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

export interface CourseLessonItem {
  id: string;
  title: string;
  description: string | null;
  type: 'video' | 'document' | 'image' | 'quiz';
  position: number;
  isRequired: boolean;
  durationSeconds: number;
}

export interface CourseDetail extends CourseListItem {
  description: string | null;
  instructor: {
    id: string;
    displayName: string;
    bio: string | null;
    avatarPath: string | null;
  };
  lessons: CourseLessonItem[];
  isEnrolled: boolean;
  enrollmentId?: string | null;
  enrollmentStatus?: string | null;
  progressPercent?: number;
}

export interface CourseFilterQuery {
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

export const courseApi = {
  async getCourses(params: CourseFilterQuery = {}): Promise<{ data: CourseListItem[]; meta: PaginationMeta }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.search) query.set('search', params.search);
    if (params.tag) query.set('tag', params.tag);
    if (params.level) query.set('level', params.level);
    if (params.status) query.set('status', params.status);
    if (params.instructorId) query.set('instructorId', params.instructorId);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    const qs = query.toString();
    const url = `/api/v1/courses${qs ? `?${qs}` : ''}`;
    const res = await apiClient.get<ApiList<CourseListItem>>(url);
    return { data: res.data, meta: res.meta };
  },

  async getCourse(idOrSlug: string): Promise<CourseDetail> {
    const res = await apiClient.get<ApiSuccess<CourseDetail>>(`/api/v1/courses/${encodeURIComponent(idOrSlug)}`);
    return res.data;
  },

  async getTags(): Promise<TagWithCount[]> {
    const res = await apiClient.get<ApiSuccess<TagWithCount[]>>('/api/v1/tags');
    return res.data;
  },

  // Authoring: Courses
  async createCourse(data: {
    title: string;
    shortDescription?: string;
    description?: string;
    level?: string;
    estimatedMinutes?: number;
    tagIds?: string[];
  }): Promise<CourseDetail> {
    const res = await apiClient.post<ApiSuccess<CourseDetail>>('/api/v1/courses', data);
    return res.data;
  },

  async updateCourse(
    courseId: string,
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
    const res = await apiClient.patch<ApiSuccess<CourseDetail>>(`/api/v1/courses/${courseId}`, data);
    return res.data;
  },

  async deleteCourse(courseId: string): Promise<void> {
    await apiClient.delete(`/api/v1/courses/${courseId}`);
  },

  async publishCourse(courseId: string): Promise<CourseDetail> {
    const res = await apiClient.post<ApiSuccess<CourseDetail>>(`/api/v1/courses/${courseId}/publish`);
    return res.data;
  },

  async unpublishCourse(courseId: string): Promise<CourseDetail> {
    const res = await apiClient.post<ApiSuccess<CourseDetail>>(`/api/v1/courses/${courseId}/unpublish`);
    return res.data;
  },

  // Authoring: Lessons
  async getCourseLessons(courseId: string): Promise<CourseLessonItem[]> {
    const res = await apiClient.get<ApiSuccess<CourseLessonItem[]>>(`/api/v1/courses/${courseId}/lessons`);
    return res.data;
  },

  async getLesson(lessonId: string): Promise<any> {
    const res = await apiClient.get<ApiSuccess<any>>(`/api/v1/lessons/${lessonId}`);
    return res.data;
  },

  async createLesson(
    courseId: string,
    data: {
      title: string;
      description?: string;
      type: 'video' | 'document' | 'image' | 'quiz';
      isRequired?: boolean;
      durationSeconds?: number;
      textContent?: string;
    },
  ): Promise<CourseLessonItem> {
    const res = await apiClient.post<ApiSuccess<CourseLessonItem>>(`/api/v1/courses/${courseId}/lessons`, data);
    return res.data;
  },

  async updateLesson(
    lessonId: string,
    data: {
      title?: string;
      description?: string;
      type?: 'video' | 'document' | 'image' | 'quiz';
      isRequired?: boolean;
      durationSeconds?: number;
      textContent?: string;
    },
  ): Promise<CourseLessonItem> {
    const res = await apiClient.patch<ApiSuccess<CourseLessonItem>>(`/api/v1/lessons/${lessonId}`, data);
    return res.data;
  },

  async deleteLesson(lessonId: string): Promise<void> {
    await apiClient.delete(`/api/v1/lessons/${lessonId}`);
  },

  async reorderLessons(courseId: string, lessonIds: string[]): Promise<CourseLessonItem[]> {
    const res = await apiClient.post<ApiSuccess<CourseLessonItem[]>>(
      `/api/v1/courses/${courseId}/lessons/reorder`,
      { lessonIds },
    );
    return res.data;
  },

  // Authoring: Quizzes
  async getQuiz(quizId: string): Promise<any> {
    const res = await apiClient.get<ApiSuccess<any>>(`/api/v1/quizzes/${quizId}`);
    return res.data;
  },

  async createQuiz(
    lessonId: string,
    data: {
      title: string;
      instructions?: string;
      passingScore?: number;
      maxAttempts?: number;
    },
  ): Promise<any> {
    const res = await apiClient.post<ApiSuccess<any>>(`/api/v1/lessons/${lessonId}/quiz`, data);
    return res.data;
  },

  async updateQuiz(
    quizId: string,
    data: {
      title?: string;
      instructions?: string;
      passingScore?: number;
      maxAttempts?: number;
    },
  ): Promise<any> {
    const res = await apiClient.patch<ApiSuccess<any>>(`/api/v1/quizzes/${quizId}`, data);
    return res.data;
  },

  async deleteQuiz(quizId: string): Promise<void> {
    await apiClient.delete(`/api/v1/quizzes/${quizId}`);
  },

  async addQuizQuestion(
    quizId: string,
    data: { questionText: string; points?: number },
  ): Promise<any> {
    const res = await apiClient.post<ApiSuccess<any>>(`/api/v1/quizzes/${quizId}/questions`, data);
    return res.data;
  },

  async updateQuizQuestion(
    quizId: string,
    questionId: string,
    data: { questionText?: string; points?: number },
  ): Promise<any> {
    const res = await apiClient.patch<ApiSuccess<any>>(
      `/api/v1/quizzes/${quizId}/questions/${questionId}`,
      data,
    );
    return res.data;
  },

  async deleteQuizQuestion(quizId: string, questionId: string): Promise<void> {
    await apiClient.delete(`/api/v1/quizzes/${quizId}/questions/${questionId}`);
  },

  async addQuizOption(
    quizId: string,
    questionId: string,
    data: { optionText: string; isCorrect?: boolean },
  ): Promise<any> {
    const res = await apiClient.post<ApiSuccess<any>>(
      `/api/v1/quizzes/${quizId}/questions/${questionId}/options`,
      data,
    );
    return res.data;
  },

  async updateQuizOption(
    quizId: string,
    questionId: string,
    optionId: string,
    data: { optionText?: string; isCorrect?: boolean },
  ): Promise<any> {
    const res = await apiClient.patch<ApiSuccess<any>>(
      `/api/v1/quizzes/${quizId}/questions/${questionId}/options/${optionId}`,
      data,
    );
    return res.data;
  },

  async deleteQuizOption(
    quizId: string,
    questionId: string,
    optionId: string,
  ): Promise<void> {
    await apiClient.delete(`/api/v1/quizzes/${quizId}/questions/${questionId}/options/${optionId}`);
  },
};
