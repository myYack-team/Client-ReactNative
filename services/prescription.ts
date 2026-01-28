import api, { extractResult } from './api';
import {
  ApiResponse,
  Prescription,
  PrescriptionDetail,
  PrescriptionListResponse,
  PrescriptionUploadResponse,
  PrescriptionRegisterRequest,
  PrescriptionRegisterResponse,
  BatchDeleteResult,
} from '../types';
import { logger } from '../utils/logger';

export const prescriptionService = {
  // 처방전 이미지 업로드
  async uploadImage(imageUri: string, prescriptionDate?: string): Promise<PrescriptionUploadResponse> {
    const formData = new FormData();

    // 이미지 파일 추가
    const filename = imageUri.split('/').pop() || 'prescription.png';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/png';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    // 처방 날짜 추가 (없으면 서버에서 오늘 날짜 사용)
    if (prescriptionDate) {
      formData.append('prescriptionDate', prescriptionDate);
    }

    logger.log('[Upload] Image URI:', imageUri);

    const response = await api.post<ApiResponse<PrescriptionUploadResponse>>(
      '/prescriptions/upload',
      formData,
    );

    logger.log('[Upload] Response data:', JSON.stringify(response.data, null, 2));

    return extractResult(response, '이미지 업로드에 실패했습니다.');
  },

  // 처방전 목록 조회
  async getList(): Promise<PrescriptionListResponse> {
    const response = await api.get<ApiResponse<PrescriptionListResponse>>('/prescriptions');
    return response.data.result!;
  },

  // 처방전 상세 조회
  async getDetail(prescriptionId: number): Promise<PrescriptionDetail> {
    const response = await api.get<ApiResponse<PrescriptionDetail>>(`/prescriptions/${prescriptionId}`);
    return response.data.result!;
  },

  // 처방전 정보 수정
  async update(
    prescriptionId: number,
    data: {
      prescriptionDate?: string;
      patientName?: string;
      hospitalName?: string;
      doctorName?: string;
      diagnosis?: string;
      durationDays?: number;
      notes?: string;
    }
  ): Promise<Prescription> {
    const response = await api.patch<ApiResponse<Prescription>>(`/prescriptions/${prescriptionId}`, data);
    return response.data.result!;
  },

  // 처방전 삭제
  async delete(prescriptionId: number): Promise<void> {
    await api.delete(`/prescriptions/${prescriptionId}`);
  },

  // 처방전 + 약물 일괄 등록
  async register(
    imageUri: string,
    request: PrescriptionRegisterRequest
  ): Promise<PrescriptionRegisterResponse> {
    const formData = new FormData();

    // 이미지 파일 추가
    const filename = imageUri.split('/').pop() || 'prescription.png';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/png';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    // JSON 데이터 추가 (문자열로 전송, 서버에서 파싱)
    formData.append('data', JSON.stringify(request));

    logger.log('[Register] Request:', JSON.stringify(request, null, 2));

    const response = await api.post<ApiResponse<PrescriptionRegisterResponse>>(
      '/prescriptions/register',
      formData,
    );

    logger.log('[Register] Response data:', JSON.stringify(response.data, null, 2));

    return extractResult(response, '처방전 등록에 실패했습니다.');
  },

  // 처방전 일괄 삭제
  async deleteBatch(ids: number[]): Promise<BatchDeleteResult> {
    logger.log('[deletePrescriptionsBatch] Deleting prescriptions:', ids);
    const response = await api.delete<ApiResponse<BatchDeleteResult>>('/prescriptions/batch', {
      data: { ids },
    });
    logger.log('[deletePrescriptionsBatch] Response:', JSON.stringify(response.data, null, 2));
    return response.data.result!;
  },
};
