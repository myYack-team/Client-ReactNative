const DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_CHECK_MS = 15 * 60 * 1000;
const RETRY_DELAYS_MS = [30000, 120000];

export type VisitSession = number | 'authenticated' | null;

interface VisitTrackerDependencies {
  createVisit: (signal: AbortSignal) => Promise<{ visitDate: string; nextVisitInSeconds?: number }>;
  now?: () => number;
  setTimer?: (callback: () => void, delay: number) => () => void;
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

/**
 * 전면 복귀마다 서버가 계정·날짜별 중복을 확인합니다. 자정 타이머도 서버의 남은 시간을
 * 사용하므로 기기 시계/시간대가 달라도 실제 방문일을 기기 날짜로 덮거나 생략하지 않습니다.
 */
export class DailyVisitTracker {
  private readonly now: () => number;
  private readonly setTimer: (callback: () => void, delay: number) => () => void;
  private session: VisitSession = null;
  private foreground = false;
  private generation = 0;
  private needsVisit = true;
  private nextVisitDelay = FALLBACK_CHECK_MS;
  private failedAttempts = 0;
  private nextAttemptAt = 0;
  private pending: AbortController | null = null;
  private cancelTimer: (() => void) | null = null;

  constructor(private readonly dependencies: VisitTrackerDependencies) {
    this.now = dependencies.now ?? Date.now;
    this.setTimer = dependencies.setTimer ?? ((callback, delay) => {
      const timer = setTimeout(callback, delay);
      return () => clearTimeout(timer);
    });
  }

  setSession(session: VisitSession): void {
    if (this.session === session) return;
    this.generation += 1;
    this.pending?.abort();
    this.pending = null;
    this.session = session;
    this.needsVisit = true;
    this.nextVisitDelay = FALLBACK_CHECK_MS;
    this.failedAttempts = 0;
    this.nextAttemptAt = 0;
    this.check();
  }

  setForeground(foreground: boolean): void {
    if (this.foreground === foreground) return;
    this.foreground = foreground;
    if (foreground) {
      this.needsVisit = true;
      this.failedAttempts = 0;
    } else {
      this.pending?.abort();
    }
    this.check();
  }

  dispose(): void {
    this.foreground = false;
    this.setSession(null);
    this.clearTimer();
  }

  private clearTimer(): void {
    this.cancelTimer?.();
    this.cancelTimer = null;
  }

  private schedule(delay: number, newVisit = false): void {
    this.cancelTimer = this.setTimer(() => {
      this.cancelTimer = null;
      if (newVisit) {
        this.needsVisit = true;
        this.failedAttempts = 0;
        this.nextAttemptAt = 0;
      }
      this.check();
    }, Math.max(1, delay));
  }

  private check(): void {
    this.clearTimer();
    if (this.session === null || !this.foreground || this.pending) return;

    if (!this.needsVisit) {
      this.schedule(this.nextVisitDelay, true);
      return;
    }
    if (this.failedAttempts > RETRY_DELAYS_MS.length) {
      this.schedule(DAY_MS, true);
      return;
    }
    const now = this.now();
    if (this.nextAttemptAt > now) {
      this.schedule(this.nextAttemptAt - now);
      return;
    }

    const generation = this.generation;
    const controller = new AbortController();
    this.pending = controller;

    void Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) throw new Error('방문 기록 요청이 취소됐습니다.');
        return this.dependencies.createVisit(controller.signal);
      })
      .then((result) => {
        if (generation !== this.generation || controller.signal.aborted) return;
        if (!result || !isValidDate(result.visitDate)) throw new Error('방문 날짜 응답이 올바르지 않습니다.');
        const seconds = result.nextVisitInSeconds;
        this.nextVisitDelay = typeof seconds === 'number' && Number.isInteger(seconds)
          && seconds >= 1 && seconds <= 86400 ? seconds * 1000 + 100 : FALLBACK_CHECK_MS;
        this.needsVisit = false;
        this.failedAttempts = 0;
        this.nextAttemptAt = 0;
      })
      .catch(() => {
        if (generation !== this.generation || controller.signal.aborted) return;
        this.failedAttempts += 1;
        const delay = RETRY_DELAYS_MS[this.failedAttempts - 1] ?? RETRY_DELAYS_MS[0];
        this.nextAttemptAt = this.now() + delay;
      })
      .finally(() => {
        if (generation !== this.generation) return;
        this.pending = null;
        this.check();
      });
  }
}
