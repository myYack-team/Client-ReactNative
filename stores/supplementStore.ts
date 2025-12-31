import { create } from 'zustand';
import {
  UserSupplement,
  UserSupplementDetail,
  AddUserSupplementRequest,
  UpdateUserSupplementRequest,
} from '../types';
import { supplementService } from '../services';

interface SupplementState {
  // 내 영양제 목록
  userSupplements: UserSupplement[];
  // 로딩 상태
  isLoading: boolean;
  // 에러 상태
  error: string | null;
  // 데이터 갱신 필요 플래그
  needsRefresh: boolean;

  // Actions
  fetchUserSupplements: () => Promise<void>;
  getUserSupplementDetail: (id: number) => Promise<UserSupplementDetail>;
  addUserSupplement: (data: AddUserSupplementRequest) => Promise<void>;
  updateUserSupplement: (id: number, data: UpdateUserSupplementRequest) => Promise<void>;
  deleteUserSupplement: (id: number) => Promise<void>;
  deleteUserSupplementsBatch: (ids: number[]) => Promise<{ requestedCount: number; deletedCount: number; failedCount: number }>;
  clearError: () => void;
  clearNeedsRefresh: () => void;
  setNeedsRefresh: () => void;
}

export const useSupplementStore = create<SupplementState>((set, get) => ({
  userSupplements: [],
  isLoading: false,
  error: null,
  needsRefresh: false,

  fetchUserSupplements: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await supplementService.getUserSupplements();
      set({ userSupplements: response.supplements, isLoading: false, needsRefresh: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : '영양제 목록을 불러오는데 실패했습니다.';
      set({ isLoading: false, error: message });
    }
  },

  getUserSupplementDetail: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      const detail = await supplementService.getUserSupplementDetail(id);
      set({ isLoading: false });
      return detail;
    } catch (error) {
      const message = error instanceof Error ? error.message : '영양제 정보를 불러오는데 실패했습니다.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  addUserSupplement: async (data: AddUserSupplementRequest) => {
    try {
      set({ isLoading: true, error: null });
      await supplementService.addUserSupplement(data);
      // 목록 새로고침
      await get().fetchUserSupplements();
      set({ needsRefresh: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '영양제 등록에 실패했습니다.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  updateUserSupplement: async (id: number, data: UpdateUserSupplementRequest) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await supplementService.updateUserSupplement(id, data);
      // 로컬 상태 부분 업데이트
      const { userSupplements } = get();
      const updatedList = userSupplements.map((s) =>
        s.id === id
          ? {
              ...s,
              dosage: updated.dosage,
              frequency: updated.frequency,
              timings: updated.timings,
            }
          : s
      );
      set({ userSupplements: updatedList, isLoading: false, needsRefresh: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '영양제 수정에 실패했습니다.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  deleteUserSupplement: async (id: number) => {
    const { userSupplements } = get();
    const previousSupplements = [...userSupplements];

    // 낙관적 업데이트
    set({
      userSupplements: userSupplements.filter((s) => s.id !== id),
      isLoading: true,
    });

    try {
      await supplementService.deleteUserSupplement(id);
      set({ isLoading: false, needsRefresh: true });
    } catch (error) {
      // 롤백
      set({
        userSupplements: previousSupplements,
        isLoading: false,
      });
      const message = error instanceof Error ? error.message : '영양제 삭제에 실패했습니다.';
      set({ error: message });
      throw error;
    }
  },

  deleteUserSupplementsBatch: async (ids: number[]) => {
    const { userSupplements } = get();
    const previousSupplements = [...userSupplements];

    // 낙관적 업데이트
    set({
      userSupplements: userSupplements.filter((s) => !ids.includes(s.id)),
      isLoading: true,
    });

    try {
      const result = await supplementService.deleteUserSupplementsBatch(ids);
      set({ isLoading: false, needsRefresh: true });
      return result;
    } catch (error) {
      // 롤백
      set({
        userSupplements: previousSupplements,
        isLoading: false,
      });
      const message = error instanceof Error ? error.message : '영양제 일괄 삭제에 실패했습니다.';
      set({ error: message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearNeedsRefresh: () => set({ needsRefresh: false }),
  setNeedsRefresh: () => set({ needsRefresh: true }),
}));
