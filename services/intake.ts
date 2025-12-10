import api from './api';
import {
  ApiResponse,
  RecordIntakeRequest,
  RecordIntakeResponse,
  IntakesResponse,
  MedicationTiming,
  MonthlySummaryResponse,
} from '../types';

export const intakeService = {
  // 복약 확인 기록
  async recordIntake(params: RecordIntakeRequest): Promise<RecordIntakeResponse> {
    const response = await api.post<ApiResponse<RecordIntakeResponse>>('/intakes', params);
    return response.data.result!;
  },

  // 복약 기록 조회 (단일 날짜)
  async getIntakesByDate(date?: string): Promise<IntakesResponse> {
    const response = await api.get<ApiResponse<IntakesResponse>>('/intakes', {
      params: date ? { date } : undefined,
    });
    return response.data.result!;
  },

  // 복약 기록 조회 (기간)
  async getIntakesByDateRange(startDate: string, endDate: string): Promise<IntakesResponse> {
    const response = await api.get<ApiResponse<IntakesResponse>>('/intakes', {
      params: { startDate, endDate },
    });
    return response.data.result!;
  },

  // 복약 확인 헬퍼 함수
  async markAsTaken(
    medicationIds: number[],
    timing: MedicationTiming,
    takenAt?: string
  ): Promise<RecordIntakeResponse> {
    return this.recordIntake({
      medicationIds,
      timing,
      takenAt: takenAt || new Date().toISOString(),
    });
  },

  // 월별 복약 요약 조회
  async getMonthlySummary(year: number, month: number): Promise<MonthlySummaryResponse> {
    const response = await api.get<ApiResponse<MonthlySummaryResponse>>('/intakes/monthly-summary', {
      params: { year, month },
    });
    return response.data.result!;
  },
};
