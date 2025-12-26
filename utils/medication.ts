/**
 * 약물 관련 유틸리티 함수
 */

/**
 * 약물의 표시용 이름을 반환합니다.
 * displayName이 있으면 우선 사용하고, 없으면 name/drugName을 사용합니다.
 */
export function getMedDisplayName(
  medication: { displayName?: string | null; name?: string; drugName?: string }
): string {
  return medication.displayName || medication.name || medication.drugName || '이름 없음';
}
