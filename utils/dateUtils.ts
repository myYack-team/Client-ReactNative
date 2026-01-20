/**
 * 날짜 관련 유틸리티 함수
 * 로컬 타임존 기준으로 날짜/시간을 처리합니다.
 */

/**
 * Date 객체를 로컬 타임존 기준 YYYY-MM-DD 형식 문자열로 변환
 * @param date - 변환할 Date 객체
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 *
 * @example
 * const today = new Date();
 * formatDateToLocal(today); // "2025-01-20"
 */
export const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Date 객체를 로컬 타임존 기준 YYYY-MM-DD HH:mm:ss 형식 문자열로 변환
 * @param date - 변환할 Date 객체
 * @returns YYYY-MM-DD HH:mm:ss 형식의 날짜/시간 문자열
 *
 * @example
 * const now = new Date();
 * formatDateTimeToLocal(now); // "2025-01-20 14:30:00"
 */
export const formatDateTimeToLocal = (date: Date): string => {
  const dateString = formatDateToLocal(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateString} ${hours}:${minutes}:${seconds}`;
};

/**
 * Date 객체를 로컬 타임존 기준 HH:mm 형식 문자열로 변환
 * @param date - 변환할 Date 객체
 * @returns HH:mm 형식의 시간 문자열
 *
 * @example
 * const now = new Date();
 * formatTimeToLocal(now); // "14:30"
 */
export const formatTimeToLocal = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * YYYY-MM-DD 형식 문자열을 Date 객체로 변환 (로컬 타임존 기준)
 * @param dateString - YYYY-MM-DD 형식의 날짜 문자열
 * @returns Date 객체
 *
 * @example
 * parseLocalDate("2025-01-20"); // Date 객체 (로컬 타임존)
 */
export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * 두 날짜가 같은 날인지 확인 (로컬 타임존 기준)
 * @param date1 - 첫 번째 날짜
 * @param date2 - 두 번째 날짜
 * @returns 같은 날이면 true, 아니면 false
 *
 * @example
 * isSameDay(new Date(), new Date()); // true
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDateToLocal(date1) === formatDateToLocal(date2);
};

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 * @returns 오늘 날짜 문자열
 *
 * @example
 * getTodayString(); // "2025-01-20"
 */
export const getTodayString = (): string => {
  return formatDateToLocal(new Date());
};

/**
 * 날짜에 일수를 더한 새로운 날짜 반환
 * @param date - 기준 날짜
 * @param days - 더할 일수 (음수 가능)
 * @returns 새로운 Date 객체
 *
 * @example
 * addDays(new Date(), 7); // 7일 후
 * addDays(new Date(), -1); // 어제
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
