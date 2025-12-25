import api from './api';
import {
  ApiResponse,
  Prescription,
  PrescriptionDetail,
  PrescriptionListResponse,
  PrescriptionUploadResponse,
  PrescriptionRegisterRequest,
  PrescriptionRegisterResponse,
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

    const uploadUrl = `${API_BASE_URL}/prescriptions/upload?userId=${TEMP_USER_ID}`;
    console.log('[Upload] URL:', uploadUrl);
    console.log('[Upload] Image URI:', imageUri);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      // Content-Type 헤더는 FormData 사용 시 자동 설정됨 (boundary 포함)
    });

    console.log('[Upload] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Upload] Error response:', errorText);
      throw new Error('이미지 업로드에 실패했습니다.');
    }

    const data = await response.json() as ApiResponse<PrescriptionUploadResponse>;
    console.log('[Upload] Response data:', JSON.stringify(data, null, 2));

    if (!data.isSuccess || !data.result) {
      throw new Error(data.message || '이미지 업로드에 실패했습니다.');
    }

    return data.result;
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

    const registerUrl = `${API_BASE_URL}/prescriptions/register?userId=${TEMP_USER_ID}`;
    console.log('[Register] URL:', registerUrl);
    console.log('[Register] Request:', JSON.stringify(request, null, 2));

    const response = await fetch(registerUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[Register] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Register] Error response:', errorText);
      throw new Error('처방전 등록에 실패했습니다.');
    }

    const data = await response.json() as ApiResponse<PrescriptionRegisterResponse>;
    console.log('[Register] Response data:', JSON.stringify(data, null, 2));

    if (!data.isSuccess || !data.result) {
      throw new Error(data.message || '처방전 등록에 실패했습니다.');
    }

    return data.result;
  },
};
