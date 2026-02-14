/**
 * 약물 관련 유틸리티 함수
 */

import {
  MedicationListItem,
  UserSupplement,
  MedicationListItemUnified,
  MedicationTiming,
} from '../types';

/**
 * 약물의 표시용 이름을 반환합니다.
 * displayName이 있으면 우선 사용하고, 없으면 name/drugName을 사용합니다.
 */
export function getMedDisplayName(
  medication: { displayName?: string | null; name?: string; drugName?: string }
): string {
  return medication.displayName || medication.name || medication.drugName || '이름 없음';
}

/**
 * 시간대에 따른 기본 시간 반환
 */
function getDefaultTimeForTiming(timing: MedicationTiming): string {
  switch (timing) {
    case 'MORNING':
      return '08:00';
    case 'AFTERNOON':
      return '13:00';
    case 'EVENING':
      return '19:00';
    case 'AS_NEEDED':
    default:
      return '00:00';
  }
}

/**
 * 약물을 통합 아이템으로 변환
 */
export function toUnifiedMedication(med: MedicationListItem): MedicationListItemUnified {
  return {
    id: med.id,
    type: 'medication',
    name: med.drugName,
    displayName: med.displayName,
    dosage: String(med.dosage),
    frequency: med.frequency,
    imageUrl: med.imageUrl,
    reminders: med.reminders,
    remainingCount: med.remainingCount,
    daysLeft: med.daysLeft,
    ingredientKr: med.ingredientKr,
  };
}

/**
 * 영양제를 통합 아이템으로 변환
 */
export function toUnifiedSupplement(supp: UserSupplement): MedicationListItemUnified {
  return {
    id: supp.id,
    type: 'supplement',
    name: supp.supplementName,
    displayName: supp.supplementName,
    dosage: supp.dosage,
    frequency: supp.frequency,
    imageUrl: supp.imageUrl,
    reminders: supp.timings?.map((timing, idx) => ({
      id: idx,
      timing,
      time: getDefaultTimeForTiming(timing),
      enabled: true,
    })),
    supplementTag: supp.tag,
    supplementId: supp.supplementId,
  };
}

/**
 * 약물 + 영양제 통합 목록 생성
 * 정렬: 약물 먼저, 영양제 나중
 */
export function mergeAndSortItems(
  medications: MedicationListItem[],
  supplements: UserSupplement[]
): MedicationListItemUnified[] {
  const unifiedMeds = medications.map(toUnifiedMedication);
  const unifiedSupps = supplements.map(toUnifiedSupplement);

  return [...unifiedMeds, ...unifiedSupps];
}
