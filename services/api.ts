import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

logger.log('[API] Initializing with base URL:', API_BASE_URL);

// Single-flight token refresh promise
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

// 세션 무효화 콜백 (순환 의존성 방지를 위한 콜백 등록 패턴)
let onSessionInvalidated: (() => void) | null = null;

/**
 * 세션 무효화 시 호출될 콜백을 등록합니다.
 * authStore에서 호출하여 Zustand 상태 초기화 로직을 연결합니다.
 */
export function setSessionInvalidatedCallback(cb: () => void) {
  onSessionInvalidated = cb;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5분 (AI 분석 등 장시간 요청 고려)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Single-flight token refresh
 * 여러 요청이 동시에 401을 받아도 토큰 갱신은 한 번만 수행
 */
export async function refreshTokenSingleFlight(): Promise<{ accessToken: string; refreshToken: string }> {
  if (refreshPromise) {
    logger.log('[API] Token refresh in progress - waiting for existing request');
    return refreshPromise;
  }

  logger.log('[API] Starting token refresh');

  refreshPromise = (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data.result;

      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', newRefreshToken);

      logger.log('[API] Token refresh successful');
      return { accessToken, refreshToken: newRefreshToken };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * 세션 정리 (토큰 삭제)
 * @param notify - true면 onSessionInvalidated 콜백 호출 (기본값: true)
 */
export async function clearSession({ notify = true } = {}): Promise<void> {
  logger.log('[API] Clearing session');
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
  if (notify) {
    try {
      onSessionInvalidated?.();
    } catch (e) {
      logger.error('[API] Session invalidation callback error:', e);
    }
  }
}

// Request 인터셉터: JWT 토큰 추가
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    logger.log('[API Request]', config.method?.toUpperCase(), config.url, config.params);

    // JWT 토큰 추가
    const token = await SecureStore.getItemAsync('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logger.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response 인터셉터: API 응답 형식 처리
api.interceptors.response.use(
  (response) => {
    // API 응답 형식 확인
    const data = response.data as ApiResponse<unknown>;
    if (data && data.isSuccess === false) {
      return Promise.reject(new Error(data.message || '요청이 실패했습니다.'));
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 또는 에러코드 없는 403(서버가 인증 실패를 403으로 반환하는 경우 방어) 시 토큰 갱신 시도
    const status = error.response?.status;
    const errorCode = error.response?.data?.code;
    const shouldRefresh = (status === 401 || (status === 403 && !errorCode)) && !originalRequest._retry;

    if (shouldRefresh) {
      originalRequest._retry = true;

      try {
        const { accessToken } = await refreshTokenSingleFlight();

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        logger.error('[API] Token refresh failed:', refreshError);
        // 인증 에러(401/403)만 세션 삭제, 네트워크 에러나 서버 에러(5xx)는 토큰 유지
        if (axios.isAxiosError(refreshError)) {
          const status = refreshError.response?.status;
          if (status === 401 || status === 403) {
            await clearSession();
          }
        } else {
          // Non-Axios 에러 (예: 'No refresh token') → 세션 정리
          await clearSession();
        }
      }
    }

    // 에러 메시지 추출
    const errorMessage = error.response?.data?.message || error.message || '네트워크 오류가 발생했습니다.';
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;

/**
 * API 응답에서 result를 안전하게 추출합니다.
 * result가 없으면 에러를 throw합니다.
 */
export function extractResult<T>(response: { data: ApiResponse<T> }, errorMessage?: string): T {
  if (!response.data.result) {
    throw new Error(errorMessage || '서버 응답이 올바르지 않습니다.');
  }
  return response.data.result;
}
