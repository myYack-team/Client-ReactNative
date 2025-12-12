import api from './api';
import { ApiResponse, DrugInfo, DrugSearchPageResponse } from '../types';

export const drugService = {
  // 약 검색 (페이징)
  async searchDrugs(params: {
    name: string;
    page?: number;
    size?: number;
  }): Promise<DrugSearchPageResponse> {
    const response = await api.get<ApiResponse<DrugSearchPageResponse>>('/drugs/search/page', {
      params: {
        name: params.name,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    });
    return response.data.result!;
  },

  // 품목기준코드로 약 상세 조회
  async getDrugByItemSeq(itemSeq: string): Promise<DrugInfo> {
    const response = await api.get<ApiResponse<DrugInfo>>(`/drugs/${itemSeq}`);
    return response.data.result!;
  },
};
