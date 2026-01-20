import api, { extractResult } from './api';
import { HealthNote, HealthNoteListItem, ApiResponse } from '../types';

export interface CreateHealthNoteRequest {
  noteDate: string;
  conditionScore: number;
  content?: string;
}

export interface UpdateHealthNoteRequest {
  conditionScore?: number;
  content?: string;
}

export const healthNoteService = {
  /**
   * 건강 메모 생성
   */
  create: async (data: CreateHealthNoteRequest): Promise<HealthNote> => {
    const response = await api.post<ApiResponse<HealthNote>>('/health-notes', data);
    return extractResult(response);
  },

  /**
   * 특정 날짜의 건강 메모 조회
   */
  getByDate: async (date: string): Promise<HealthNote | null> => {
    try {
      const response = await api.get<ApiResponse<HealthNote>>(`/health-notes/${date}`);
      return extractResult(response);
    } catch (error) {
      // 404인 경우 null 반환
      return null;
    }
  },

  /**
   * 건강 메모 수정
   */
  update: async (date: string, data: UpdateHealthNoteRequest): Promise<HealthNote> => {
    const response = await api.put<ApiResponse<HealthNote>>(`/health-notes/${date}`, data);
    return extractResult(response);
  },

  /**
   * 건강 메모 삭제
   */
  delete: async (date: string): Promise<void> => {
    await api.delete(`/health-notes/${date}`);
  },

  /**
   * 기간별 건강 메모 목록 조회
   */
  getByRange: async (start: string, end: string): Promise<HealthNoteListItem[]> => {
    const response = await api.get<ApiResponse<HealthNoteListItem[]>>(
      `/health-notes?start=${start}&end=${end}`
    );
    return extractResult(response);
  },
};
