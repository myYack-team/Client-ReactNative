const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

// 앱 실행 없이 실제 TypeScript 모듈을 읽고 네이티브 경계만 대체합니다.
function loadModule(relativePath, mocks = {}, globals = {}) {
  const file = path.join(__dirname, '..', relativePath);
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require(name) {
      if (name in mocks) return mocks[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
    Date,
    Promise,
    AbortController,
    setTimeout,
    clearTimeout,
    ...globals,
  }, { filename: file });
  return module.exports;
}

const { DailyVisitTracker } = loadModule('utils/dailyVisitTracker.ts');
const flush = () => new Promise((resolve) => setImmediate(resolve));
const kstDate = (timestamp) => new Date(timestamp + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
const untilKstMidnight = (timestamp) => Math.ceil((86400000 - ((timestamp + 32400000) % 86400000)) / 1000);

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function harness({ start = '2026-10-13T00:00:00.000Z', request } = {}) {
  let now = Date.parse(start);
  let timerId = 0;
  const timers = new Map();
  const calls = [];
  const tracker = new DailyVisitTracker({
    now: () => now,
    createVisit: (signal) => {
      calls.push({ signal, at: now });
      return request ? request(signal, calls.length) : Promise.resolve({
        visitDate: kstDate(now), nextVisitInSeconds: untilKstMidnight(now),
      });
    },
    setTimer: (callback, delay) => {
      const id = ++timerId;
      timers.set(id, { at: now + delay, callback });
      return () => timers.delete(id);
    },
  });
  return {
    tracker,
    calls,
    timers,
    async advance(milliseconds) {
      const target = now + milliseconds;
      for (let limit = 0; limit < 20; limit += 1) {
        const next = [...timers.entries()].sort((left, right) => left[1].at - right[1].at)[0];
        if (!next || next[1].at > target) { now = target; return; }
        now = next[1].at;
        timers.delete(next[0]);
        next[1].callback();
        await flush();
      }
      throw new Error('Timer did not stop');
    },
  };
}

test('인증 초기화/로그인 후 활성 앱만 기록하고 중복 활성 이벤트를 생략한다', async () => {
  const { tracker, calls } = harness();
  tracker.setForeground(true);
  await flush();
  assert.equal(calls.length, 0);
  tracker.setSession(1);
  await flush();
  assert.equal(calls.length, 1);
  tracker.setSession(1);
  tracker.setForeground(true);
  await flush();
  assert.equal(calls.length, 1);
  tracker.setForeground(false);
  tracker.setForeground(true);
  await flush();
  assert.equal(calls.length, 2);
  tracker.dispose();
});

test('백그라운드 인증/푸시 수신만으로는 방문 요청을 보내지 않는다', async () => {
  const { tracker, calls } = harness();
  tracker.setSession(1);
  await flush();
  assert.equal(calls.length, 0);
  tracker.setForeground(true);
  await flush();
  assert.equal(calls.length, 1);
  tracker.dispose();
});

test('아직 사용자 정보가 없는 인증 세션도 서버가 JWT 사용자로 기록한다', async () => {
  const { tracker, calls } = harness();
  tracker.setSession('authenticated');
  tracker.setForeground(true);
  await flush();
  assert.equal(calls.length, 1);
  tracker.dispose();
});

test('진행 중인 요청을 중복 생성하지 않는다', async () => {
  const pending = deferred();
  const { tracker, calls } = harness({ request: () => pending.promise });
  tracker.setSession(1);
  tracker.setForeground(true);
  tracker.setSession(1);
  tracker.setForeground(true);
  await flush();
  assert.equal(calls.length, 1);
  pending.resolve({ visitDate: '2026-10-13' });
  await flush();
  assert.equal(calls.length, 1);
  tracker.dispose();
});

test('활성 상태로 KST 자정을 넘기면 새로운 날짜의 방문을 기록한다', async () => {
  const state = harness({ start: '2026-10-13T14:59:59.000Z' });
  state.tracker.setSession(1);
  state.tracker.setForeground(true);
  await flush();
  await state.advance(1100);
  assert.equal(state.calls.length, 2);
  assert.equal(kstDate(state.calls[1].at), '2026-10-14');
  state.tracker.dispose();
});

test('백그라운드에서는 날짜 변경 타이머를 멈추고 다음 전면 진입 때 기록한다', async () => {
  const state = harness({ start: '2026-10-13T14:59:59.000Z' });
  state.tracker.setSession(1);
  state.tracker.setForeground(true);
  await flush();
  state.tracker.setForeground(false);
  assert.equal(state.timers.size, 0);
  await state.advance(2000);
  assert.equal(state.calls.length, 1);
  state.tracker.setForeground(true);
  await flush();
  assert.equal(state.calls.length, 2);
  state.tracker.dispose();
});

test('실패하면 30초/2분 뒤에 재시도하고 성공 후 중복 요청을 멈춘다', async () => {
  const state = harness({ request: (_signal, count) => count < 3
    ? Promise.reject(new Error('offline'))
    : Promise.resolve({ visitDate: '2026-10-13' }) });
  state.tracker.setSession(1);
  state.tracker.setForeground(true);
  await flush();
  await state.advance(29999);
  assert.equal(state.calls.length, 1);
  await state.advance(1);
  assert.equal(state.calls.length, 2);
  await state.advance(120000);
  assert.equal(state.calls.length, 3);
  await state.advance(300000);
  assert.equal(state.calls.length, 3);
  state.tracker.dispose();
});

test('자동 재시도 소진 후 반복 요청을 멈추고 24시간 뒤 다시 시도한다', async () => {
  const state = harness({ request: () => Promise.reject(new Error('offline')) });
  state.tracker.setSession(1);
  state.tracker.setForeground(true);
  await flush();
  await state.advance(150000);
  assert.equal(state.calls.length, 3);
  await state.advance(24 * 60 * 60 * 1000);
  assert.equal(state.calls.length, 4);
  state.tracker.dispose();
});

test('재시도 소진 후 전면 재진입하면 쿨다운 이후 다시 시도한다', async () => {
  const state = harness({ request: () => Promise.reject(new Error('offline')) });
  state.tracker.setSession(1);
  state.tracker.setForeground(true);
  await flush();
  await state.advance(150000);
  assert.equal(state.calls.length, 3);
  state.tracker.setForeground(false);
  state.tracker.setForeground(true);
  await flush();
  assert.equal(state.calls.length, 3);
  await state.advance(30000);
  assert.equal(state.calls.length, 4);
  state.tracker.dispose();
});

test('백그라운드 전환으로 취소된 요청은 성공 처리하지 않고 전면에서 다시 시도한다', async () => {
  const pending = deferred();
  const state = harness({ request: (_signal, count) => count === 1
    ? pending.promise : Promise.resolve({ visitDate: '2026-10-13' }) });
  state.tracker.setSession(1);
  state.tracker.setForeground(true);
  await flush();
  state.tracker.setForeground(false);
  assert.equal(state.calls[0].signal.aborted, true);
  pending.resolve({ visitDate: '2026-10-13' });
  await flush();
  assert.equal(state.calls.length, 1);
  state.tracker.setForeground(true);
  await flush();
  assert.equal(state.calls.length, 2);
  state.tracker.dispose();
});

test('계정 전환은 이전 요청을 취소하고 늦은 완료가 새 계정의 실패/재시도를 덮지 않는다', async () => {
  const first = deferred();
  const second = deferred();
  const state = harness({ request: (_signal, count) => {
    if (count === 1) return first.promise;
    if (count === 2) return second.promise;
    return Promise.resolve({ visitDate: '2026-10-13' });
  } });
  state.tracker.setSession(1);
  state.tracker.setForeground(true);
  await flush();
  state.tracker.setSession(2);
  await flush();
  assert.equal(state.calls.length, 2);
  assert.equal(state.calls[0].signal.aborted, true);
  first.resolve({ visitDate: '2026-10-13' });
  second.reject(new Error('offline'));
  await flush();
  await state.advance(30000);
  assert.equal(state.calls.length, 3);
  state.tracker.dispose();
});

test('로그아웃/훅 해제 후 오래된 응답이나 예약 타이머로 요청을 재시작하지 않는다', async () => {
  const pending = deferred();
  const state = harness({ request: () => pending.promise });
  state.tracker.setSession(1);
  state.tracker.setForeground(true);
  await flush();
  state.tracker.setSession(null);
  pending.resolve({ visitDate: '2026-10-13' });
  await flush();
  await state.advance(24 * 60 * 60 * 1000);
  assert.equal(state.calls.length, 1);
  assert.equal(state.timers.size, 0);
  state.tracker.dispose();
});

test('서버 날짜가 기기 날짜와 달라도 그대로 수신하고 전면 복귀마다 서버에서 확인한다', async () => {
  const state = harness({ request: () => Promise.resolve({ visitDate: '2026-10-12' }) });
  state.tracker.setSession(1);
  state.tracker.setForeground(true);
  await flush();
  state.tracker.setForeground(false);
  state.tracker.setForeground(true);
  await flush();
  assert.equal(state.calls.length, 2);
  state.tracker.dispose();
});

for (const offsetHours of [-5, 5]) {
  test(`기기 시계 ${offsetHours > 0 ? '+' : ''}${offsetHours}시간 오차여도 서버 날짜 변경 후 전면 복귀를 기록한다`, async () => {
    const actual = Date.parse('2026-10-13T11:00:00.000Z');
    const state = harness({ start: new Date(actual + offsetHours * 3600000).toISOString(),
      request: (_signal, count) => Promise.resolve({
        visitDate: count === 1 ? '2026-10-13' : '2026-10-14', nextVisitInSeconds: 14400,
      }) });
    state.tracker.setSession(1);
    state.tracker.setForeground(true);
    await flush();
    state.tracker.setForeground(false);
    await state.advance(6 * 3600000);
    state.tracker.setForeground(true);
    await flush();
    assert.equal(state.calls.length, 2);
    state.tracker.dispose();
  });

  test(`기기 시계 ${offsetHours > 0 ? '+' : ''}${offsetHours}시간 오차여도 서버가 알려준 자정 지연을 사용한다`, async () => {
    const actual = Date.parse('2026-10-13T14:59:59.000Z');
    const state = harness({ start: new Date(actual + offsetHours * 3600000).toISOString(),
      request: (_signal, count) => Promise.resolve({
        visitDate: count === 1 ? '2026-10-13' : '2026-10-14',
        nextVisitInSeconds: count === 1 ? 1 : 86400,
      }) });
    state.tracker.setSession(1);
    state.tracker.setForeground(true);
    await flush();
    await state.advance(1100);
    assert.equal(state.calls.length, 2);
    state.tracker.dispose();
  });
}

test('서버 자정 지연이 없거나 범위를 벗어나면 15분 주기로 재확인한다', async () => {
  const state = harness({ request: () => Promise.resolve({ visitDate: '2026-10-13', nextVisitInSeconds: 0 }) });
  state.tracker.setSession(1);
  state.tracker.setForeground(true);
  await flush();
  await state.advance(15 * 60 * 1000);
  assert.equal(state.calls.length, 2);
  state.tracker.dispose();
});

test('올바르지 않은 응답을 성공으로 저장하지 않아 이후 다시 시도할 수 있다', async () => {
  const state = harness({ request: (_signal, count) => Promise.resolve({ visitDate: count === 1
    ? '2026-02-30' : '2026-10-13' }) });
  state.tracker.setSession(1);
  state.tracker.setForeground(true);
  await flush();
  await state.advance(30000);
  assert.equal(state.calls.length, 2);
  state.tracker.dispose();
});

test('방문 API는 날짜/사용자/본문 없이 기존 인증 클라이언트를 호출한다', async () => {
  const requests = [];
  const { visitService } = loadModule('services/visit.ts', {
    './api': {
      default: { post: async (...args) => {
        requests.push(args);
        return { data: { isSuccess: true, result: { visitDate: '2026-10-13' } } };
      } },
      extractResult: (response) => response.data.result,
    },
  });
  const signal = new AbortController().signal;
  const result = await visitService.createVisit(signal);
  assert.equal(result.visitDate, '2026-10-13');
  assert.equal(requests[0][0], '/users/me/visits');
  assert.equal(requests[0][1], undefined);
  assert.equal(requests[0][2].signal.aborted, false);
  assert.equal(requests[0][2].timeout, 10000);
  assert.equal(requests[0][2].suppressErrorLogging, true);
  assert.equal(requests[0][2].params, undefined);
});

test('방문 요청은 공유 인증 갱신이 멈춰도 전체 10초 제한으로 종료하고 취소 신호를 전달한다', async () => {
  let deadline;
  let requestSignal;
  const { visitService } = loadModule('services/visit.ts', {
    './api': {
      default: { post: (_url, _body, options) => {
        requestSignal = options.signal;
        return new Promise(() => {});
      } },
      extractResult: (response) => response.data.result,
    },
  }, { setTimeout: (callback, delay) => {
    assert.equal(delay, 10000);
    deadline = callback;
    return 1;
  }, clearTimeout() {} });
  const request = visitService.createVisit(new AbortController().signal);
  deadline();
  await assert.rejects(() => request);
  assert.equal(requestSignal.aborted, true);
});

test('이미 로그아웃/취소된 방문 요청은 HTTP 호출을 시작하지 않는다', async () => {
  let calls = 0;
  const { visitService } = loadModule('services/visit.ts', {
    './api': { default: { post: () => { calls += 1; } }, extractResult() {} },
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => visitService.createVisit(controller.signal));
  assert.equal(calls, 0);
});

function apiHarness({ refreshError, refreshResult, refreshRequest, setItem } = {}) {
  const events = [];
  const errors = [];
  const callbacks = {};
  const storage = new Map([['accessToken', 'test-existing-access'], ['refreshToken', 'test-existing-refresh']]);
  const api = async (request) => { events.push(['retry', request]); return { status: 200 }; };
  api.interceptors = {
    request: { use: (success, failure) => { callbacks.request = { success, failure }; } },
    response: { use: (success, failure) => { callbacks.response = { success, failure }; } },
  };
  const axios = {
    create: () => api,
    isAxiosError: (error) => !!error?.isAxiosError,
    post: async (...args) => {
      if (refreshRequest) return refreshRequest(...args);
      if (refreshError) throw refreshError;
      return { data: { result: refreshResult ?? { accessToken: 'test-access', refreshToken: 'test-refresh' } } };
    },
  };
  const exported = loadModule('services/api.ts', {
    axios: { default: axios },
    'expo-secure-store': {
      getItemAsync: async (key) => storage.get(key) ?? null,
      setItemAsync: async (key, value) => {
        if (setItem) await setItem(key, value);
        storage.set(key, value);
        events.push(['save', key]);
      },
      deleteItemAsync: async (key) => {
        storage.delete(key);
        events.push(['delete', key]);
      },
    },
    '../constants': { API_BASE_URL: 'https://example.invalid/api' },
    '../utils/logger': { logger: { log() {}, error: (...args) => errors.push(args) } },
  });
  return { events, errors, callbacks, exported, storage };
}

test('선택적 방문 요청도 401 때 토큰 갱신 후 같은 요청을 다시 보낸다', async () => {
  const state = apiHarness();
  const request = { headers: {}, suppressErrorLogging: true };
  await state.callbacks.response.failure({ config: request, response: { status: 401 }, message: 'expired' });
  assert.equal(request._retry, true);
  assert.equal(request.headers.Authorization, 'Bearer test-access');
  assert.equal(state.events.filter(([name]) => name === 'retry').length, 1);
  assert.equal(state.errors.length, 0);
});

test('방문 요청의 갱신 네트워크 실패는 로그/세션 삭제 없이 호출자에게 실패를 반환한다', async () => {
  const state = apiHarness({ refreshError: { isAxiosError: true, message: 'offline' } });
  await assert.rejects(() => state.callbacks.response.failure({
    config: { headers: {}, suppressErrorLogging: true }, response: { status: 401 }, message: 'expired',
  }));
  assert.equal(state.errors.length, 0);
  assert.equal(state.events.filter(([name]) => name === 'delete').length, 0);
});

test('방문 요청이라도 명확한 갱신 인증 실패는 세션 무효화를 유지한다', async () => {
  const state = apiHarness({ refreshError: { isAxiosError: true, response: { status: 401 } } });
  let invalidated = 0;
  state.exported.setSessionInvalidatedCallback(() => { invalidated += 1; });
  await assert.rejects(() => state.callbacks.response.failure({
    config: { headers: {}, suppressErrorLogging: true }, response: { status: 401 }, message: 'expired',
  }));
  assert.equal(invalidated, 1);
  assert.equal(state.events.filter(([name]) => name === 'delete').length, 2);
  assert.equal(state.errors.length, 0);
});

test('일반 요청의 인증 갱신 실패 로그 처리는 유지한다', async () => {
  const state = apiHarness({ refreshError: { isAxiosError: true, message: 'offline' } });
  await assert.rejects(() => state.callbacks.response.failure({
    config: { headers: {} }, response: { status: 401 }, message: 'expired',
  }));
  assert.equal(state.errors.length, 1);
});

test('취소된 방문 요청의 오래된 인증 실패는 새 세션을 무효화하지 않는다', async () => {
  const state = apiHarness({ refreshError: { isAxiosError: true, response: { status: 401 } } });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => state.callbacks.response.failure({
    config: { headers: {}, signal: controller.signal, suppressErrorLogging: true },
    response: { status: 401 }, message: 'expired',
  }));
  assert.equal(state.events.filter(([name]) => name === 'delete').length, 0);
  assert.equal(state.errors.length, 0);
});

test('이전 계정 갱신 응답이 새 로그인 완료 후 도착해도 새 토큰을 덮거나 삭제하지 않는다', async () => {
  const response = deferred();
  const state = apiHarness({ refreshRequest: () => response.promise });
  const pending = state.callbacks.response.failure({
    config: { headers: {}, suppressErrorLogging: true }, response: { status: 401 }, message: 'expired',
  });
  pending.catch(() => {});
  await flush();
  await state.exported.setSessionTokens({ accessToken: 'test-new-account-access', refreshToken: 'test-new-account-refresh' });
  response.resolve({ data: { result: { accessToken: 'test-old-account-access', refreshToken: 'test-old-account-refresh' } } });
  await assert.rejects(() => pending);
  assert.equal(state.storage.get('accessToken'), 'test-new-account-access');
  assert.equal(state.storage.get('refreshToken'), 'test-new-account-refresh');
  assert.equal(state.events.filter(([name]) => name === 'delete').length, 0);
  assert.equal(state.errors.length, 0);
});

test('이전 계정 갱신 인증 실패가 새 로그인 완료 후 도착해도 새 세션을 무효화하지 않는다', async () => {
  const response = deferred();
  const state = apiHarness({ refreshRequest: () => response.promise });
  const pending = state.callbacks.response.failure({
    config: { headers: {} }, response: { status: 401 }, message: 'expired',
  });
  pending.catch(() => {});
  await flush();
  await state.exported.setSessionTokens({ accessToken: 'test-new-account-access', refreshToken: 'test-new-account-refresh' });
  response.reject({ isAxiosError: true, response: { status: 401 } });
  await assert.rejects(() => pending);
  assert.equal(state.storage.get('refreshToken'), 'test-new-account-refresh');
  assert.equal(state.events.filter(([name]) => name === 'delete').length, 0);
});

test('로그아웃 후 늦은 갱신 성공이 삭제된 토큰을 되살리지 않는다', async () => {
  const response = deferred();
  const state = apiHarness({ refreshRequest: () => response.promise });
  const pending = state.exported.refreshTokenSingleFlight();
  pending.catch(() => {});
  await flush();
  await state.exported.clearSession();
  response.resolve({ data: { result: { accessToken: 'test-old-access', refreshToken: 'test-old-refresh' } } });
  await assert.rejects(() => pending);
  assert.equal(state.storage.size, 0);
});

test('갱신의 비동기 토큰 쓰기 도중 로그인해도 두 쓰기를 직렬화해 최종 토큰이 새 계정에 속한다', async () => {
  const started = deferred();
  const releaseWrite = deferred();
  const state = apiHarness({
    refreshResult: { accessToken: 'test-old-access', refreshToken: 'test-old-refresh' },
    setItem: async (key, value) => {
      if (key === 'accessToken' && value === 'test-old-access') {
        started.resolve();
        await releaseWrite.promise;
      }
    },
  });
  const oldRefresh = state.exported.refreshTokenSingleFlight();
  oldRefresh.catch(() => {});
  await started.promise;
  const login = state.exported.setSessionTokens({ accessToken: 'test-new-access', refreshToken: 'test-new-refresh' });
  releaseWrite.resolve();
  await login;
  await assert.rejects(() => oldRefresh);
  assert.equal(state.storage.get('accessToken'), 'test-new-access');
  assert.equal(state.storage.get('refreshToken'), 'test-new-refresh');
});

test('로그인 토큰 저장 도중 로그아웃해도 최종 상태에 토큰이 남지 않는다', async () => {
  const started = deferred();
  const releaseWrite = deferred();
  const state = apiHarness({ setItem: async (key) => {
    if (key === 'accessToken') {
      started.resolve();
      await releaseWrite.promise;
    }
  } });
  const login = state.exported.setSessionTokens({ accessToken: 'test-new-access', refreshToken: 'test-new-refresh' });
  await started.promise;
  const logout = state.exported.clearSession();
  releaseWrite.resolve();
  await Promise.all([login, logout]);
  assert.equal(state.storage.size, 0);
});

test('새 로그인 뒤 오래된 갱신 종료가 새 세션의 single-flight 대기를 해제하지 않는다', async () => {
  const first = deferred();
  const second = deferred();
  let refreshCalls = 0;
  const state = apiHarness({ refreshRequest: () => ++refreshCalls === 1 ? first.promise : second.promise });
  const oldRefresh = state.exported.refreshTokenSingleFlight();
  oldRefresh.catch(() => {});
  await flush();
  await state.exported.setSessionTokens({ accessToken: 'test-new-access', refreshToken: 'test-new-refresh' });
  const newRefresh = state.exported.refreshTokenSingleFlight();
  await flush();
  first.resolve({ data: { result: { accessToken: 'test-old-access', refreshToken: 'test-old-refresh' } } });
  await assert.rejects(() => oldRefresh);
  const sameRefresh = state.exported.refreshTokenSingleFlight();
  await flush();
  assert.equal(refreshCalls, 2);
  second.resolve({ data: { result: { accessToken: 'test-rotated-access', refreshToken: 'test-rotated-refresh' } } });
  await Promise.all([newRefresh, sameRefresh]);
  assert.equal(state.storage.get('refreshToken'), 'test-rotated-refresh');
});

test('갱신 인증 실패 전달과 인터셉터 정리 사이에 새 로그인해도 최신 토큰을 삭제하지 않는다', async () => {
  const response = deferred();
  const state = apiHarness({ refreshRequest: () => response.promise });
  const pending = state.callbacks.response.failure({
    config: { headers: {} }, response: { status: 401 }, message: 'expired',
  });
  pending.catch(() => {});
  await flush();
  response.reject({ isAxiosError: true, response: { status: 401 } });
  await Promise.resolve();
  await Promise.resolve();
  await state.exported.setSessionTokens({ accessToken: 'test-new-access', refreshToken: 'test-new-refresh' });
  await assert.rejects(() => pending);
  assert.equal(state.storage.get('accessToken'), 'test-new-access');
  assert.equal(state.storage.get('refreshToken'), 'test-new-refresh');
});

test('이전 세대 요청은 새 계정 토큰을 붙여 재전송하지 않는다', async () => {
  const state = apiHarness();
  const request = await state.callbacks.request.success({ headers: {} });
  await state.exported.setSessionTokens({ accessToken: 'test-new-access', refreshToken: 'test-new-refresh' });
  await assert.rejects(() => state.callbacks.request.success(request),
    (error) => state.exported.isSessionChangedError(error));
  await assert.rejects(() => state.callbacks.response.failure({
    config: request, response: { status: 401 }, message: 'expired',
  }), (error) => state.exported.isSessionChangedError(error));
  assert.equal(state.events.filter(([name]) => name === 'retry').length, 0);
  assert.equal(state.events.filter(([name]) => name === 'delete').length, 0);
});

function authStoreHarness(apiState, services = {}) {
  let auth;
  const errors = [];
  const store = () => auth;
  store.getState = () => auth;
  store.setState = (patch) => { auth = { ...auth, ...patch }; };
  const resetStore = { getState: () => ({ reset() {} }) };
  loadModule('stores/authStore.ts', {
    zustand: { create: (factory) => {
      auth = factory(store.setState);
      return store;
    } },
    'expo-secure-store': { getItemAsync: async (key) => apiState.storage.get(key) ?? null },
    axios: { default: { isAxiosError: (error) => !!error?.isAxiosError } },
    '../services': {
      authService: {
        loginWithKakao: async () => ({ accessToken: 'test-account-b-access', refreshToken: 'test-account-b-refresh', user: { id: 2 } }),
        exchangeCode: async () => ({ accessToken: 'test-account-b-access', refreshToken: 'test-account-b-refresh', isNewUser: false, termsAgreed: true, privacyAgreed: true }),
        logout: async () => {},
        ...services.authService,
      },
      userService: { getMe: async () => ({ id: apiState.storage.get('accessToken') === 'test-account-b-access' ? 2 : 1 }), ...services.userService },
    },
    '../services/api': apiState.exported,
    '../utils/logger': { logger: { log() {}, error: (...args) => errors.push(args) } },
    './medicationStore': { useMedicationStore: resetStore },
    './supplementStore': { useSupplementStore: resetStore },
    './analysisStore': { useAnalysisStore: resetStore },
    './familyStore': { useFamilyStore: resetStore },
  });
  return { store, errors };
}

test('실제 OAuth store의 이전 대기 저장 취소가 새 로그인 토큰/상태를 지우지 않는다', async () => {
  const started = deferred();
  const releaseWrite = deferred();
  const apiState = apiHarness({ setItem: async (_key, value) => {
    if (value === 'test-held-access') { started.resolve(); await releaseWrite.promise; }
  } });
  const { store, errors } = authStoreHarness(apiState);
  const held = apiState.exported.setSessionTokens({ accessToken: 'test-held-access', refreshToken: 'test-held-refresh' });
  await started.promise;
  const first = store.getState().handleOAuthCallback('test-account-a-access', 'test-account-a-refresh', true);
  first.catch(() => {});
  const second = store.getState().handleOAuthCallback('test-account-b-access', 'test-account-b-refresh', false);
  releaseWrite.resolve();
  await Promise.all([held, second]);
  await assert.rejects(() => first, (error) => apiState.exported.isSessionChangedError(error));
  assert.equal(apiState.storage.get('refreshToken'), 'test-account-b-refresh');
  assert.equal(store.getState().user.id, 2);
  assert.equal(store.getState().isAuthenticated, true);
  assert.equal(store.getState().error, null);
  assert.equal(errors.length, 0);
});

test('이전 OAuth 사용자 조회의 늦은 성공이 새 로그인 사용자/온보딩 상태를 덮지 않는다', async () => {
  const firstUser = deferred();
  let userCalls = 0;
  const apiState = apiHarness();
  const { store, errors } = authStoreHarness(apiState, { userService: {
    getMe: () => ++userCalls === 1 ? firstUser.promise : Promise.resolve({ id: 2 }),
  } });
  const first = store.getState().handleOAuthCallback('test-account-a-access', 'test-account-a-refresh', true);
  first.catch(() => {});
  await flush();
  await store.getState().handleOAuthCallback('test-account-b-access', 'test-account-b-refresh', false);
  firstUser.resolve({ id: 1 });
  await assert.rejects(() => first, (error) => apiState.exported.isSessionChangedError(error));
  assert.equal(store.getState().user.id, 2);
  assert.equal(store.getState().needsOnboarding, false);
  assert.equal(apiState.storage.get('refreshToken'), 'test-account-b-refresh');
  assert.equal(errors.length, 0);
});

test('이전 코드 교환 실패는 완료된 새 로그인 세션을 삭제하거나 오류 상태로 바꾸지 않는다', async () => {
  const firstResponse = deferred();
  let calls = 0;
  const apiState = apiHarness();
  const { store, errors } = authStoreHarness(apiState, { authService: { exchangeCode: () => ++calls === 1
    ? firstResponse.promise : Promise.resolve({ accessToken: 'test-account-b-access', refreshToken: 'test-account-b-refresh', isNewUser: false, termsAgreed: true, privacyAgreed: true }) } });
  const first = store.getState().exchangeCodeAndLogin('test-code-a');
  first.catch(() => {});
  await store.getState().exchangeCodeAndLogin('test-code-b');
  firstResponse.reject(new Error('old request failed'));
  await assert.rejects(() => first, (error) => apiState.exported.isSessionChangedError(error));
  assert.equal(apiState.storage.get('refreshToken'), 'test-account-b-refresh');
  assert.equal(store.getState().user.id, 2);
  assert.equal(store.getState().isAuthenticated, true);
  assert.equal(store.getState().error, null);
  assert.equal(errors.length, 0);
});

test('이전 초기화 사용자 조회가 늦게 도착해도 새 로그인 상태를 덮지 않는다', async () => {
  const firstUser = deferred();
  let calls = 0;
  const apiState = apiHarness();
  const { store, errors } = authStoreHarness(apiState, { userService: { getMe: () => ++calls === 1
    ? firstUser.promise : Promise.resolve({ id: 2 }) } });
  const initialization = store.getState().initialize();
  await flush();
  await store.getState().handleOAuthCallback('test-account-b-access', 'test-account-b-refresh', false);
  firstUser.resolve({ id: 1 });
  await initialization;
  assert.equal(store.getState().user.id, 2);
  assert.equal(errors.length, 0);
});

test('이전 카카오 로그인 응답이 늦게 와도 새 로그인 토큰/사용자를 덮지 않는다', async () => {
  const firstResponse = deferred();
  const apiState = apiHarness();
  const { store, errors } = authStoreHarness(apiState, { authService: { loginWithKakao: () => firstResponse.promise } });
  const first = store.getState().loginWithKakao('test-kakao-a');
  await store.getState().handleOAuthCallback('test-account-b-access', 'test-account-b-refresh', false);
  firstResponse.resolve({ accessToken: 'test-account-a-access', refreshToken: 'test-account-a-refresh', user: { id: 1 } });
  await first;
  assert.equal(apiState.storage.get('refreshToken'), 'test-account-b-refresh');
  assert.equal(store.getState().user.id, 2);
  assert.equal(errors.length, 0);
});

test('이전 로그아웃의 늦은 종료가 새 로그인 토큰/상태를 지우지 않는다', async () => {
  const response = deferred();
  const apiState = apiHarness();
  const { store } = authStoreHarness(apiState, { authService: { logout: () => response.promise } });
  const logout = store.getState().logout();
  await store.getState().handleOAuthCallback('test-account-b-access', 'test-account-b-refresh', false);
  response.resolve();
  await logout;
  assert.equal(apiState.storage.get('refreshToken'), 'test-account-b-refresh');
  assert.equal(store.getState().user.id, 2);
  assert.equal(store.getState().isAuthenticated, true);
});

test('현재 OAuth 로그인의 실제 실패는 토큰 삭제와 오류 표시를 유지한다', async () => {
  const apiState = apiHarness();
  const { store, errors } = authStoreHarness(apiState, { userService: { getMe: async () => { throw new Error('current failure'); } } });
  await assert.rejects(() => store.getState().handleOAuthCallback('test-account-a-access', 'test-account-a-refresh', false));
  assert.equal(apiState.storage.size, 0);
  assert.equal(store.getState().isLoading, false);
  assert.equal(errors.length, 1);
});

test('훅이 Zustand 인증과 AppState를 연결하고 해제할 때 두 구독을 정리한다', () => {
  const events = [];
  let authListener;
  let appListener;
  let cleanup;
  let auth = { isLoading: true, isAuthenticated: false, user: null };
  class Tracker {
    setSession(value) { events.push(['session', value]); }
    setForeground(value) { events.push(['foreground', value]); }
    dispose() { events.push(['dispose']); }
  }
  const { useDailyVisitTracking } = loadModule('hooks/useDailyVisitTracking.ts', {
    react: { useEffect: (effect) => { cleanup = effect(); } },
    'react-native': { AppState: {
      currentState: 'background',
      addEventListener: (_event, listener) => {
        appListener = listener;
        return { remove: () => events.push(['removeApp']) };
      },
    } },
    '../stores/authStore': { useAuthStore: {
      getState: () => auth,
      subscribe: (listener) => {
        authListener = listener;
        return () => events.push(['removeAuth']);
      },
    } },
    '../services/visit': { visitService: { createVisit() {} } },
    '../utils/dailyVisitTracker': { DailyVisitTracker: Tracker },
  });
  useDailyVisitTracking();
  assert.equal(events[0][1], null);
  assert.equal(events[1][1], false);
  auth = { isLoading: false, isAuthenticated: true, user: { id: 1 } };
  authListener();
  appListener('active');
  assert.equal(events[2][1], 1);
  assert.equal(events[3][1], true);
  cleanup();
  assert.equal(events.slice(-3).map(([name]) => name).join(','), 'removeAuth,removeApp,dispose');
});
