import { apiClient, ApiClientError } from './api-client';
import type { ApiSuccess, AuthUser } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  userId: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await apiClient.post<ApiSuccess<AuthResponse>>('/api/v1/auth/register', data, {
      skipAuth: true,
    } as Parameters<typeof apiClient.post>[2]);
    return res.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await apiClient.post<ApiSuccess<AuthResponse>>('/api/v1/auth/login', data, {
      skipAuth: true,
    } as Parameters<typeof apiClient.post>[2]);
    return res.data;
  },

  async refresh(): Promise<string | null> {
    return apiClient.refreshAuthToken();
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch {
      // Best-effort logout
    }
  },

  async me(): Promise<AuthUser | null> {
    try {
      const res = await apiClient.get<ApiSuccess<AuthUser>>('/api/v1/auth/me');
      return res.data;
    } catch {
      return null;
    }
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/api/v1/auth/change-password', data);
  },
};
