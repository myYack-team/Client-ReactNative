export * from './colors';
export * from './fonts';

export const API_BASE_URL = __DEV__
  // ? 'http://192.168.0.72:8080/api' // 장소1 (문화원 2층)
  // ? 'http://192.168.1.23:8080/api' // 장소2 (문화원 3층)
  ? 'http://192.168.45.32:8080/api' // 장소3 (집)
  // ? 'http://192.168.50.248:8080/api' // 덕성 할리스
  : 'https://api.myyak.com/api';

// 임시 사용자 ID (카카오 로그인 구현 전까지 사용)
export const TEMP_USER_ID = 1;
