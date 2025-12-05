import { create } from 'zustand';
import { Medication, TodayMedication, ScanResult } from '../types';
import { medicationService, intakeService } from '../services';

interface MedicationState {
  medications: Medication[];
  todayMedications: TodayMedication[];
  currentScanResult: ScanResult | null;
  isLoading: boolean;
  error: string | null;

  fetchMedications: () => Promise<void>;
  fetchTodayMedications: () => Promise<void>;
  scanPrescription: (imageUri: string) => Promise<ScanResult>;
  addMedication: (medication: Omit<Medication, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateMedication: (id: number, data: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: number) => Promise<void>;
  recordIntake: (medicationIds: number[]) => Promise<void>;
  clearScanResult: () => void;
  clearError: () => void;
}

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  todayMedications: [],
  currentScanResult: null,
  isLoading: false,
  error: null,

  fetchMedications: async () => {
    try {
      set({ isLoading: true, error: null });
      const medications = await medicationService.getMedications();
      set({ medications, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: '약 목록을 불러오는데 실패했습니다.' });
    }
  },

  fetchTodayMedications: async () => {
    try {
      set({ isLoading: true, error: null });
      const todayMedications = await medicationService.getTodayMedications();
      set({ todayMedications, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: '오늘의 약을 불러오는데 실패했습니다.' });
    }
  },

  scanPrescription: async (imageUri: string) => {
    try {
      set({ isLoading: true, error: null });
      const result = await medicationService.scanPrescription(imageUri);
      set({ currentScanResult: result, isLoading: false });
      return result;
    } catch (error) {
      set({ isLoading: false, error: '처방전 분석에 실패했습니다.' });
      throw error;
    }
  },

  addMedication: async (medication) => {
    try {
      set({ isLoading: true, error: null });
      const newMedication = await medicationService.createMedication(medication);
      set((state) => ({
        medications: [...state.medications, newMedication],
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false, error: '약 등록에 실패했습니다.' });
      throw error;
    }
  },

  updateMedication: async (id, data) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await medicationService.updateMedication(id, data);
      set((state) => ({
        medications: state.medications.map((m) => (m.id === id ? updated : m)),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false, error: '약 수정에 실패했습니다.' });
      throw error;
    }
  },

  deleteMedication: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await medicationService.deleteMedication(id);
      set((state) => ({
        medications: state.medications.filter((m) => m.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false, error: '약 삭제에 실패했습니다.' });
      throw error;
    }
  },

  recordIntake: async (medicationIds) => {
    try {
      set({ isLoading: true, error: null });
      await intakeService.recordIntake({ medicationIds });
      await get().fetchTodayMedications();
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: '복약 기록에 실패했습니다.' });
      throw error;
    }
  },

  clearScanResult: () => set({ currentScanResult: null }),
  clearError: () => set({ error: null }),
}));
