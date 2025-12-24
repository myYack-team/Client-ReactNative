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
} from '../types';
import { medicationService, intakeService, prescriptionService } from '../services';

// 캐시 만료 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

interface MedicationState {
  // 약 목록 (간략)
  medications: MedicationListItem[];
  // 오늘의 복약 현황
  todayData: TodayResponse | null;
  // 처방전 스캔 결과
  currentScanResult: ScanResult | null;
  // 현재 처리 중인 처방전 ID
  currentPrescriptionId: number | null;
  // 로딩/에러 상태
  isLoading: boolean;
  error: string | null;
  // 스캔 에러 상태 (에러 오버레이용)
  scanError: string | null;

  // 날짜별 스케줄 캐시
  scheduleCache: Map<string, TodaySchedule[]>;
  cacheExpiry: Map<string, number>;
  isLoadingSchedule: boolean;

  // Actions
  fetchMedications: () => Promise<void>;
  fetchTodaySchedule: () => Promise<void>;
  getMedicationDetail: (id: number) => Promise<Medication>;
  scanPrescription: (imageUri: string) => Promise<ScanResult>;
  addMedication: (medication: CreateMedicationRequest) => Promise<void>;
  updateMedication: (id: number, data: Partial<CreateMedicationRequest>) => Promise<void>;
  deleteMedication: (id: number) => Promise<void>;
  recordIntake: (medicationIds: number[], timing: MedicationTiming) => Promise<void>;
  clearScanResult: () => void;
  clearError: () => void;
  clearScanError: () => void;

  // 캐시 관련 Actions
  fetchScheduleForDate: (date: string) => Promise<TodaySchedule[]>;
  invalidateCache: (date?: string) => void;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  todayData: null,
  currentScanResult: null,
  currentPrescriptionId: null,
  isLoading: false,
  error: null,
  scanError: null,
  scheduleCache: new Map(),
  cacheExpiry: new Map(),
  isLoadingSchedule: false,

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

  fetchTodaySchedule: async () => {
    try {
      set({ isLoading: true, error: null });
      const todayData = await medicationService.getTodaySchedule();
      set({ todayData, isLoading: false });
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
      // 1. 처방전 이미지를 서버에 업로드 (저장용)
      const uploadResult = await prescriptionService.uploadImage(imageUri);
      if (!uploadResult?.id) {
        throw new Error('이미지 업로드에 실패했습니다.');
      }
      const prescriptionId = uploadResult.id;
      set({ currentPrescriptionId: prescriptionId });
      console.log('[Store] Prescription uploaded, id:', prescriptionId);

      // 2. 이미지 분석 (AI 스캔)
      const result = await medicationService.scanPrescription(imageUri);
      set({ currentScanResult: result, isLoading: false });
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

      // 현재 처방전 ID가 있으면 약품에 연결
      const prescriptionId = get().currentPrescriptionId;
      const medicationWithPrescription = prescriptionId
        ? { ...medication, prescriptionId }
        : medication;

      await medicationService.createMedication(medicationWithPrescription);
      // 목록 새로고침
      await get().fetchMedications();
      await get().fetchTodaySchedule();
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
      await medicationService.updateMedication(id, data);
      await get().fetchMedications();
      await get().fetchTodaySchedule();
      set({ isLoading: false });
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
      await get().fetchTodaySchedule();
    } catch (error) {
      const message = error instanceof Error ? error.message : '약 삭제에 실패했습니다.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  recordIntake: async (medicationIds: number[], timing: MedicationTiming) => {
    try {
      set({ isLoading: true, error: null });
      await intakeService.markAsTaken(medicationIds, timing);
      await get().fetchTodaySchedule();

      // 오늘 날짜 캐시 무효화
      const today = new Date().toISOString().split('T')[0];
      get().invalidateCache(today);

      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : '복약 기록에 실패했습니다.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  clearScanResult: () => set({ currentScanResult: null, currentPrescriptionId: null }),
  clearError: () => set({ error: null }),
  clearScanError: () => set({ scanError: null }),

  // 날짜별 스케줄 가져오기 (캐시 적용)
  fetchScheduleForDate: async (date: string) => {
    const { scheduleCache, cacheExpiry, todayData } = get();
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

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
      console.error('Failed to fetch schedule for date:', error);
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
}));
