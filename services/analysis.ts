import api from './api';
import {
  ApiResponse,
  AnalysisResult,
  ReportListResponse,
  AnalysisRequestResponse,
  QuotaInfo,
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

  // Get weekly quota info
  async getQuota(): Promise<QuotaInfo> {
    logger.log('[analysisService] Getting quota info...');
    const response = await api.get<ApiResponse<QuotaInfo>>('/analysis/quota');
    if (!response.data.isSuccess || !response.data.result) {
      throw new Error(response.data.message || '쿼터 정보를 불러오는데 실패했습니다.');
    }
    return response.data.result;
  },
};
