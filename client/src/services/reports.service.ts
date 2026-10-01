import { apiClient } from './api-client';
import type { ApiSuccess, ApiList } from '../types';

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

export interface AdminUserItem {
  id: string;
  email: string;
  role: 'learner' | 'instructor' | 'admin';
  createdAt: string;
  displayName: string | null;
  avatarPath: string | null;
  enrollmentCount: number;
  coursesTaughtCount: number;
}

export const reportsApi = {
  async getInstructorReports(): Promise<InstructorReportSummary> {
    const res = await apiClient.get<ApiSuccess<InstructorReportSummary>>('/api/v1/instructor/reports');
    return res.data;
  },

  async getAdminReports(): Promise<AdminReportSummary> {
    const res = await apiClient.get<ApiSuccess<AdminReportSummary>>('/api/v1/admin/reports');
    return res.data;
  },

  async listUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
  }): Promise<{ data: AdminUserItem[]; meta: any }> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.search) q.set('search', params.search);
    if (params.role) q.set('role', params.role);

    const qs = q.toString();
    const res = await apiClient.get<ApiList<AdminUserItem>>(`/api/v1/admin/users${qs ? `?${qs}` : ''}`);
    return { data: res.data, meta: res.meta };
  },

  async updateUserRole(
    userId: string,
    role: 'learner' | 'instructor' | 'admin',
  ): Promise<any> {
    const res = await apiClient.patch<ApiSuccess<any>>(`/api/v1/admin/users/${userId}/role`, {
      role,
    });
    return res.data;
  },
};
