import axios from 'axios';
import api from './api';
import { API_BASE_URL } from '../constants';
import { ApiResponse, User } from '../types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// 로그인 응답 (서버 AuthResponseDTO.LoginResponse)
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  user: {
    id: number;
    kakaoId: string;
    name: string;
    nickname?: string;  // 하위 호환용 (선택적)
    profileImage?: string;
    email?: string;
    gender?: 'MALE' | 'FEMALE';
    birthDate?: string;
  };
  isNewUser: boolean;
  termsAgreed: boolean;
  privacyAgreed: boolean;
}

// 토큰 갱신 응답 (서버 AuthResponseDTO.TokenResponse)
interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

// 인증 코드 교환 응답
interface ExchangeCodeResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  termsAgreed: boolean;
  privacyAgreed: boolean;
}

export const authService = {
  /**
   * 카카오 액세스 토큰으로 서버 로그인
   * @param kakaoAccessToken 카카오에서 받은 액세스 토큰
   */
  async loginWithKakao(kakaoAccessToken: string): Promise<AuthTokens & { user: User; isNewUser: boolean; termsAgreed: boolean; privacyAgreed: boolean }> {
    // 인증 API는 JWT 없이 호출해야 하므로 별도 axios 인스턴스 사용
    const response = await axios.post<ApiResponse<LoginResponse>>(
      `${API_BASE_URL}/auth/kakao`,
      { accessToken: kakaoAccessToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.data.result) {
      throw new Error('카카오 로그인에 실패했습니다.');
    }

    const { accessToken, refreshToken, user, isNewUser, termsAgreed, privacyAgreed } = response.data.result;

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        kakaoId: user.kakaoId,
        name: user.name || user.nickname || '',
        email: user.email,
        profileImage: user.profileImage,
        fontSize: 'MEDIUM', // 기본값
        createdAt: new Date().toISOString(),
      },
      isNewUser,
      termsAgreed: termsAgreed ?? false,
      privacyAgreed: privacyAgreed ?? false,
    };
  },

  /**
   * Access Token 갱신
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await axios.post<ApiResponse<TokenResponse>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.data.result) {
      throw new Error('토큰 갱신에 실패했습니다.');
    }

    return {
      accessToken: response.data.result.accessToken,
      refreshToken: response.data.result.refreshToken,
    };
  },

  /**
   * 인증 코드로 토큰 교환
   * @param code 카카오에서 받은 인증 코드
   */
  async exchangeCode(code: string): Promise<ExchangeCodeResponse> {
    const response = await axios.post<ApiResponse<ExchangeCodeResponse>>(
      `${API_BASE_URL}/auth/exchange`,
      { code },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.data.result) {
      throw new Error('인증 코드 교환에 실패했습니다.');
    }

    return response.data.result;
  },

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // 서버 로그아웃 실패해도 무시 (로컬 토큰은 삭제됨)
    }
  },
};
