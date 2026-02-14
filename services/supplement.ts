import api, { extractResult } from './api';
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
    return extractResult(response, '영양제 등록에 실패했습니다.');
  },

  // 영양제 등록 (이미지 포함)
  async createSupplementWithImage(data: {
    name: string;
    description?: string;
    tag: SupplementTag;
    imageUri?: string;
  }): Promise<Supplement> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('tag', data.tag);

    if (data.description) {
      formData.append('description', data.description);
    }

    if (data.imageUri) {
      const filename = data.imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: data.imageUri,
        name: filename,
        type,
      } as unknown as Blob);
    }

    const response = await api.post<ApiResponse<Supplement>>(
      '/supplements/with-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return extractResult(response, '영양제 등록에 실패했습니다.');
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
    return extractResult(response, '영양제 검색에 실패했습니다.');
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
    return extractResult(response, '인기 영양제 조회에 실패했습니다.');
  },

  // 영양제 상세 조회 (마스터)
  async getSupplementDetail(id: number): Promise<SupplementDetail> {
    const response = await api.get<ApiResponse<SupplementDetail>>(`/supplements/${id}`);
    return extractResult(response, '영양제 상세 조회에 실패했습니다.');
  },

  // ========== 사용자 영양제 API ==========

  // 내 영양제에 추가
  async addUserSupplement(data: AddUserSupplementRequest): Promise<UserSupplement> {
    const response = await api.post<ApiResponse<UserSupplement>>('/supplements/my', data);
    return extractResult(response, '영양제 추가에 실패했습니다.');
  },

  // 내 영양제 목록 조회
  async getUserSupplements(): Promise<UserSupplementListResponse> {
    const response = await api.get<ApiResponse<UserSupplementListResponse>>('/supplements/my');
    return extractResult(response, '영양제 목록 조회에 실패했습니다.');
  },

  // 내 영양제 상세 조회
  async getUserSupplementDetail(id: number): Promise<UserSupplementDetail> {
    const response = await api.get<ApiResponse<UserSupplementDetail>>(`/supplements/my/${id}`);
    return extractResult(response, '영양제 상세 조회에 실패했습니다.');
  },

  // 내 영양제 수정
  async updateUserSupplement(
    id: number,
    data: UpdateUserSupplementRequest
  ): Promise<UserSupplement> {
    const response = await api.patch<ApiResponse<UserSupplement>>(`/supplements/my/${id}`, data);
    return extractResult(response, '영양제 수정에 실패했습니다.');
  },

  // 내 영양제 삭제
  async deleteUserSupplement(id: number): Promise<void> {
    await api.delete(`/supplements/my/${id}`);
  },

  // 내 영양제 일괄 삭제
  async deleteUserSupplementsBatch(ids: number[]): Promise<{
    requestedCount: number;
    deletedCount: number;
    failedCount: number;
  }> {
    const response = await api.delete<
      ApiResponse<{ requestedCount: number; deletedCount: number; failedCount: number }>
    >('/supplements/my/batch', { data: { ids } });
    return extractResult(response, '영양제 일괄 삭제에 실패했습니다.');
  },
};
