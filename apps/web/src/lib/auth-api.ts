import { apiClient } from './api-client';
import type { User } from '@/types';

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}

export const authApi = {
  signIn: async (credentials: Record<string, string>): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/signin', credentials);
  },

  signUp: async (data: Record<string, string>): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/signup', data);
  },

  getCurrentUser: async (): Promise<{ success: boolean; user: User }> => {
    return apiClient.get<{ success: boolean; user: User }>('/auth/me');
  },
};
