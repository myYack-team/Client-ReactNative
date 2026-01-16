import api from './api';
import {
  ApiResponse,
  QnAQuestion,
  QnAQuestionDetail,
  QnAListResponse,
  QnAReplyResult,
} from '../types';

// Q&A 생성 요청
export interface CreateQnARequest {
  title: string;
  content: string;
}

// Q&A 답글 추가 요청
export interface AddReplyRequest {
  content: string;
}

export const qnaService = {
  // 내 문의 목록 조회
  async getMyQuestions(page: number = 0, size: number = 20): Promise<QnAListResponse> {
    const response = await api.get<ApiResponse<QnAListResponse>>('/qna', {
      params: { page, size },
    });
    return response.data.result!;
  },

  // 문의 상세 조회
  async getQuestionDetail(qnaId: number): Promise<QnAQuestionDetail> {
    const response = await api.get<ApiResponse<QnAQuestionDetail>>(`/qna/${qnaId}`);
    return response.data.result!;
  },

  // 문의 생성
  async createQuestion(data: CreateQnARequest): Promise<QnAQuestion> {
    const response = await api.post<ApiResponse<QnAQuestion>>('/qna', data);
    return response.data.result!;
  },

  // 답글 추가
  async addReply(qnaId: number, data: AddReplyRequest): Promise<QnAReplyResult> {
    const response = await api.post<ApiResponse<QnAReplyResult>>(`/qna/${qnaId}/replies`, data);
    return response.data.result!;
  },

  // 문의 삭제
  async deleteQuestion(qnaId: number): Promise<void> {
    await api.delete<ApiResponse<void>>(`/qna/${qnaId}`);
  },
};
