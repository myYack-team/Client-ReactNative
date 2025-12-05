import api from './api';
import { AuthTokens, User, ApiResponse } from '../types';

export const authService = {
  async getKakaoLoginUrl(): Promise<string> {
    const response = await api.get<ApiResponse<{ url: string }>>('/auth/kakao');
    return response.data.data!.url;
  },

  async loginWithKakao(code: string): Promise<AuthTokens & { user: User }> {
    const response = await api.post<ApiResponse<AuthTokens & { user: User }>>(
      '/auth/kakao/callback',
      { code }
    );
    return response.data.data!;
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', {
      refreshToken,
    });
    return response.data.data!;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },
};
