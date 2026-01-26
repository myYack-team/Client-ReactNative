export interface SymptomOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export const SYMPTOM_OPTIONS: readonly SymptomOption[] = [
  { id: 'headache', label: '두통', emoji: '🤕', color: '#FF6B6B' },
  { id: 'fatigue', label: '피로감', emoji: '😩', color: '#9CA3AF' },
  { id: 'dizziness', label: '어지러움', emoji: '😵', color: '#FFB84D' },
  { id: 'nausea', label: '메스꺼움', emoji: '🤢', color: '#FFB84D' },
  { id: 'stomachache', label: '복통', emoji: '🤢', color: '#FF6B6B' },
  { id: 'indigestion', label: '소화불량', emoji: '😖', color: '#FFB84D' },
  { id: 'insomnia', label: '불면증', emoji: '😴', color: '#5B7FFF' },
  { id: 'anxiety', label: '불안감', emoji: '😰', color: '#FFB84D' },
  { id: 'muscle_pain', label: '근육통', emoji: '💪', color: '#FF6B6B' },
  { id: 'joint_pain', label: '관절통', emoji: '🦴', color: '#FF6B6B' },
  { id: 'rash', label: '피부 발진', emoji: '🔴', color: '#FF6B6B' },
  { id: 'cough', label: '기침', emoji: '😷', color: '#FFB84D' },
] as const;
