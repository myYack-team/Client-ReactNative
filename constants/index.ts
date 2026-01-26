import Constants from 'expo-constants';

export * from './colors';
export * from './fonts';
export * from './medication';
export * from './responsive';
export * from './termsContent';
export * from './Symptoms';

/**
 * 개발 환경에서 Expo 개발 서버의 IP를 자동으로 감지하여 API URL 생성
 * - 개발: Expo 서버 IP 사용 (예: http://192.168.x.x:8080/api)
 * - 프로덕션: 고정 도메인 사용
 */
const getApiBaseUrl = (): string => {
  // 프로덕션 환경에서는 고정 도메인 사용
  if (!__DEV__) {
    return 'https://api.myyak.xyz/api';
  }

  // 개발 환경에서만 환경변수 사용
  const envApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envApiUrl) {
    return envApiUrl;
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

// 카카오 로그인 설정
// 참고: 카카오 네이티브 SDK는 app.json의 kakaoAppKey를 사용하므로
// KAKAO_REST_API_KEY는 웹 로그인에서만 필요 (현재 미사용)
export const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
