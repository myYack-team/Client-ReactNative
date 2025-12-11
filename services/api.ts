import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, TEMP_USER_ID } from '../constants';
import { ApiResponse } from '../types';

console.log('[API] Initializing with base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60초 (이미지 업로드 등 대용량 요청 고려)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request 인터셉터: userId 파라미터 추가 (임시, 카카오 로그인 구현 후 제거)
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 임시: userId 쿼리 파라미터 추가
    config.params = {
      ...config.params,
      userId: TEMP_USER_ID,
    };

    console.log('[API Request]', config.method?.toUpperCase(), config.url, config.params);

    // 나중에 JWT 토큰 추가할 때 사용
    const token = await SecureStore.getItemAsync('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
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

    // 401 에러 시 토큰 갱신 시도 (나중에 구현)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.result;

          await SecureStore.setItemAsync('accessToken', accessToken);
          await SecureStore.setItemAsync('refreshToken', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        }
      } catch (refreshError) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }

    // 에러 메시지 추출
    const errorMessage = error.response?.data?.message || error.message || '네트워크 오류가 발생했습니다.';
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
