import { create } from 'zustand';
import {
  MedicationListItem,
  Medication,
  TodayResponse,
  TodaySchedule,
  ScanResult,
  CreateMedicationRequest,
  MedicationTiming,
  IntakesResponse,
  MonthlySummaryResponse,
  BatchDeleteResult,
} from '../types';
import { medicationService, intakeService, prescriptionService } from '../services';
import { logger } from '../utils/logger';
import { getTodayString } from '../utils/dateUtils';

// 캐시 만료 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

interface MedicationState {
  // 약 목록 (간략)
  medications: MedicationListItem[];
  // 오늘의 복약 현황
  todayData: TodayResponse | null;
  // 오늘 스케줄 캐시 만료 시간
  todayDataExpiry: number;
  // 처방전 스캔 결과
  currentScanResult: ScanResult | null;
  // 스캔한 이미지 URI (등록 시 업로드용)
  currentImageUri: string | null;
  // 현재 처리 중인 처방전 ID
  currentPrescriptionId: number | null;
  // 로딩/에러 상태
  isLoading: boolean;
  error: string | null;
  // 스캔 에러 상태 (에러 오버레이용)
  scanError: string | null;
  // 데이터 갱신 필요 플래그 (약 등록/삭제 후 medications 탭에서 조건부 로드용)
  needsRefresh: boolean;

  // 날짜별 스케줄 캐시
  scheduleCache: Map<string, TodaySchedule[]>;
  cacheExpiry: Map<string, number>;
  isLoadingSchedule: boolean;

  // 월별 복약 상태 캐시 (캘린더용)
  monthlySummaryCache: Map<string, MonthlySummaryResponse>;
  monthlySummaryCacheExpiry: Map<string, number>;

  // Actions
  fetchMedications: () => Promise<void>;
  fetchTodaySchedule: () => Promise<void>;
  getMedicationDetail: (id: number) => Promise<Medication>;
  scanPrescription: (imageUri: string) => Promise<ScanResult>;
  addMedication: (medication: CreateMedicationRequest) => Promise<void>;
  updateMedication: (id: number, data: Partial<CreateMedicationRequest>) => Promise<void>;
  deleteMedication: (id: number) => Promise<void>;
  deleteMedicationsBatch: (ids: number[]) => Promise<BatchDeleteResult>;
  recordIntake: (medicationIds: number[], timing: MedicationTiming, date?: string) => Promise<void>;
  clearScanResult: () => void;
  clearError: () => void;
  clearScanError: () => void;
  clearNeedsRefresh: () => void;

  // 캐시 관련 Actions
  fetchScheduleForDate: (date: string) => Promise<TodaySchedule[]>;
  invalidateCache: (date?: string) => void;
  fetchMonthlySummary: (year: number, month: number) => Promise<MonthlySummaryResponse>;
  invalidateMonthlySummary: (yearMonth?: string) => void;
  invalidateScheduleCache: () => void;
  invalidateMonthlySummaryCache: (yearMonth?: string) => void;
  reset: () => void;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  todayData: null,
  todayDataExpiry: 0,
  currentScanResult: null,
  currentImageUri: null,
  currentPrescriptionId: null,
  isLoading: false,
  error: null,
  scanError: null,
  needsRefresh: false,
  scheduleCache: new Map(),
  cacheExpiry: new Map(),
  isLoadingSchedule: false,
  monthlySummaryCache: new Map(),
  monthlySummaryCacheExpiry: new Map(),

  fetchMedications: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await medicationService.getMedications();
      set({ medications: response.medications, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : '약 목록을 불러오는데 실패했습니다.';
      set({ isLoading: false, error: message });
    }
  },

  fetchTodaySchedule: async (forceRefresh = false) => {
    const { todayData, todayDataExpiry } = get();
    const now = Date.now();

    // 강제 새로고침이 아니고 캐시가 유효하면 API 호출 건너뜀
    if (!forceRefresh && todayData && todayDataExpiry > now) {
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const newTodayData = await medicationService.getTodaySchedule();
      set({
        todayData: newTodayData,
        todayDataExpiry: now + CACHE_DURATION,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '오늘의 약을 불러오는데 실패했습니다.';
      set({ isLoading: false, error: message });
    }
  },

  getMedicationDetail: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      const medication = await medicationService.getMedication(id);
      set({ isLoading: false });
      return medication;
    } catch (error) {
      const message = error instanceof Error ? error.message : '약 정보를 불러오는데 실패했습니다.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  scanPrescription: async (imageUri: string) => {
    set({ isLoading: true, error: null, scanError: null });

    try {
      // AI 스캔만 수행 (이미지 업로드는 등록 시점에 수행)
      const result = await medicationService.scanPrescription(imageUri);
      set({
        currentScanResult: result,
        currentImageUri: imageUri,  // 나중에 등록할 때 사용
        isLoading: false,
      });
      logger.log('[Store] Scan completed, imageUri saved for later upload');
      return result;
    } catch (error: any) {
      const message = error.message || '처방전 스캔에 실패했습니다.';
      set({
        isLoading: false,
        scanError: message,
      });
      throw error;
    }
  },

  addMedication: async (medication: CreateMedicationRequest) => {
    try {
      set({ isLoading: true, error: null });

      // medication에 prescriptionId가 있으면 그것을 사용, 없으면 store의 currentPrescriptionId 사용
      const prescriptionId = medication.prescriptionId ?? get().currentPrescriptionId;
      const medicationWithPrescription = prescriptionId
        ? { ...medication, prescriptionId }
        : medication;

      await medicationService.createMedication(medicationWithPrescription);
      // 캐시 무효화 및 데이터 갱신 (강제 새로고침)
      get().invalidateCache();
      await Promise.all([
        get().fetchMedications(),
        get().fetchTodaySchedule(true), // 강제 새로고침
      ]);
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : '약 등록에 실패했습니다.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  updateMedication: async (id: number, data: Partial<CreateMedicationRequest>) => {
    try {
      set({ isLoading: true, error: null });

      // 서버 업데이트 후 응답으로 로컬 상태 업데이트
      const updated = await medicationService.updateMedication(id, data);

      // 로컬 상태 부분 업데이트
      const { medications } = get();
      const updatedMedications = medications.map((med) =>
        med.id === id
          ? { ...med, name: updated.name, displayName: updated.displayName }
          : med
      );

      set({ medications: updatedMedications, isLoading: false });

      // 관련 캐시 무효화 및 오늘 스케줄 새로고침
      get().invalidateCache();
      await get().fetchTodaySchedule();
    } catch (error) {
      const message = error instanceof Error ? error.message : '약 수정에 실패했습니다.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  deleteMedication: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await medicationService.deleteMedication(id);
      set((state) => ({
        medications: state.medications.filter((m) => m.id !== id),
        isLoading: false,
      }));
      // 캐시 무효화 후 새로고침
      get().invalidateCache();
      set({ todayDataExpiry: 0 });
      await get().fetchTodaySchedule();
    } catch (error) {
      const message = error instanceof Error ? error.message : '약 삭제에 실패했습니다.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  deleteMedicationsBatch: async (ids: number[]) => {
    try {
      set({ isLoading: true, error: null });
      const result = await medicationService.deleteMedicationsBatch(ids);
      // 로컬 상태에서 삭제된 항목 제거
      set((state) => ({
        medications: state.medications.filter((m) => !ids.includes(m.id)),
        isLoading: false,
      }));
      // 오늘 스케줄 새로고침
      set({ todayDataExpiry: 0 });
      await get().fetchTodaySchedule();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : '약 일괄 삭제에 실패했습니다.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  recordIntake: async (medicationIds: number[], timing: MedicationTiming, date?: string) => {
    const { todayData } = get();
    const today = getTodayString(); // 로컬 타임존 기준 오늘 날짜

    // 이전 상태 저장 (롤백용 - deep copy)
    const previousTodayData = todayData
      ? {
          ...todayData,
          schedules: todayData.schedules?.map(s => ({
            ...s,
            medications: [...s.medications],
          })),
        }
      : null;
    const isToday = !date || date === today;

    // 낙관적 업데이트 (오늘 날짜일 때만 UI 먼저 반영)
    if (isToday && todayData?.schedules) {
      const updatedSchedules = todayData.schedules.map((schedule) => {
        if (schedule.timing === timing) {
          const updatedMedications = schedule.medications.map((med) =>
            medicationIds.includes(med.id) ? { ...med, taken: true } : med
          );
          const allTaken = updatedMedications.every((med) => med.taken);
          return { ...schedule, medications: updatedMedications, allTaken };
        }
        return schedule;
      });

      set({
        todayData: { ...todayData, schedules: updatedSchedules },
        // 낙관적 업데이트 시 캐시 유효기간 갱신 → fetchTodaySchedule 재요청 방지
        todayDataExpiry: Date.now() + CACHE_DURATION,
      });
    }

    try {
      // 미래 날짜 복용 기록 방지
      if (date && date > today) {
        throw new Error('미래 날짜에는 복용 기록을 할 수 없습니다.');
      }

      // 선택된 날짜 기준으로 takenAt 생성 (과거 날짜 복용 기록 지원)
      let takenAt: string | undefined;
      if (date && date !== today) {
        // 선택된 날짜의 현재 시각으로 takenAt 생성
        const now = new Date();
        takenAt = `${date}T${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      }

      // 서버 호출
      await intakeService.markAsTaken(medicationIds, timing, takenAt);

      // 성공 시 날짜별 스케줄 캐시만 무효화 (todayData는 낙관적 업데이트 유지)
      get().invalidateCache(date || today);
      // 월별 요약 캐시 무효화 (주간 달력 상태 반영용)
      get().invalidateMonthlySummary();
    } catch (error) {
      // 실패 시 롤백
      logger.error('Failed to record intake, rolling back:', error);

      if (isToday && previousTodayData) {
        set({ todayData: previousTodayData, todayDataExpiry: 0 });
      }

      const message = error instanceof Error ? error.message : '복약 기록에 실패했습니다.';
      set({ error: message });
      throw error;
    }
  },

  clearScanResult: () => set({ currentScanResult: null, currentImageUri: null, currentPrescriptionId: null }),
  clearError: () => set({ error: null }),
  clearScanError: () => set({ scanError: null }),
  clearNeedsRefresh: () => set({ needsRefresh: false }),

  // 날짜별 스케줄 가져오기 (캐시 적용)
  fetchScheduleForDate: async (date: string) => {
    const { scheduleCache, cacheExpiry, todayData } = get();
    const now = Date.now();
    const today = getTodayString(); // 로컬 타임존 기준 오늘 날짜

    // 오늘 날짜면 todayData 사용
    if (date === today && todayData?.schedules) {
      return todayData.schedules;
    }

    // 캐시 유효성 확인
    const cachedExpiry = cacheExpiry.get(date);
    if (cachedExpiry && cachedExpiry > now) {
      const cached = scheduleCache.get(date);
      if (cached) {
        return cached;
      }
    }

    // 캐시 없거나 만료 → API 호출
    set({ isLoadingSchedule: true });
    try {
      const data = await intakeService.getIntakesByDate(date);
      const schedules = data.schedules || [];

      // 캐시 저장
      const newCache = new Map(scheduleCache);
      const newExpiry = new Map(cacheExpiry);
      newCache.set(date, schedules);
      newExpiry.set(date, now + CACHE_DURATION);

      set({
        scheduleCache: newCache,
        cacheExpiry: newExpiry,
        isLoadingSchedule: false,
      });

      return schedules;
    } catch (error) {
      set({ isLoadingSchedule: false });
      logger.error('Failed to fetch schedule for date:', error);
      return [];
    }
  },

  // 캐시 무효화
  invalidateCache: (date?: string) => {
    const { scheduleCache, cacheExpiry } = get();
    const newCache = new Map(scheduleCache);
    const newExpiry = new Map(cacheExpiry);

    if (date) {
      // 특정 날짜만 무효화
      newCache.delete(date);
      newExpiry.delete(date);
    } else {
      // 전체 무효화
      newCache.clear();
      newExpiry.clear();
    }

    set({ scheduleCache: newCache, cacheExpiry: newExpiry });
  },

  // 월별 복약 상태 가져오기 (캐시 적용, 캘린더용)
  fetchMonthlySummary: async (year: number, month: number) => {
    const { monthlySummaryCache, monthlySummaryCacheExpiry } = get();
    const now = Date.now();
    const cacheKey = `${year}-${String(month).padStart(2, '0')}`;

    // 캐시 유효성 확인
    const cachedExpiry = monthlySummaryCacheExpiry.get(cacheKey);
    if (cachedExpiry && cachedExpiry > now) {
      const cached = monthlySummaryCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // 캐시 없거나 만료 → API 호출
    try {
      const data = await intakeService.getMonthlySummary(year, month);

      // 캐시 저장
      const newCache = new Map(monthlySummaryCache);
      const newExpiry = new Map(monthlySummaryCacheExpiry);
      newCache.set(cacheKey, data);
      newExpiry.set(cacheKey, now + CACHE_DURATION);

      set({
        monthlySummaryCache: newCache,
        monthlySummaryCacheExpiry: newExpiry,
      });

      return data;
    } catch (error) {
      logger.error('Failed to fetch monthly summary:', error);
      throw error;
    }
  },

  // 월별 복약 상태 캐시 무효화
  invalidateMonthlySummary: (yearMonth?: string) => {
    const { monthlySummaryCache, monthlySummaryCacheExpiry } = get();
    const newCache = new Map(monthlySummaryCache);
    const newExpiry = new Map(monthlySummaryCacheExpiry);

    if (yearMonth) {
      // 특정 월만 무효화
      newCache.delete(yearMonth);
      newExpiry.delete(yearMonth);
    } else {
      // 전체 무효화
      newCache.clear();
      newExpiry.clear();
    }

    set({ monthlySummaryCache: newCache, monthlySummaryCacheExpiry: newExpiry });
  },

  // 스케줄 캐시 무효화 (외부 호출용)
  invalidateScheduleCache: () => {
    set({
      scheduleCache: new Map(),
      cacheExpiry: new Map(),
      todayData: null,
      todayDataExpiry: 0,
    });
  },

  // 월별 복약 캐시 무효화 (외부 호출용)
  invalidateMonthlySummaryCache: (yearMonth?: string) => {
    const { monthlySummaryCache, monthlySummaryCacheExpiry } = get();
    const newCache = new Map(monthlySummaryCache);
    const newExpiry = new Map(monthlySummaryCacheExpiry);

    if (yearMonth) {
      // 특정 월만 무효화
      newCache.delete(yearMonth);
      newExpiry.delete(yearMonth);
    } else {
      // 전체 무효화
      newCache.clear();
      newExpiry.clear();
    }

    set({ monthlySummaryCache: newCache, monthlySummaryCacheExpiry: newExpiry });
  },

  // 스토어 전체 초기화 (로그아웃 시 호출)
  reset: () => set({
    medications: [],
    todayData: null,
    todayDataExpiry: 0,
    currentScanResult: null,
    currentImageUri: null,
    currentPrescriptionId: null,
    isLoading: false,
    error: null,
    scanError: null,
    needsRefresh: false,
    scheduleCache: new Map(),
    cacheExpiry: new Map(),
    isLoadingSchedule: false,
    monthlySummaryCache: new Map(),
    monthlySummaryCacheExpiry: new Map(),
  }),
}));
