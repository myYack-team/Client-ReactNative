import api from './api';
import { Medication, ScanResult, ApiResponse, TodayMedication } from '../types';

export const medicationService = {
  async scanPrescription(imageUri: string): Promise<ScanResult> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'prescription.jpg',
    } as unknown as Blob);

    const response = await api.post<ApiResponse<ScanResult>>('/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },

  async createMedication(medication: Omit<Medication, 'id' | 'userId' | 'createdAt'>): Promise<Medication> {
    const response = await api.post<ApiResponse<Medication>>('/medications', medication);
    return response.data.data!;
  },

  async getMedications(): Promise<Medication[]> {
    const response = await api.get<ApiResponse<Medication[]>>('/medications');
    return response.data.data!;
  },

  async getMedication(id: number): Promise<Medication> {
    const response = await api.get<ApiResponse<Medication>>(`/medications/${id}`);
    return response.data.data!;
  },

  async updateMedication(id: number, data: Partial<Medication>): Promise<Medication> {
    const response = await api.patch<ApiResponse<Medication>>(`/medications/${id}`, data);
    return response.data.data!;
  },

  async deleteMedication(id: number): Promise<void> {
    await api.delete(`/medications/${id}`);
  },

  async getTodayMedications(): Promise<TodayMedication[]> {
    const response = await api.get<ApiResponse<TodayMedication[]>>('/medications/today');
    return response.data.data!;
  },
};
