export * from './colors';
export * from './fonts';

export const API_BASE_URL = __DEV__
  ? 'http://localhost:8080/api'
  : 'https://api.myyak.com/api';

export const TIMING_OPTIONS = [
  '아침 식전',
  '아침 식후',
  '점심 식전',
  '점심 식후',
  '저녁 식전',
  '저녁 식후',
  '취침 전',
  '필요시',
] as const;

export type TimingOption = typeof TIMING_OPTIONS[number];
