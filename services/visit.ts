import api, { extractResult } from './api';
import { ApiResponse } from '../types';

export interface VisitResult {
  visitDate: string;
  nextVisitInSeconds: number;
}

export const visitService = {
  createVisit(signal: AbortSignal): Promise<VisitResult> {
    // Axios의 공유 토큰 갱신이 오래 걸려도 선택적 방문 요청은 계속 대기하지 않습니다.
    const controller = new AbortController();
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
      };
      const abort = () => {
        controller.abort();
        cleanup();
        reject(new Error('방문 기록 요청이 취소됐습니다.'));
      };
      const timer = setTimeout(abort, 10000);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) {
        abort();
        return;
      }
      void api.post<ApiResponse<VisitResult>>('/users/me/visits', undefined, {
        signal: controller.signal,
        timeout: 10000,
        suppressErrorLogging: true,
      })
        .then((response) => resolve(extractResult(response)))
        .catch(reject)
        .finally(cleanup);
    });
  },
};
