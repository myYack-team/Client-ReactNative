import { TimingOption } from '../constants';

export interface User {
  id: number;
  kakaoId: string;
  name: string;
  profileImage?: string;
  fontSize: 'small' | 'medium' | 'large';
  createdAt: string;
}

export interface Medication {
  id: number;
  userId: number;
  name: string;
  dosage: string;
  frequency: number;
  timing: TimingOption[];
  durationDays: number;
  totalCount: number;
  remainingCount: number;
  startDate: string;
  createdAt: string;
}

export interface Reminder {
  id: number;
  medicationId: number;
  time: string;
  enabled: boolean;
  createdAt: string;
}

export interface Intake {
  id: number;
  medicationId: number;
  takenAt: string;
  status: 'taken' | 'missed' | 'skipped';
}

export interface ScanResult {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  medications: ScannedMedication[];
  notes?: string;
}

export interface ScannedMedication {
  name: string;
  dosage: string;
  frequency: string;
  timing: TimingOption[];
  durationDays: number;
  totalCount: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TodayMedication {
  timing: TimingOption;
  time: string;
  medications: MedicationWithIntake[];
}

export interface MedicationWithIntake extends Medication {
  isTaken: boolean;
  intakeId?: number;
}
