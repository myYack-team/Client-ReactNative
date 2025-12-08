import api from './api';
import { ApiResponse, Reminder, RemindersResponse } from '../types';

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
};
