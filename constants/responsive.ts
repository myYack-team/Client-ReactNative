// Breakpoints
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
} as const;

// 콘텐츠 최대 너비 (태블릿에서 중앙 정렬)
export const CONTENT_MAX_WIDTH = 600;

// 모달 너비
export const MODAL_WIDTH = {
  mobile: 0.85, // 화면 너비의 85%
  tablet: 480, // 고정 480px
} as const;
