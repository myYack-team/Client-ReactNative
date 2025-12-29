import api from './api';
import { ApiResponse, User, FontSize } from '../types';

export interface UpdateUserRequest {
  name?: string;
  fontSize?: FontSize;
}

export interface UpdateUserResponse {
  id: number;
  name: string;
  fontSize: FontSize;
}

export const userService = {
  // 내 정보 조회
  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/users/me');
    return response.data.result!;
  },

  // 내 정보 수정
  async updateMe(data: UpdateUserRequest): Promise<UpdateUserResponse> {
    const response = await api.patch<ApiResponse<UpdateUserResponse>>('/users/me', data);
    return response.data.result!;
  },

  // 회원 탈퇴
  async deleteMe(): Promise<void> {
    await api.delete<ApiResponse<void>>('/users/me');
  },
};
