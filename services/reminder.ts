import api from './api';
import { ApiResponse, Reminder, RemindersResponse, SnoozeRequest, SnoozeResponse } from '../types';

export interface UpdateReminderTimeResponse {
  id: number;
  time: string;
  enabled: boolean;
}

export interface ToggleReminderResponse {
  id: number;
  enabled: boolean;
}

export const reminderService = {
  // 알림 목록 조회
  async getReminders(): Promise<RemindersResponse> {
    const response = await api.get<ApiResponse<RemindersResponse>>('/reminders');
    return response.data.result!;
  },

  // 알림 시간 수정
  async updateReminderTime(id: number, time: string): Promise<UpdateReminderTimeResponse> {
    const response = await api.patch<ApiResponse<UpdateReminderTimeResponse>>(
      `/reminders/${id}`,
      { time }
    );
    return response.data.result!;
  },

  // 알림 ON/OFF 토글
  async toggleReminder(id: number): Promise<ToggleReminderResponse> {
    const response = await api.patch<ApiResponse<ToggleReminderResponse>>(
      `/reminders/${id}/toggle`
    );
    return response.data.result!;
  },

  // 다시 알림 설정 (스누즈)
  async snoozeReminder(id: number, minutes: number): Promise<SnoozeResponse> {
    const response = await api.post<ApiResponse<SnoozeResponse>>(
      `/reminders/${id}/snooze`,
      { minutes } as SnoozeRequest
    );
    return response.data.result!;
  },

  // 다시 알림 해제
  async clearSnooze(id: number): Promise<SnoozeResponse> {
    const response = await api.delete<ApiResponse<SnoozeResponse>>(
      `/reminders/${id}/snooze`
    );
    return response.data.result!;
  },
};
