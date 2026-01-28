import { create } from 'zustand';
import { Alert } from 'react-native';
import {
  AnalysisResult,
  AnalysisResultExtended,
  ReportSummary,
  TemporaryNoteData,
} from '../types';
import { analysisService } from '../services';

// 캐시 만료 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

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

  // 데이터 부족 모달 상태
  insufficientDataModalVisible: boolean;

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

  // 데이터 충분성 확인
  checkDataSufficiency: () => Promise<boolean>;
  saveTemporaryNote: (data: TemporaryNoteData) => Promise<void>;
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

  // 데이터 부족 모달 초기값
  insufficientDataModalVisible: false,

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

      // 서버가 동기 방식으로 완전한 결과를 반환하므로 바로 완료 처리
      set({
        pendingAnalysis: null,
        completedResult: response as AnalysisResultExtended,
        reportsExpiry: 0, // 레포트 목록 캐시 무효화
        error: null,
      });

    } catch (error: any) {
      // 429: 월간 쿼터 초과
      if (error?.response?.status === 429) {
        Alert.alert(
          'AI 분석 제한',
          '이번 달 분석 횟수를 모두 사용했습니다.\n다음 달 1일에 초기화됩니다.',
          [{ text: '확인' }]
        );
        set({
          pendingAnalysis: null,
          error: null,
        });
        return;
      }

      const message = error instanceof Error ? error.message : '분석 요청에 실패했습니다.';
      set({
        pendingAnalysis: { reportId: 0, status: 'failed', startedAt },
        error: message,
      });
    }
  },

  // 완료된 결과 초기화
  clearCompletedResult: () => set({ completedResult: null, pendingAnalysis: null }),

  // 데이터 충분성 확인
  checkDataSufficiency: async () => {
    try {
      const result = await analysisService.checkDataSufficiency();
      if (!result.isSufficient) {
        set({ insufficientDataModalVisible: true });
        return false;
      }
      // 데이터 충분
      return true;
    } catch (error) {
      console.error('Data sufficiency check failed:', error);
      // 에러 시에도 분석 진행
      return true;
    }
  },

  // 임시 메모 저장
  saveTemporaryNote: async (data: TemporaryNoteData) => {
    try {
      await analysisService.saveTemporaryNote(data);
      set({ insufficientDataModalVisible: false });
    } catch (error) {
      console.error('Failed to save temporary note:', error);
      Alert.alert('저장 실패', '메모 저장에 실패했습니다.');
      throw error;
    }
  },
}));
