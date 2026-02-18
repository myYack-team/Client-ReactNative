import api from './api';
import {
  ApiResponse,
  AnalysisResult,
  ReportListResponse,
  AnalysisRequestResponse,
  QuotaInfo,
  DataSufficiencyCheck,
  TemporaryNoteData,
} from '../types';
import { logger } from '../utils/logger';

export const analysisService = {
  // 분석 요청 (새로운 분석 시작)
  async requestAnalysis(): Promise<AnalysisRequestResponse> {
    logger.log('[analysisService] Requesting new analysis...');
    const response = await api.post<ApiResponse<AnalysisRequestResponse>>('/analysis/request');
    if (!response.data.isSuccess || !response.data.result) {
      throw new Error(response.data.message || '분석 요청에 실패했습니다.');
    }
    return response.data.result;
  },

  // 테스트 분석 요청 (데이터 부족 시 시뮬레이션 데이터 기반)
  async requestTestAnalysis(): Promise<AnalysisRequestResponse> {
    logger.log('[analysisService] Requesting test analysis...');
    const response = await api.post<ApiResponse<AnalysisRequestResponse>>('/analysis/test-request');
    if (!response.data.isSuccess || !response.data.result) {
      throw new Error(response.data.message || '테스트 분석 요청에 실패했습니다.');
    }
    return response.data.result;
  },

  // 분석 결과 조회 (폴링용)
  async getAnalysisResult(reportId: number): Promise<AnalysisResult> {
    logger.log('[analysisService] Getting analysis result for reportId:', reportId);
    const response = await api.get<ApiResponse<AnalysisResult>>(`/analysis/reports/${reportId}`);
    if (!response.data.isSuccess || !response.data.result) {
      throw new Error(response.data.message || '분석 결과를 불러오는데 실패했습니다.');
    }
    return response.data.result;
  },

  // 레포트 목록 조회
  async getReports(): Promise<ReportListResponse> {
    logger.log('[analysisService] Getting report list...');
    const response = await api.get<ApiResponse<ReportListResponse>>('/analysis/reports');
    if (!response.data.isSuccess || !response.data.result) {
      throw new Error(response.data.message || '레포트 목록을 불러오는데 실패했습니다.');
    }
    return response.data.result;
  },

  // 레포트 삭제
  async deleteReport(reportId: number): Promise<void> {
    logger.log('[analysisService] Deleting report:', reportId);
    const response = await api.delete<ApiResponse<null>>(`/analysis/reports/${reportId}`);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || '레포트 삭제에 실패했습니다.');
    }
  },

  // 쿼터 정보 조회
  async getQuota(): Promise<QuotaInfo> {
    logger.log('[analysisService] Getting quota info...');
    const response = await api.get<ApiResponse<QuotaInfo>>('/analysis/quota');
    if (!response.data.isSuccess || !response.data.result) {
      throw new Error(response.data.message || '쿼터 정보를 불러오는데 실패했습니다.');
    }
    return response.data.result;
  },

  // 데이터 충분성 확인
  async checkDataSufficiency(): Promise<DataSufficiencyCheck> {
    logger.log('[analysisService] Checking data sufficiency...');
    const response = await api.get<ApiResponse<DataSufficiencyCheck>>('/analysis/data-sufficiency');
    if (!response.data.isSuccess || !response.data.result) {
      throw new Error(response.data.message || '데이터 충분성 확인에 실패했습니다.');
    }
    return response.data.result;
  },

  // 임시 건강 메모 저장
  async saveTemporaryNote(data: TemporaryNoteData): Promise<void> {
    logger.log('[analysisService] Saving temporary note...');
    const response = await api.post<ApiResponse<null>>('/analysis/temporary-notes', {
      conditionScore: data.conditionScore,
      symptoms: JSON.stringify(data.selectedSymptoms),
      additionalNote: data.additionalNote,
    });
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || '임시 메모 저장에 실패했습니다.');
    }
  },

  // 임시 건강 메모 전체 삭제
  async deleteAllTemporaryNotes(): Promise<void> {
    logger.log('[analysisService] Deleting all temporary notes...');
    const response = await api.delete<ApiResponse<null>>('/analysis/temporary-notes');
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || '임시 메모 삭제에 실패했습니다.');
    }
  },
};
