import api from './api';
import {
  ApiResponse,
  Prescription,
  PrescriptionDetail,
  PrescriptionListResponse,
  PrescriptionUploadResponse,
} from '../types';
import { API_BASE_URL, TEMP_USER_ID } from '../constants';

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

    const response = await fetch(`${API_BASE_URL}/api/prescriptions/upload?userId=${TEMP_USER_ID}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error('이미지 업로드에 실패했습니다.');
    }

    const data = await response.json() as ApiResponse<PrescriptionUploadResponse>;
    if (!data.isSuccess || !data.result) {
      throw new Error(data.message || '이미지 업로드에 실패했습니다.');
    }

    return data.result;
  },

  // 처방전 목록 조회
  async getList(): Promise<PrescriptionListResponse> {
    const response = await api.get<ApiResponse<PrescriptionListResponse>>('/api/prescriptions');
    return response.data.result!;
  },

  // 처방전 상세 조회
  async getDetail(prescriptionId: number): Promise<PrescriptionDetail> {
    const response = await api.get<ApiResponse<PrescriptionDetail>>(`/api/prescriptions/${prescriptionId}`);
    return response.data.result!;
  },

  // 처방전 정보 수정
  async update(
    prescriptionId: number,
    data: { prescriptionDate?: string; hospitalName?: string; notes?: string }
  ): Promise<Prescription> {
    const response = await api.patch<ApiResponse<Prescription>>(`/api/prescriptions/${prescriptionId}`, data);
    return response.data.result!;
  },

  // 처방전 삭제
  async delete(prescriptionId: number): Promise<void> {
    await api.delete(`/api/prescriptions/${prescriptionId}`);
  },
};
