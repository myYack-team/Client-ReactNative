export { default as api } from './api';
export { authService, type AuthTokens } from './auth';
export { medicationService as realMedicationService } from './medication';
export { intakeService as realIntakeService } from './intake';
export { userService as realUserService } from './user';
export { reminderService as realReminderService } from './reminder';
export { notificationService, NOTIFICATION_ACTIONS, NOTIFICATION_CATEGORY } from './notification';
export { prescriptionService } from './prescription';
export { supplementService } from './supplement';
export { drugService } from './drug';
export { analysisService } from './analysis';
export { errorReporting } from './errorReporting';

// Mock 서비스 (서버 없이 테스트용)
export {
  mockMedicationService,
  mockIntakeService,
  mockUserService,
  mockReminderService,
  mockUser,
  mockTodayResponse,
  mockMedicationsList,
  mockMedications,
} from './mockData';

// 서버 연결 여부에 따라 사용할 서비스 선택
// TODO: 서버 구현 후 USE_MOCK_DATA를 false로 변경
const USE_MOCK_DATA = false;

import { medicationService as realMedicationServiceImport } from './medication';
import { intakeService as realIntakeServiceImport } from './intake';
import { userService as realUserServiceImport } from './user';
import { reminderService as realReminderServiceImport } from './reminder';
import {
  mockMedicationService,
  mockIntakeService,
  mockUserService,
  mockReminderService,
} from './mockData';

export const medicationService = USE_MOCK_DATA ? mockMedicationService : realMedicationServiceImport;
export const intakeService = USE_MOCK_DATA ? mockIntakeService : realIntakeServiceImport;
export const userService = USE_MOCK_DATA ? mockUserService : realUserServiceImport;
export const reminderService = USE_MOCK_DATA ? mockReminderService : realReminderServiceImport;
