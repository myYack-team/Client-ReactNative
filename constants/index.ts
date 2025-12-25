import Constants from 'expo-constants';

export * from './colors';
export * from './fonts';

/**
 * 개발 환경에서 Expo 개발 서버의 IP를 자동으로 감지하여 API URL 생성
 * - 개발: Expo 서버 IP 사용 (예: http://192.168.x.x:8080/api)
 * - 프로덕션: 고정 도메인 사용
 */
const getApiBaseUrl = (): string => {
  if (!__DEV__) {
    return 'https://api.myyak.com/api';
  }

  // Expo 개발 서버 URL에서 IP 추출
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:8080/api`;
  }

  // fallback: localhost
  return 'http://localhost:8080/api';
};

export const API_BASE_URL = getApiBaseUrl();

// 임시 사용자 ID (카카오 로그인 구현 전까지 사용)
export const TEMP_USER_ID = 1;
