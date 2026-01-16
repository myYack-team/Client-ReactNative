/**
 * 프로덕션 환경에서 로그 출력을 제어하는 로거 유틸리티
 *
 * - 개발 환경(__DEV__ = true): 모든 로그 출력
 * - 프로덕션 환경(__DEV__ = false): error만 출력
 */

const isDev = __DEV__;

export const logger = {
  /**
   * 일반 로그 (개발 환경에서만 출력)
   */
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log('[LOG]', ...args);
    }
  },

  /**
   * 경고 로그 (개발 환경에서만 출력)
   */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * 에러 로그 (항상 출력)
   */
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * 디버그 로그 (개발 환경에서만 출력)
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * 정보 로그 (개발 환경에서만 출력)
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },
};

export default logger;
