import Constants from 'expo-constants';

export * from './colors';
export * from './fonts';
export * from './medication';
export * from './responsive';
export * from './termsContent';
export * from './Symptoms';

/**
 * API Base URL 결정 로직
 * 1. 환경변수(EXPO_PUBLIC_API_BASE_URL)가 설정되어 있으면 우선 사용
 * 2. 프로덕션 빌드(__DEV__=false)에서는 고정 도메인 사용
 * 3. 개발 환경에서는 Expo 서버 IP 자동 감지
 *
 * 로컬 테스트 시: LOCAL_TEST를 true로 변경
 */
const LOCAL_TEST = true; // 로컬 테스트 시 true로 변경

const getApiBaseUrl = (): string => {
  // 로컬 테스트 모드
  if (LOCAL_TEST) {
    return 'http://localhost:8080/api';
  }

  // 환경변수가 설정되어 있으면 우선 사용 (로컬 테스트 빌드 지원)
  const envApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // 프로덕션 환경에서는 고정 도메인 사용
  if (!__DEV__) {
    return 'https://api.myyak.xyz/api';
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
