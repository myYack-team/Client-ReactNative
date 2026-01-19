import { create } from 'zustand';
import {
  AnalysisResult,
  AnalysisResultExtended,
  ReportSummary,
} from '../types';
import { analysisService } from '../services';

// 캐시 만료 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

// 폴링 설정
const POLLING_INTERVAL = 2000; // 2초
const MAX_POLLING_TIME = 60000; // 60초

// 백그라운드 분석 상태 타입
interface PendingAnalysis {
  reportId: number;
  status: 'loading' | 'polling' | 'completed' | 'failed';
  startedAt: number;
}

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

  // 인라인 분석 상태 (새로 추가)
  pendingAnalysis: PendingAnalysis | null;
  completedResult: AnalysisResultExtended | null;

  // Actions
  fetchReports: () => Promise<void>;
  requestAnalysis: () => Promise<number>;
  fetchAnalysisResult: (reportId: number) => Promise<AnalysisResult>;
  deleteReport: (reportId: number) => Promise<void>;
  clearError: () => void;
  clearCurrentResult: () => void;
  invalidateCache: () => void;

  // 인라인 분석 액션 (새로 추가)
  startAnalysisInBackground: () => Promise<void>;
  clearCompletedResult: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentResult: null,
  reports: [],
  isLoading: false,
  isAnalyzing: false,
  error: null,
  reportsExpiry: 0,

  // 인라인 분석 상태 초기값
  pendingAnalysis: null,
  completedResult: null,

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

  // 백그라운드에서 분석 시작 (인라인 UI용)
  startAnalysisInBackground: async () => {
    const { pendingAnalysis } = get();

    // 이미 분석 중이면 무시
    if (pendingAnalysis && (pendingAnalysis.status === 'loading' || pendingAnalysis.status === 'polling')) {
      return;
    }

    const startedAt = Date.now();

    try {
      // 1. 분석 요청
      set({
        pendingAnalysis: { reportId: 0, status: 'loading', startedAt },
        completedResult: null,
        error: null,
      });

      const response = await analysisService.requestAnalysis();
      const reportId = response.reportId;

      // 2. 폴링 상태로 전환
      set({
        pendingAnalysis: { reportId, status: 'polling', startedAt },
      });

      // 3. 폴링 시작
      const pollResult = async (): Promise<boolean> => {
        try {
          const result = await analysisService.getAnalysisResult(reportId);
          // 성공
          set({
            pendingAnalysis: null,
            completedResult: result as AnalysisResultExtended,
            reportsExpiry: 0, // 레포트 목록 캐시 무효화
          });
          return true;
        } catch {
          // 아직 분석 중 (계속 폴링)
          return false;
        }
      };

      // 초기 폴링 시도
      const initialSuccess = await pollResult();
      if (initialSuccess) return;

      // 폴링 반복
      const pollInterval = setInterval(async () => {
        const { pendingAnalysis: currentPending } = get();
        const elapsed = Date.now() - startedAt;

        // 분석이 취소되었거나 완료된 경우 중단
        if (!currentPending || currentPending.status === 'completed' || currentPending.status === 'failed') {
          clearInterval(pollInterval);
          return;
        }

        // 타임아웃 체크
        if (elapsed >= MAX_POLLING_TIME) {
          clearInterval(pollInterval);
          set({
            pendingAnalysis: { reportId, status: 'failed', startedAt },
            error: '분석 시간이 초과되었습니다.',
          });
          return;
        }

        // 폴링 시도
        const success = await pollResult();
        if (success) {
          clearInterval(pollInterval);
        }
      }, POLLING_INTERVAL);

    } catch (error) {
      const message = error instanceof Error ? error.message : '분석 요청에 실패했습니다.';
      set({
        pendingAnalysis: { reportId: 0, status: 'failed', startedAt },
        error: message,
      });
    }
  },

  // 완료된 결과 초기화
  clearCompletedResult: () => set({ completedResult: null, pendingAnalysis: null }),
}));
