export * from './colors';
export * from './fonts';

export const API_BASE_URL = __DEV__
  ? 'http://192.168.0.72:8080/api'
  : 'https://api.myyak.com/api';

// 임시 사용자 ID (카카오 로그인 구현 전까지 사용)
export const TEMP_USER_ID = 1;
