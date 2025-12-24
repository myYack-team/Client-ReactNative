/**
 * 입력값 검증 유틸리티
 */

// 약 이름 검증
export const validateMedicationName = (name: string): string | null => {
  if (!name || !name.trim()) {
    return '약 이름을 입력해주세요.';
  }
  if (name.trim().length < 2) {
    return '약 이름은 2자 이상이어야 합니다.';
  }
  if (name.length > 100) {
    return '약 이름은 100자 이하여야 합니다.';
  }
  return null; // 유효함
};

// 복용량 검증
export const validateDosage = (dosage: string | number): string | null => {
  const num = typeof dosage === 'string' ? parseInt(dosage, 10) : dosage;
  if (isNaN(num) || num < 1) {
    return '복용량은 1 이상이어야 합니다.';
  }
  if (num > 100) {
    return '복용량은 100 이하여야 합니다.';
  }
  return null;
};

// 복용 횟수 검증
export const validateFrequency = (frequency: string | number): string | null => {
  const num = typeof frequency === 'string' ? parseInt(frequency, 10) : frequency;
  if (isNaN(num) || num < 1) {
    return '복용 횟수는 1 이상이어야 합니다.';
  }
  if (num > 10) {
    return '복용 횟수는 10 이하여야 합니다.';
  }
  return null;
};

// 복용 일수 검증
export const validateDurationDays = (days: string | number): string | null => {
  const num = typeof days === 'string' ? parseInt(days, 10) : days;
  if (isNaN(num) || num < 1) {
    return '복용 일수는 1 이상이어야 합니다.';
  }
  if (num > 365) {
    return '복용 일수는 365일 이하여야 합니다.';
  }
  return null;
};

// 복용 시간 검증
export const validateTimings = (timings: string[]): string | null => {
  if (!timings || timings.length === 0) {
    return '복용 시간은 최소 1개 이상 선택해야 합니다.';
  }
  return null;
};

// 전체 약 등록 폼 검증
export interface MedicationFormErrors {
  name?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  durationDays?: string | null;
  timings?: string | null;
}

export const validateMedicationForm = (
  name: string,
  dosage: string | number,
  frequency: string | number,
  durationDays: string | number,
  timings: string[]
): MedicationFormErrors => {
  return {
    name: validateMedicationName(name),
    dosage: validateDosage(dosage),
    frequency: validateFrequency(frequency),
    durationDays: validateDurationDays(durationDays),
    timings: validateTimings(timings),
  };
};

// 폼에 에러가 있는지 확인
export const hasFormErrors = (errors: MedicationFormErrors): boolean => {
  return Object.values(errors).some((error) => error !== null);
};
