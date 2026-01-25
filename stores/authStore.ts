import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AxiosError } from 'axios';
import { User } from '../types';
import { authService, userService } from '../services';
import { clearSession } from '../services/api';
import { logger } from '../utils/logger';

function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return true;
    }
    const code = error.response?.data?.code;
    if (typeof code === 'string' && code.startsWith('AUTH')) {
      return true;
    }
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('unauthorized') || msg.includes('token') || msg.includes('auth')) {
      return true;
    }
  }
  return false;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsOnboarding: boolean;

  initialize: () => Promise<void>;
  loginWithKakao: (kakaoAccessToken: string) => Promise<void>;
  handleOAuthCallback: (accessToken: string, refreshToken: string, isNewUser: boolean) => Promise<void>;
  exchangeCodeAndLogin: (code: string) => Promise<{
    isNewUser: boolean;
    termsAgreed: boolean;
    privacyAgreed: boolean;
  }>;
  completeOnboarding: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  needsOnboarding: false,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (!accessToken || !refreshToken) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await userService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      logger.error('[Auth] Initialize failed:', error);

      if (isAuthError(error)) {
        logger.log('[Auth] Auth error - clearing tokens');
        await clearSession();
        set({ isLoading: false, isAuthenticated: false, user: null });
      } else {
        // Network/5xx errors - keep tokens, show error
        logger.log('[Auth] Non-auth error - keeping tokens');
        set({
          isLoading: false,
          isAuthenticated: true,
          error: '서버 연결에 실패했습니다. 네트워크를 확인해주세요.',
        });
      }
    }
  },

  loginWithKakao: async (kakaoAccessToken: string) => {
    try {
      set({ isLoading: true, error: null });

      const { accessToken, refreshToken, user } = await authService.loginWithKakao(kakaoAccessToken);

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      logger.error('[Auth] Login failed:', error);
      set({
        isLoading: false,
        error: '로그인에 실패했습니다. 다시 시도해주세요.',
      });
    }
  },

  // 서버 기반 OAuth 콜백 처리 (서버에서 딥링크로 토큰 전달받음)
  handleOAuthCallback: async (accessToken: string, refreshToken: string, isNewUser: boolean) => {
    try {
      set({ isLoading: true, error: null });

      // 토큰 저장
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);

      // 사용자 정보 조회
      const user = await userService.getMe();

      logger.log('[Auth] OAuth callback success:', { userId: user.id, isNewUser });
      set({ user, isAuthenticated: true, isLoading: false, needsOnboarding: isNewUser });
    } catch (error) {
      logger.error('[Auth] OAuth callback failed:', error);
      await clearSession();
      set({
        isLoading: false,
        error: '로그인 처리 중 오류가 발생했습니다.',
      });
      throw error;
    }
  },

  exchangeCodeAndLogin: async (code: string) => {
    try {
      set({ isLoading: true, error: null });

      const result = await authService.exchangeCode(code);

      await SecureStore.setItemAsync('accessToken', result.accessToken);
      await SecureStore.setItemAsync('refreshToken', result.refreshToken);

      const user = await userService.getMe();

      logger.log('[Auth] Code exchange success:', {
        userId: user.id,
        isNewUser: result.isNewUser
      });

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        needsOnboarding: result.isNewUser
      });

      return {
        isNewUser: result.isNewUser,
        termsAgreed: result.termsAgreed,
        privacyAgreed: result.privacyAgreed,
      };
    } catch (error) {
      logger.error('[Auth] Code exchange failed:', error);
      await clearSession();
      set({
        isLoading: false,
        isAuthenticated: false,
        error: '로그인 처리 중 오류가 발생했습니다.',
      });
      throw error;
    }
  },

  completeOnboarding: () => {
    set({ needsOnboarding: false });
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // 서버 로그아웃 실패해도 로컬은 정리
    } finally {
      await clearSession();
      set({ user: null, isAuthenticated: false, needsOnboarding: false });
    }
  },

  clearError: () => set({ error: null }),
}));
