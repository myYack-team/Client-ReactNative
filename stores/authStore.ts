import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { User } from '../types';
import { authService, userService } from '../services';
import {
  clearSession,
  setSessionInvalidatedCallback,
  setSessionTokens,
  isSessionChangedError,
  SessionChangedError,
} from '../services/api';
import { logger } from '../utils/logger';
import { useMedicationStore } from './medicationStore';
import { useSupplementStore } from './supplementStore';
import { useAnalysisStore } from './analysisStore';
import { useFamilyStore } from './familyStore';

let authOperation = 0;

function checkAuthOperation(operation: number): void {
  if (operation !== authOperation) throw new SessionChangedError();
}

/**
 * 인증 관련 에러인지 판별
 * - 401 HTTP 상태 코드는 항상 인증 에러
 * - AUTH로 시작하는 서버 에러 코드는 인증 에러
 * - 403은 비즈니스 권한 에러(소유권 검증 실패 등)일 수 있으므로 제외
 * 주의: 메시지 기반 매칭은 오탐(푸시 토큰 등) 위험이 있어 제외
 */
function isAuthError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) {
      return true;
    }
    const code = error.response?.data?.code;
    if (typeof code === 'string' && code.startsWith('AUTH')) {
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
  fetchUser: () => Promise<void>;
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
    const operation = ++authOperation;
    try {
      set({ isLoading: true, error: null });

      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      checkAuthOperation(operation);

      if (!accessToken || !refreshToken) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await userService.getMe();
      checkAuthOperation(operation);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      if (operation !== authOperation || isSessionChangedError(error)) return;
      logger.error('[Auth] Initialize failed:', error);

      if (isAuthError(error)) {
        logger.log('[Auth] Auth error - clearing tokens');
        await clearSession();
      } else {
        // Network error: tokens exist but server unreachable
        // Keep authenticated state so user can retry when online
        logger.log('[Auth] Network error - preserving auth state');
        set({ isLoading: false, isAuthenticated: true, user: null });
      }
    }
  },

  fetchUser: async () => {
    const operation = authOperation;
    try {
      const user = await userService.getMe();
      checkAuthOperation(operation);
      set({ user });
    } catch (error) {
      if (operation !== authOperation || isSessionChangedError(error)) return;
      logger.error('[Auth] Fetch user failed:', error);
    }
  },

  loginWithKakao: async (kakaoAccessToken: string) => {
    const operation = ++authOperation;
    try {
      set({ isLoading: true, error: null });

      const { accessToken, refreshToken, user } = await authService.loginWithKakao(kakaoAccessToken);
      checkAuthOperation(operation);

      await setSessionTokens({ accessToken, refreshToken });
      checkAuthOperation(operation);

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      if (operation !== authOperation || isSessionChangedError(error)) return;
      logger.error('[Auth] Login failed:', error);
      set({
        isLoading: false,
        error: '로그인에 실패했습니다. 다시 시도해주세요.',
      });
    }
  },

  // 서버 기반 OAuth 콜백 처리 (서버에서 딥링크로 토큰 전달받음)
  handleOAuthCallback: async (accessToken: string, refreshToken: string, isNewUser: boolean) => {
    const operation = ++authOperation;
    try {
      set({ isLoading: true, error: null });

      // 토큰 저장
      await setSessionTokens({ accessToken, refreshToken });
      checkAuthOperation(operation);

      // 사용자 정보 조회
      const user = await userService.getMe();
      checkAuthOperation(operation);

      logger.log('[Auth] OAuth callback success:', { userId: user.id, isNewUser });
      set({ user, isAuthenticated: true, isLoading: false, needsOnboarding: isNewUser });
    } catch (error) {
      if (operation !== authOperation || isSessionChangedError(error)) throw new SessionChangedError();
      logger.error('[Auth] OAuth callback failed:', error);
      await clearSession({ notify: false });
      checkAuthOperation(operation);
      set({
        isLoading: false,
        error: '로그인 처리 중 오류가 발생했습니다.',
      });
      throw error;
    }
  },

  exchangeCodeAndLogin: async (code: string) => {
    const operation = ++authOperation;
    try {
      set({ isLoading: true, error: null });

      const result = await authService.exchangeCode(code);
      checkAuthOperation(operation);

      await setSessionTokens(result);
      checkAuthOperation(operation);

      const user = await userService.getMe();
      checkAuthOperation(operation);

      logger.log('[Auth] Code exchange success:', {
        userId: user.id,
        isNewUser: result.isNewUser
      });

      // 신규 유저이거나 약관 미동의 상태면 온보딩 필요
      const needsOnboarding = result.isNewUser || !result.termsAgreed || !result.privacyAgreed;

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        needsOnboarding
      });

      return {
        isNewUser: result.isNewUser,
        termsAgreed: result.termsAgreed,
        privacyAgreed: result.privacyAgreed,
      };
    } catch (error) {
      if (operation !== authOperation || isSessionChangedError(error)) throw new SessionChangedError();
      logger.error('[Auth] Code exchange failed:', error);
      await clearSession({ notify: false });
      checkAuthOperation(operation);
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
    const operation = ++authOperation;
    try {
      await authService.logout();
    } catch {
      // 서버 로그아웃 실패해도 로컬은 정리
    } finally {
      if (operation !== authOperation) return;
      await clearSession({ notify: false });
      if (operation !== authOperation) return;
      // 모든 스토어 초기화 (다른 사용자 데이터 표시 방지)
      useMedicationStore.getState().reset();
      useSupplementStore.getState().reset();
      useAnalysisStore.getState().reset();
      useFamilyStore.getState().reset();
      set({ user: null, isAuthenticated: false, needsOnboarding: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// 세션 무효화 시 Zustand 인증 상태도 함께 초기화
setSessionInvalidatedCallback(() => {
  authOperation += 1;
  // 모든 스토어 초기화 (다른 사용자 데이터 표시 방지)
  useMedicationStore.getState().reset();
  useSupplementStore.getState().reset();
  useAnalysisStore.getState().reset();
  useFamilyStore.getState().reset();
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    needsOnboarding: false,
    error: null,
    isLoading: false,
  });
});
