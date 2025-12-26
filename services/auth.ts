import api from './api';
import { ApiResponse, User } from '../types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  // 카카오 로그인 URL 가져오기 (추후 구현)
  async getKakaoLoginUrl(): Promise<string> {
    const response = await api.get<ApiResponse<{ url: string }>>('/auth/kakao');
    if (!response.data.result) {
      throw new Error('카카오 로그인 URL을 가져오는데 실패했습니다.');
    }
    return response.data.result.url;
  },

  // 카카오 인증 코드로 JWT 발급 (추후 구현)
  async loginWithKakao(code: string): Promise<AuthTokens & { user: User }> {
    const response = await api.post<ApiResponse<AuthTokens & { user: User }>>(
      '/auth/kakao/callback',
      { code }
    );
    if (!response.data.result) {
      throw new Error('카카오 로그인에 실패했습니다.');
    }
    return response.data.result;
  },

  // Access Token 갱신 (추후 구현)
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', {
      refreshToken,
    });
    if (!response.data.result) {
      throw new Error('토큰 갱신에 실패했습니다.');
    }
    return response.data.result;
  },

  // 로그아웃 (추후 구현)
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
