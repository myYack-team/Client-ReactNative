import api from './api';
import { Intake, ApiResponse } from '../types';

export interface RecordIntakeParams {
  medicationIds: number[];
  takenAt?: string;
}

export const intakeService = {
  async recordIntake(params: RecordIntakeParams): Promise<Intake[]> {
    const response = await api.post<ApiResponse<Intake[]>>('/intakes', {
      ...params,
      takenAt: params.takenAt || new Date().toISOString(),
    });
    return response.data.data!;
  },

  async getIntakes(params?: { startDate?: string; endDate?: string }): Promise<Intake[]> {
    const response = await api.get<ApiResponse<Intake[]>>('/intakes', { params });
    return response.data.data!;
  },

  async getIntakesByDate(date: string): Promise<Intake[]> {
    const response = await api.get<ApiResponse<Intake[]>>('/intakes', {
      params: { date },
    });
    return response.data.data!;
  },
};
