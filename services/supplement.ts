import api from './api';
import {
  ApiResponse,
  Supplement,
  SupplementDetail,
  SupplementListResponse,
  UserSupplement,
  UserSupplementDetail,
  UserSupplementListResponse,
  CreateSupplementRequest,
  AddUserSupplementRequest,
  UpdateUserSupplementRequest,
  SupplementTag,
} from '../types';

export const supplementService = {
  // ========== 영양제 마스터 API ==========

  // 영양제 등록 (마스터)
  async createSupplement(data: CreateSupplementRequest): Promise<Supplement> {
    const response = await api.post<ApiResponse<Supplement>>('/supplements', data);
    return response.data.result!;
  },

  // 영양제 검색 (페이징)
  async searchSupplements(params: {
    keyword?: string;
    tag?: SupplementTag;
    page?: number;
    size?: number;
  }): Promise<SupplementListResponse> {
    const response = await api.get<ApiResponse<SupplementListResponse>>('/supplements/search', {
      params: {
        keyword: params.keyword,
        tag: params.tag,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    });
    return response.data.result!;
  },

  // 인기 영양제 조회
  async getPopularSupplements(params: {
    page?: number;
    size?: number;
  }): Promise<SupplementListResponse> {
    const response = await api.get<ApiResponse<SupplementListResponse>>('/supplements/popular', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    });
    return response.data.result!;
  },

  // 영양제 상세 조회 (마스터)
  async getSupplementDetail(id: number): Promise<SupplementDetail> {
    const response = await api.get<ApiResponse<SupplementDetail>>(`/supplements/${id}`);
    return response.data.result!;
  },

  // ========== 사용자 영양제 API ==========

  // 내 영양제에 추가
  async addUserSupplement(data: AddUserSupplementRequest): Promise<UserSupplement> {
    const response = await api.post<ApiResponse<UserSupplement>>('/supplements/my', data);
    return response.data.result!;
  },

  // 내 영양제 목록 조회
  async getUserSupplements(): Promise<UserSupplementListResponse> {
    const response = await api.get<ApiResponse<UserSupplementListResponse>>('/supplements/my');
    return response.data.result!;
  },

  // 내 영양제 상세 조회
  async getUserSupplementDetail(id: number): Promise<UserSupplementDetail> {
    const response = await api.get<ApiResponse<UserSupplementDetail>>(`/supplements/my/${id}`);
    return response.data.result!;
  },

  // 내 영양제 수정
  async updateUserSupplement(
    id: number,
    data: UpdateUserSupplementRequest
  ): Promise<UserSupplement> {
    const response = await api.patch<ApiResponse<UserSupplement>>(`/supplements/my/${id}`, data);
    return response.data.result!;
  },

  // 내 영양제 삭제
  async deleteUserSupplement(id: number): Promise<void> {
    await api.delete(`/supplements/my/${id}`);
  },
};
