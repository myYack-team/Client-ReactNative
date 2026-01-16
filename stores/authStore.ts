import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { authService, userService } from '../services';
import { logger } from '../utils/logger';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsOnboarding: boolean;

  initialize: () => Promise<void>;
  loginWithKakao: (kakaoAccessToken: string) => Promise<void>;
  handleOAuthCallback: (accessToken: string, refreshToken: string, isNewUser: boolean) => Promise<void>;
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
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ isLoading: false, isAuthenticated: false, user: null });
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
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({
        isLoading: false,
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
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ user: null, isAuthenticated: false, needsOnboarding: false });
    }
  },

  clearError: () => set({ error: null }),
}));
