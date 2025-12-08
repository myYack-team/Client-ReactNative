export * from './colors';
export * from './fonts';

export const API_BASE_URL = __DEV__
  ? 'http://223.194.153.179:8080/api'
  : 'https://api.myyak.com/api';

// 임시 사용자 ID (카카오 로그인 구현 전까지 사용)
export const TEMP_USER_ID = 1;
