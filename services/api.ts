import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

logger.log('[API] Initializing with base URL:', API_BASE_URL);

// Single-flight token refresh promise
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

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
async function refreshTokenSingleFlight(): Promise<{ accessToken: string; refreshToken: string }> {
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
 */
export async function clearSession(): Promise<void> {
  logger.log('[API] Clearing session');
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
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

    // 401 에러 시 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { accessToken } = await refreshTokenSingleFlight();

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        logger.error('[API] Token refresh failed:', refreshError);
        await clearSession();
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
