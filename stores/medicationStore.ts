import { create } from 'zustand';
import {
  MedicationListItem,
  Medication,
  TodayResponse,
  TodaySchedule,
  ScanResult,
  CreateMedicationRequest,
  MedicationTiming,
} from '../types';
import { medicationService, intakeService, prescriptionService } from '../services';

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
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  todayData: null,
  currentScanResult: null,
  currentPrescriptionId: null,
  isLoading: false,
  error: null,
  scanError: null,

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
}));
