import api from './api';
import { ApiResponse, User, FontSize, Gender, SignupPurpose } from '../types';

export interface UpdateUserRequest {
  name?: string;
  fontSize?: FontSize;
}

export interface UpdateUserResponse {
  id: number;
  name: string;
  fontSize: FontSize;
}

export interface NotificationSettings {
  notificationEnabled: boolean;
}

export interface UpdateNotificationSettingsRequest {
  notificationEnabled: boolean;
}

export interface ProfileSetupRequest {
  gender: Gender;
  ageRange: string;
  signupPurposes: SignupPurpose[];
}

export interface ProfileSetupResponse {
  id: number;
  gender: Gender;
  ageRange: string;
  signupPurposes: SignupPurpose[];
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

  // 알림 설정 조회
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await api.get<ApiResponse<NotificationSettings>>('/users/me/notification-settings');
    return response.data.result!;
  },

  // 알림 설정 수정
  async updateNotificationSettings(data: UpdateNotificationSettingsRequest): Promise<NotificationSettings> {
    const response = await api.patch<ApiResponse<NotificationSettings>>('/users/me/notification-settings', data);
    return response.data.result!;
  },

  // 기본정보 설정 (신규 가입자)
  async setupProfile(data: ProfileSetupRequest): Promise<ProfileSetupResponse> {
    const response = await api.put<ApiResponse<ProfileSetupResponse>>('/users/me/profile-setup', data);
    return response.data.result!;
  },
};
