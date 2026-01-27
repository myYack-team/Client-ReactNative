import { ImageSourcePropType } from 'react-native';

export interface SymptomOption {
  id: string;
  label: string;
  icon: ImageSourcePropType;
  color: string;
}

export const SYMPTOM_OPTIONS: readonly SymptomOption[] = [
  { id: 'headache', label: '두통', icon: require('../assets/images/symptoms/headache.png'), color: '#FF6B6B' },
  { id: 'fatigue', label: '피로감', icon: require('../assets/images/symptoms/fatigue.png'), color: '#9CA3AF' },
  { id: 'dizziness', label: '어지러움', icon: require('../assets/images/symptoms/dizziness.png'), color: '#FFB84D' },
  { id: 'nausea', label: '메스꺼움', icon: require('../assets/images/symptoms/nausea.png'), color: '#FFB84D' },
  { id: 'stomachache', label: '복통', icon: require('../assets/images/symptoms/stomachache.png'), color: '#FF6B6B' },
  { id: 'indigestion', label: '소화불량', icon: require('../assets/images/symptoms/indigestion.png'), color: '#FFB84D' },
  { id: 'insomnia', label: '불면증', icon: require('../assets/images/symptoms/insomnia.png'), color: '#5B7FFF' },
  { id: 'anxiety', label: '불안감', icon: require('../assets/images/symptoms/anxiety.png'), color: '#FFB84D' },
  { id: 'muscle_pain', label: '근육통', icon: require('../assets/images/symptoms/muscle_pain.png'), color: '#FF6B6B' },
  { id: 'joint_pain', label: '관절통', icon: require('../assets/images/symptoms/joint_pain.png'), color: '#FF6B6B' },
  { id: 'rash', label: '피부 발진', icon: require('../assets/images/symptoms/rash.png'), color: '#FF6B6B' },
  { id: 'cough', label: '기침', icon: require('../assets/images/symptoms/cough.png'), color: '#FFB84D' },
] as const;
