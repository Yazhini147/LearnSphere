import { apiClient } from './api-client';
import type { ApiSuccess } from '../types';

export interface UserProfile {
  id: string;
  email: string;
  role: 'learner' | 'instructor' | 'admin';
  createdAt: string;
  displayName: string | null;
  bio: string | null;
  avatarPath: string | null;
}

export const userApi = {
  async getProfile(): Promise<UserProfile> {
    const res = await apiClient.get<ApiSuccess<UserProfile>>('/api/v1/auth/profile');
    return res.data;
  },

  async updateProfile(data: {
    displayName?: string;
    bio?: string;
    avatarPath?: string;
  }): Promise<UserProfile> {
    const res = await apiClient.patch<ApiSuccess<UserProfile>>('/api/v1/auth/profile', data);
    return res.data;
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const res = await apiClient.post<ApiSuccess<{ message: string }>>(
      '/api/v1/auth/change-password',
      data,
    );
    return res.data;
  },
};
