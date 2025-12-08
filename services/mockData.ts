import {
  User,
  Medication,
  MedicationListItem,
  MedicationsResponse,
  TodayResponse,
  IntakesResponse,
  RecordIntakeResponse,
  RemindersResponse,
  ScanResult,
  MedicationTiming,
  DrugInfo,
} from '../types';

// 현재 날짜 형식
const today = new Date();
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const dayOfWeekKorean = ['일', '월', '화', '수', '목', '금', '토'];

// Mock 사용자 데이터
export const mockUser: User = {
  id: 1,
  kakaoId: '1234567890',
  name: '홍길동',
  profileImage: undefined,
  fontSize: 'LARGE',
  createdAt: '2024-12-01T10:00:00',
};

// Mock DrugInfo 데이터
const mockDrugInfos: Record<string, DrugInfo> = {
  '200808876': {
    itemSeq: '200808876',
    itemName: '아스피린프로텍트100mg',
    entpName: '바이엘코리아',
    efficacy: '혈전 예방제 / 심혈관 질환 예방',
    useMethod: '1일 1~2회, 1회 1정',
    warning: '위장장애가 있을 수 있으므로 식후에 복용하세요.',
    caution: '출혈 위험이 있으니 수술 전 의사에게 복용 사실을 알려주세요.',
    sideEffect: '위장장애, 출혈',
    storageMethod: '실온보관',
    imageUrl: undefined,
  },
  '200404413': {
    itemSeq: '200404413',
    itemName: '메트포르민500mg',
    entpName: '한국화이자',
    efficacy: '당뇨병 치료제 / 혈당 조절',
    useMethod: '1일 2회, 1회 1정',
    warning: '설사, 복통 등 위장장애가 있을 수 있습니다.',
    caution: '음주를 피하세요. 신장 기능이 저하된 경우 의사와 상담하세요.',
    sideEffect: '설사, 복통, 메스꺼움',
    storageMethod: '실온보관',
    imageUrl: undefined,
  },
  '200409401': {
    itemSeq: '200409401',
    itemName: '리피토10mg',
    entpName: '한국화이자',
    efficacy: '고지혈증 치료제 / 콜레스테롤 저하',
    useMethod: '1일 1회, 1회 1정',
    warning: '자몽이나 자몽주스와 함께 복용하지 마세요.',
    caution: '근육통이 발생하면 즉시 의사에게 알리세요.',
    sideEffect: '근육통, 두통',
    storageMethod: '실온보관',
    imageUrl: undefined,
  },
};

// Mock 약 목록 데이터
export const mockMedicationsList: MedicationListItem[] = [
  {
    id: 1,
    drugName: '아스피린프로텍트100mg',
    imageUrl: undefined,
    dosage: 1,
    frequency: 2,
    timings: ['AFTER_BREAKFAST', 'AFTER_DINNER'],
    remainingCount: 58,
    daysLeft: 29,
  },
  {
    id: 2,
    drugName: '메트포르민500mg',
    imageUrl: undefined,
    dosage: 1,
    frequency: 2,
    timings: ['AFTER_BREAKFAST', 'AFTER_DINNER'],
    remainingCount: 56,
    daysLeft: 28,
  },
  {
    id: 3,
    drugName: '리피토10mg',
    imageUrl: undefined,
    dosage: 1,
    frequency: 1,
    timings: ['BEFORE_BED'],
    remainingCount: 28,
    daysLeft: 28,
  },
];

// Mock 약 상세 데이터
export const mockMedications: Record<number, Medication> = {
  1: {
    id: 1,
    drugName: '아스피린프로텍트100mg',
    imageUrl: undefined,
    dosage: 1,
    frequency: 2,
    timings: ['AFTER_BREAKFAST', 'AFTER_DINNER'],
    durationDays: 30,
    totalCount: 60,
    remainingCount: 58,
    startDate: '2024-12-05',
    createdAt: '2024-12-05T10:00:00',
    memo: undefined,
    drugInfo: mockDrugInfos['200808876'],
    reminders: [
      { id: 1, time: '08:00', timing: 'AFTER_BREAKFAST', timingLabel: '아침 식후', enabled: true },
      { id: 2, time: '18:30', timing: 'AFTER_DINNER', timingLabel: '저녁 식후', enabled: true },
    ],
  },
  2: {
    id: 2,
    drugName: '메트포르민500mg',
    imageUrl: undefined,
    dosage: 1,
    frequency: 2,
    timings: ['AFTER_BREAKFAST', 'AFTER_DINNER'],
    durationDays: 30,
    totalCount: 60,
    remainingCount: 56,
    startDate: '2024-12-05',
    createdAt: '2024-12-05T10:00:00',
    memo: undefined,
    drugInfo: mockDrugInfos['200404413'],
    reminders: [
      { id: 3, time: '08:00', timing: 'AFTER_BREAKFAST', timingLabel: '아침 식후', enabled: true },
      { id: 4, time: '18:30', timing: 'AFTER_DINNER', timingLabel: '저녁 식후', enabled: true },
    ],
  },
  3: {
    id: 3,
    drugName: '리피토10mg',
    imageUrl: undefined,
    dosage: 1,
    frequency: 1,
    timings: ['BEFORE_BED'],
    durationDays: 30,
    totalCount: 30,
    remainingCount: 28,
    startDate: '2024-12-05',
    createdAt: '2024-12-05T10:00:00',
    memo: undefined,
    drugInfo: mockDrugInfos['200409401'],
    reminders: [
      { id: 5, time: '22:00', timing: 'BEFORE_BED', timingLabel: '취침 전', enabled: true },
    ],
  },
};

// Mock 오늘의 복약 데이터
export const mockTodayResponse: TodayResponse = {
  date: formatDate(today),
  dayOfWeek: dayOfWeekKorean[today.getDay()],
  schedules: [
    {
      timing: 'AFTER_BREAKFAST',
      timingLabel: '아침 식후',
      scheduledTime: '08:00',
      medications: [
        { id: 1, name: '아스피린프로텍트100mg', dosage: 1, taken: true, takenAt: '2024-12-05T08:05:00' },
        { id: 2, name: '메트포르민500mg', dosage: 1, taken: false, takenAt: null },
      ],
      allTaken: false,
    },
    {
      timing: 'AFTER_DINNER',
      timingLabel: '저녁 식후',
      scheduledTime: '18:30',
      medications: [
        { id: 1, name: '아스피린프로텍트100mg', dosage: 1, taken: false, takenAt: null },
        { id: 2, name: '메트포르민500mg', dosage: 1, taken: false, takenAt: null },
      ],
      allTaken: false,
    },
    {
      timing: 'BEFORE_BED',
      timingLabel: '취침 전',
      scheduledTime: '22:00',
      medications: [
        { id: 3, name: '리피토10mg', dosage: 1, taken: false, takenAt: null },
      ],
      allTaken: false,
    },
  ],
  summary: {
    totalMedications: 5,
    takenCount: 1,
    remainingCount: 4,
  },
};

// Mock 복약 기록 응답
export const mockIntakesResponse: IntakesResponse = {
  date: formatDate(today),
  schedules: mockTodayResponse.schedules,
  summary: {
    totalScheduled: 5,
    totalTaken: 1,
    completionRate: 20.0,
  },
};

// Mock 알림 목록
export const mockRemindersResponse: RemindersResponse = {
  reminders: [
    { id: 1, medicationId: 1, medicationName: '아스피린프로텍트100mg', time: '08:00', timing: 'AFTER_BREAKFAST', timingLabel: '아침 식후', enabled: true },
    { id: 2, medicationId: 1, medicationName: '아스피린프로텍트100mg', time: '18:30', timing: 'AFTER_DINNER', timingLabel: '저녁 식후', enabled: true },
    { id: 3, medicationId: 2, medicationName: '메트포르민500mg', time: '08:00', timing: 'AFTER_BREAKFAST', timingLabel: '아침 식후', enabled: true },
    { id: 4, medicationId: 2, medicationName: '메트포르민500mg', time: '18:30', timing: 'AFTER_DINNER', timingLabel: '저녁 식후', enabled: true },
    { id: 5, medicationId: 3, medicationName: '리피토10mg', time: '22:00', timing: 'BEFORE_BED', timingLabel: '취침 전', enabled: true },
  ],
  totalCount: 5,
};

// Mock 처방전 스캔 결과
export const mockScanResult: ScanResult = {
  success: true,
  confidence: 'high',
  medications: [
    {
      name: '아스피린프로텍트100mg',
      drugItemSeq: '200808876',
      dosage: 1,
      frequency: 2,
      timings: ['AFTER_BREAKFAST', 'AFTER_DINNER'],
      durationDays: 30,
      totalCount: 60,
      efficacy: '혈전 예방제 / 심혈관 질환 예방',
      entpName: '바이엘코리아',
      imageUrl: undefined,
    },
    {
      name: '메트포르민500mg',
      drugItemSeq: '200404413',
      dosage: 1,
      frequency: 2,
      timings: ['AFTER_BREAKFAST', 'AFTER_DINNER'],
      durationDays: 30,
      totalCount: 60,
      efficacy: '당뇨병 치료제 / 혈당 조절',
      entpName: '한국화이자',
      imageUrl: undefined,
    },
  ],
  notes: null,
};

// Mock 서비스 (서버 없이 테스트용)
export const mockMedicationService = {
  async scanPrescription(_imageUri: string): Promise<ScanResult> {
    await delay(1500);
    return mockScanResult;
  },

  async createMedication(medication: any): Promise<Medication> {
    await delay(500);
    const newId = Math.max(...Object.keys(mockMedications).map(Number)) + 1;
    const newMedication: Medication = {
      ...medication,
      id: newId,
      drugName: medication.customDrugName || medication.name || '새 약',
      remainingCount: medication.totalCount,
      createdAt: new Date().toISOString(),
      reminders: [],
    };
    mockMedications[newId] = newMedication;
    return newMedication;
  },

  async getMedications(): Promise<MedicationsResponse> {
    await delay(300);
    return {
      medications: mockMedicationsList,
      totalCount: mockMedicationsList.length,
    };
  },

  async getMedication(id: number): Promise<Medication> {
    await delay(300);
    const medication = mockMedications[id];
    if (!medication) {
      throw new Error('약 정보를 찾을 수 없습니다');
    }
    return medication;
  },

  async updateMedication(id: number, data: Partial<any>): Promise<Medication> {
    await delay(500);
    const medication = mockMedications[id];
    if (!medication) {
      throw new Error('약 정보를 찾을 수 없습니다');
    }
    Object.assign(medication, data);
    return medication;
  },

  async deleteMedication(id: number): Promise<void> {
    await delay(500);
    delete mockMedications[id];
  },

  async getTodaySchedule(): Promise<TodayResponse> {
    await delay(300);
    return mockTodayResponse;
  },
};

export const mockIntakeService = {
  async recordIntake(params: { medicationIds: number[]; takenAt: string; timing: MedicationTiming }): Promise<RecordIntakeResponse> {
    await delay(500);
    return {
      intakes: params.medicationIds.map((id, index) => ({
        id: Date.now() + index,
        medicationId: id,
        medicationName: mockMedications[id]?.drugName || '알 수 없는 약',
        takenAt: params.takenAt,
        timing: params.timing,
        status: 'TAKEN' as const,
      })),
      updatedMedications: params.medicationIds.map(id => ({
        id,
        remainingCount: (mockMedications[id]?.remainingCount || 10) - 1,
        lowStock: false,
      })),
    };
  },

  async getIntakesByDate(date?: string): Promise<IntakesResponse> {
    await delay(300);
    return {
      ...mockIntakesResponse,
      date: date || formatDate(today),
    };
  },

  async getIntakesByDateRange(_startDate: string, _endDate: string): Promise<IntakesResponse> {
    await delay(300);
    return mockIntakesResponse;
  },

  async markAsTaken(medicationIds: number[], timing: MedicationTiming, takenAt?: string): Promise<RecordIntakeResponse> {
    return this.recordIntake({
      medicationIds,
      timing,
      takenAt: takenAt || new Date().toISOString(),
    });
  },
};

export const mockUserService = {
  async getMe(): Promise<User> {
    await delay(300);
    return mockUser;
  },

  async updateMe(data: { name?: string; fontSize?: string }): Promise<{ id: number; name: string; fontSize: string }> {
    await delay(500);
    if (data.name) mockUser.name = data.name;
    if (data.fontSize) mockUser.fontSize = data.fontSize as any;
    return {
      id: mockUser.id,
      name: mockUser.name,
      fontSize: mockUser.fontSize,
    };
  },
};

export const mockReminderService = {
  async getReminders(): Promise<RemindersResponse> {
    await delay(300);
    return mockRemindersResponse;
  },

  async updateReminderTime(id: number, time: string): Promise<{ id: number; time: string; enabled: boolean }> {
    await delay(500);
    const reminder = mockRemindersResponse.reminders.find(r => r.id === id);
    if (reminder) reminder.time = time;
    return { id, time, enabled: reminder?.enabled || true };
  },

  async toggleReminder(id: number): Promise<{ id: number; enabled: boolean }> {
    await delay(500);
    const reminder = mockRemindersResponse.reminders.find(r => r.id === id);
    if (reminder) reminder.enabled = !reminder.enabled;
    return { id, enabled: reminder?.enabled || false };
  },
};

// 딜레이 유틸리티
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
