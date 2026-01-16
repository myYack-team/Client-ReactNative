import api from './api';
import {
  ApiResponse,
  Medication,
  MedicationsResponse,
  CreateMedicationRequest,
  ScanResult,
  TodayResponse,
  DuplicateCheckResponse,
  BatchDeleteResult,
} from '../types';
import { logger } from '../utils/logger';

export const medicationService = {
  // 처방전 스캔
  async scanPrescription(imageUri: string): Promise<ScanResult> {
    logger.log('[scanPrescription] Starting scan with image:', imageUri);

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'prescription.jpg',
    } as unknown as Blob);

    try {
      logger.log('[scanPrescription] Sending request to /scan...');
      const response = await api.post<ApiResponse<ScanResult>>('/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      logger.log('[scanPrescription] Response:', JSON.stringify(response.data, null, 2));
      return response.data.result!;
    } catch (error: any) {
      logger.error('[scanPrescription] Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  // 약 등록
  async createMedication(medication: CreateMedicationRequest): Promise<Medication> {
    logger.log('[createMedication] Request:', JSON.stringify(medication, null, 2));
    try {
      const response = await api.post<ApiResponse<Medication>>('/medications', medication);
      logger.log('[createMedication] Response:', JSON.stringify(response.data, null, 2));
      return response.data.result!;
    } catch (error: any) {
      logger.error('[createMedication] Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  // 약 목록 조회
  async getMedications(): Promise<MedicationsResponse> {
    logger.log('[getMedications] Fetching medications list...');
    try {
      const response = await api.get<ApiResponse<MedicationsResponse>>('/medications');
      logger.log('[getMedications] Response:', JSON.stringify(response.data, null, 2));
      return response.data.result!;
    } catch (error: any) {
      logger.error('[getMedications] Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  // 약 상세 조회
  async getMedication(id: number): Promise<Medication> {
    const response = await api.get<ApiResponse<Medication>>(`/medications/${id}`);
    return response.data.result!;
  },

  // 약 정보 수정
  async updateMedication(id: number, data: Partial<CreateMedicationRequest>): Promise<Medication> {
    const response = await api.patch<ApiResponse<Medication>>(`/medications/${id}`, data);
    return response.data.result!;
  },

  // 약 삭제
  async deleteMedication(id: number): Promise<void> {
    await api.delete(`/medications/${id}`);
  },

  // 오늘의 복약 현황 조회 (홈 화면용)
  async getTodaySchedule(): Promise<TodayResponse> {
    const response = await api.get<ApiResponse<TodayResponse>>('/today');
    return response.data.result!;
  },

  // 중복 약물 체크
  async checkDuplicates(drugItemSeqs: string[]): Promise<DuplicateCheckResponse> {
    logger.log('[checkDuplicates] Checking duplicates for:', drugItemSeqs);
    try {
      const response = await api.post<ApiResponse<DuplicateCheckResponse>>(
        '/medications/check-duplicates',
        { drugItemSeqs }
      );
      logger.log('[checkDuplicates] Response:', JSON.stringify(response.data, null, 2));
      return response.data.result!;
    } catch (error: any) {
      logger.error('[checkDuplicates] Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  // 약 일괄 삭제
  async deleteMedicationsBatch(ids: number[]): Promise<BatchDeleteResult> {
    logger.log('[deleteMedicationsBatch] Deleting medications:', ids);
    const response = await api.delete<ApiResponse<BatchDeleteResult>>('/medications/batch', {
      data: { ids },
    });
    logger.log('[deleteMedicationsBatch] Response:', JSON.stringify(response.data, null, 2));
    return response.data.result!;
  },
};
