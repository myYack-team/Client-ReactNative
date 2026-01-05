import { create } from 'zustand';
import {
  AnalysisResult,
  ReportSummary,
} from '../types';
import { analysisService } from '../services';

// 캐시 만료 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

interface AnalysisState {
  // 현재 분석 결과
  currentResult: AnalysisResult | null;
  // 레포트 목록
  reports: ReportSummary[];
  // 로딩 상태
  isLoading: boolean;
  isAnalyzing: boolean;
  // 에러 상태
  error: string | null;
  // 캐시 만료 시간
  reportsExpiry: number;

  // Actions
  fetchReports: () => Promise<void>;
  requestAnalysis: () => Promise<number>;
  fetchAnalysisResult: (reportId: number) => Promise<AnalysisResult>;
  deleteReport: (reportId: number) => Promise<void>;
  clearError: () => void;
  clearCurrentResult: () => void;
  invalidateCache: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentResult: null,
  reports: [],
  isLoading: false,
  isAnalyzing: false,
  error: null,
  reportsExpiry: 0,

  fetchReports: async () => {
    const { reportsExpiry, reports } = get();
    const now = Date.now();

    // 캐시가 유효하면 API 호출 건너뜀
    if (reportsExpiry > now && reports.length > 0) {
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const response = await analysisService.getReports();
      set({
        reports: response.reports,
        reportsExpiry: now + CACHE_DURATION,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '레포트 목록을 불러오는데 실패했습니다.';
      set({ isLoading: false, error: message });
    }
  },

  requestAnalysis: async () => {
    try {
      set({ isAnalyzing: true, error: null });
      const response = await analysisService.requestAnalysis();
      // 성공 시에도 isAnalyzing을 false로 설정
      set({ isAnalyzing: false });
      return response.reportId;
    } catch (error) {
      const message = error instanceof Error ? error.message : '분석 요청에 실패했습니다.';
      set({ isAnalyzing: false, error: message });
      throw error;
    }
  },

  fetchAnalysisResult: async (reportId: number) => {
    try {
      set({ isAnalyzing: true, error: null });
      const result = await analysisService.getAnalysisResult(reportId);
      set({
        currentResult: result,
        isAnalyzing: false,
        // 레포트 목록 캐시 무효화 (새 레포트 추가됨)
        reportsExpiry: 0,
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : '분석 결과를 불러오는데 실패했습니다.';
      set({ isAnalyzing: false, error: message });
      throw error;
    }
  },

  deleteReport: async (reportId: number) => {
    try {
      set({ isLoading: true, error: null });
      await analysisService.deleteReport(reportId);
      set((state) => ({
        reports: state.reports.filter((r) => r.id !== reportId),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '레포트 삭제에 실패했습니다.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  clearCurrentResult: () => set({ currentResult: null }),

  invalidateCache: () => set({ reportsExpiry: 0 }),
}));
