import { create } from 'zustand';
import {
  FamilyLinkStatus,
  FamilyTodaySchedule,
  TodaySchedule,
  MonthlySummaryResponse,
  FamilyNotificationSettings,
  SendRequestResult,
} from '../types';
import { familyService } from '../services';
import { logger } from '../utils/logger';

// 캐시 만료 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

interface FamilyState {
  // 가족 연동 현황
  linkStatus: FamilyLinkStatus | null;
  isLoadingStatus: boolean;

  // 선택된 가족의 스케줄
  selectedFamilySchedule: FamilyTodaySchedule | null;
  isLoadingSchedule: boolean;

  // 선택된 가족의 날짜별 스케줄 캐시
  scheduleCache: Map<string, TodaySchedule[]>;
  scheduleCacheExpiry: Map<string, number>;

  // 선택된 가족의 월별 요약 캐시
  familyMonthlySummaryCache: Map<string, MonthlySummaryResponse>;
  familyMonthlySummaryCacheExpiry: Map<string, number>;

  // 가족 알림 설정
  notificationSettings: FamilyNotificationSettings | null;

  // 에러 상태
  error: string | null;

  // Actions
  fetchLinkStatus: () => Promise<void>;
  sendLinkRequest: (phone: string) => Promise<SendRequestResult>;
  cancelRequest: (requestId: number) => Promise<void>;
  acceptRequest: (requestId: number) => Promise<void>;
  rejectRequest: (requestId: number) => Promise<void>;
  unlinkFamily: (linkId: number) => Promise<void>;
  fetchFamilyTodaySchedule: (userId: number) => Promise<void>;
  fetchFamilyScheduleForDate: (userId: number, date: string) => Promise<TodaySchedule[]>;
  fetchFamilyMonthlySummary: (userId: number, year: number, month: number) => Promise<MonthlySummaryResponse>;
  fetchNotificationSettings: () => Promise<void>;
  updateNotificationSettings: (enabled: boolean) => Promise<void>;
  clearError: () => void;
  invalidateCache: () => void;
  reset: () => void;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  linkStatus: null,
  isLoadingStatus: false,
  selectedFamilySchedule: null,
  isLoadingSchedule: false,
  scheduleCache: new Map(),
  scheduleCacheExpiry: new Map(),
  familyMonthlySummaryCache: new Map(),
  familyMonthlySummaryCacheExpiry: new Map(),
  notificationSettings: null,
  error: null,

  fetchLinkStatus: async () => {
    try {
      set({ isLoadingStatus: true, error: null });
      const status = await familyService.getLinkStatus();
      set({ linkStatus: status, isLoadingStatus: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : '가족 연동 현황을 불러오는데 실패했습니다.';
      logger.error('[FamilyStore] fetchLinkStatus error:', error);
      set({ isLoadingStatus: false, error: message });
    }
  },

  sendLinkRequest: async (phone: string) => {
    try {
      set({ error: null });
      const result = await familyService.sendLinkRequest(phone);
      // 상태 갱신
      await get().fetchLinkStatus();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : '가족 연동 요청에 실패했습니다.';
      logger.error('[FamilyStore] sendLinkRequest error:', error);
      set({ error: message });
      throw error;
    }
  },

  cancelRequest: async (requestId: number) => {
    try {
      set({ error: null });
      await familyService.cancelRequest(requestId);
      // 상태 갱신
      await get().fetchLinkStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : '요청 취소에 실패했습니다.';
      logger.error('[FamilyStore] cancelRequest error:', error);
      set({ error: message });
      throw error;
    }
  },

  acceptRequest: async (requestId: number) => {
    try {
      set({ error: null });
      await familyService.acceptRequest(requestId);
      // 상태 갱신
      await get().fetchLinkStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : '요청 수락에 실패했습니다.';
      logger.error('[FamilyStore] acceptRequest error:', error);
      set({ error: message });
      throw error;
    }
  },

  rejectRequest: async (requestId: number) => {
    try {
      set({ error: null });
      await familyService.rejectRequest(requestId);
      // 상태 갱신
      await get().fetchLinkStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : '요청 거절에 실패했습니다.';
      logger.error('[FamilyStore] rejectRequest error:', error);
      set({ error: message });
      throw error;
    }
  },

  unlinkFamily: async (linkId: number) => {
    try {
      set({ error: null });
      await familyService.unlinkFamily(linkId);
      // 캐시 초기화 및 상태 갱신
      get().invalidateCache();
      set({ selectedFamilySchedule: null });
      await get().fetchLinkStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : '가족 연동 해제에 실패했습니다.';
      logger.error('[FamilyStore] unlinkFamily error:', error);
      set({ error: message });
      throw error;
    }
  },

  fetchFamilyTodaySchedule: async (userId: number) => {
    try {
      set({ isLoadingSchedule: true, error: null });
      const schedule = await familyService.getFamilyTodaySchedule(userId);
      set({ selectedFamilySchedule: schedule, isLoadingSchedule: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : '가족의 복약 스케줄을 불러오는데 실패했습니다.';
      logger.error('[FamilyStore] fetchFamilyTodaySchedule error:', error);
      set({ isLoadingSchedule: false, error: message });
    }
  },

  fetchFamilyScheduleForDate: async (userId: number, date: string) => {
    const { scheduleCache, scheduleCacheExpiry } = get();
    const now = Date.now();
    const cacheKey = `${userId}-${date}`;

    // 캐시 유효성 확인
    const cachedExpiry = scheduleCacheExpiry.get(cacheKey);
    if (cachedExpiry && cachedExpiry > now) {
      const cached = scheduleCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 캐시 없거나 만료 -> API 호출
    set({ isLoadingSchedule: true });
    try {
      const schedules = await familyService.getFamilyScheduleForDate(userId, date);

      // 캐시 저장
      const newCache = new Map(scheduleCache);
      const newExpiry = new Map(scheduleCacheExpiry);
      newCache.set(cacheKey, schedules);
      newExpiry.set(cacheKey, now + CACHE_DURATION);

      set({
        scheduleCache: newCache,
        scheduleCacheExpiry: newExpiry,
        isLoadingSchedule: false,
      });

      return schedules;
    } catch (error) {
      set({ isLoadingSchedule: false });
      logger.error('[FamilyStore] fetchFamilyScheduleForDate error:', error);
      return [];
    }
  },

  fetchFamilyMonthlySummary: async (userId: number, year: number, month: number) => {
    const { familyMonthlySummaryCache, familyMonthlySummaryCacheExpiry } = get();
    const now = Date.now();
    const cacheKey = `${userId}-${year}-${String(month).padStart(2, '0')}`;

    // 캐시 유효성 확인
    const cachedExpiry = familyMonthlySummaryCacheExpiry.get(cacheKey);
    if (cachedExpiry && cachedExpiry > now) {
      const cached = familyMonthlySummaryCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 캐시 없거나 만료 -> API 호출
    try {
      const data = await familyService.getFamilyMonthlySummary(userId, year, month);

      // 캐시 저장
      const newCache = new Map(familyMonthlySummaryCache);
      const newExpiry = new Map(familyMonthlySummaryCacheExpiry);
      newCache.set(cacheKey, data);
      newExpiry.set(cacheKey, now + CACHE_DURATION);

      set({
        familyMonthlySummaryCache: newCache,
        familyMonthlySummaryCacheExpiry: newExpiry,
      });

      return data;
    } catch (error) {
      logger.error('[FamilyStore] fetchFamilyMonthlySummary error:', error);
      throw error;
    }
  },

  fetchNotificationSettings: async () => {
    try {
      const settings = await familyService.getNotificationSettings();
      set({ notificationSettings: settings });
    } catch (error) {
      logger.error('[FamilyStore] fetchNotificationSettings error:', error);
    }
  },

  updateNotificationSettings: async (enabled: boolean) => {
    try {
      await familyService.updateNotificationSettings(enabled);
      set({ notificationSettings: { familyNotificationEnabled: enabled } });
    } catch (error) {
      const message = error instanceof Error ? error.message : '알림 설정 변경에 실패했습니다.';
      logger.error('[FamilyStore] updateNotificationSettings error:', error);
      set({ error: message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  invalidateCache: () => {
    set({
      scheduleCache: new Map(),
      scheduleCacheExpiry: new Map(),
      familyMonthlySummaryCache: new Map(),
      familyMonthlySummaryCacheExpiry: new Map(),
    });
  },

  // 스토어 초기화 (로그아웃 시 호출)
  reset: () => set({
    linkStatus: null,
    isLoadingStatus: false,
    selectedFamilySchedule: null,
    isLoadingSchedule: false,
    scheduleCache: new Map(),
    scheduleCacheExpiry: new Map(),
    familyMonthlySummaryCache: new Map(),
    familyMonthlySummaryCacheExpiry: new Map(),
    notificationSettings: null,
    error: null,
  }),
}));
