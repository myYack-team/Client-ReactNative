/**
 * 복용 횟수별 기본 알림 시간
 * key: 하루 복용 횟수
 * value: 해당 횟수에 맞는 기본 알림 시간 배열
 */
export const DEFAULT_TIMES: Record<number, string[]> = {
  1: ['08:00'],
  2: ['08:00', '18:30'],
  3: ['08:00', '12:30', '18:30'],
  4: ['08:00', '12:30', '18:30', '22:00'],
};

/**
 * 기본 복용 횟수
 */
export const DEFAULT_FREQUENCY = 3;

/**
 * 기본 복용 기간 (일)
 */
export const DEFAULT_DURATION_DAYS = 7;

/**
 * 기본 1회 복용량
 */
export const DEFAULT_DOSAGE = 1;
