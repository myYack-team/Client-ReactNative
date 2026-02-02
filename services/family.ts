import api from './api';
import {
  ApiResponse,
  FamilyLinkStatus,
  SendRequestResult,
  FamilyTodaySchedule,
  TodaySchedule,
  MonthlySummaryResponse,
  FamilyNotificationSettings,
} from '../types';

export const familyService = {
  // 가족 연동 현황 조회
  async getLinkStatus(): Promise<FamilyLinkStatus> {
    const response = await api.get<ApiResponse<FamilyLinkStatus>>('/family/status');
    return response.data.result!;
  },

  // 가족 연동 요청 전송
  async sendLinkRequest(phone: string): Promise<SendRequestResult> {
    const response = await api.post<ApiResponse<SendRequestResult>>('/family/request', { phone });
    return response.data.result!;
  },

  // 보낸 요청 취소
  async cancelRequest(requestId: number): Promise<void> {
    await api.delete(`/family/request/${requestId}`);
  },

  // 받은 요청 수락
  async acceptRequest(requestId: number): Promise<void> {
    await api.post(`/family/request/${requestId}/accept`);
  },

  // 받은 요청 거절
  async rejectRequest(requestId: number): Promise<void> {
    await api.post(`/family/request/${requestId}/reject`);
  },

  // 가족 연동 해제
  async unlinkFamily(linkId: number): Promise<void> {
    await api.delete(`/family/link/${linkId}`);
  },

  // 가족의 오늘의 복약 스케줄 조회
  async getFamilyTodaySchedule(userId: number): Promise<FamilyTodaySchedule> {
    const response = await api.get<ApiResponse<FamilyTodaySchedule>>(`/family/protected/${userId}/today`);
    return response.data.result!;
  },

  // 가족의 특정 날짜 복약 스케줄 조회
  async getFamilyScheduleForDate(userId: number, date: string): Promise<TodaySchedule[]> {
    const response = await api.get<ApiResponse<FamilyTodaySchedule>>(`/family/protected/${userId}/schedule`, {
      params: { date },
    });
    return response.data.result?.todaySchedule?.schedules || [];
  },

  // 가족의 월별 복약 요약 조회
  async getFamilyMonthlySummary(userId: number, year: number, month: number): Promise<MonthlySummaryResponse> {
    const response = await api.get<ApiResponse<MonthlySummaryResponse>>(`/family/protected/${userId}/monthly-summary`, {
      params: { year, month },
    });
    return response.data.result!;
  },

  // 가족 알림 설정 조회
  async getNotificationSettings(): Promise<FamilyNotificationSettings> {
    const response = await api.get<ApiResponse<FamilyNotificationSettings>>('/family/notification-settings');
    return response.data.result!;
  },

  // 가족 알림 설정 업데이트
  async updateNotificationSettings(enabled: boolean): Promise<void> {
    await api.patch('/family/notification-settings', { familyNotificationEnabled: enabled });
  },
};
