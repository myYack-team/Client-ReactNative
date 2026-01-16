// API Response 형식
export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T | null;
}

// Enum 타입들
export type FontSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export type Gender = 'MALE' | 'FEMALE';

export type SignupPurpose = 'SELF' | 'CHILD' | 'PARENT' | 'AI_REPORT';

// 성별 라벨 매핑
export const GENDER_LABELS: Record<Gender, string> = {
  MALE: '남성',
  FEMALE: '여성',
};

// 연령대 옵션
export const AGE_RANGE_OPTIONS = [
  '10대',
  '20대',
  '30대',
  '40대',
  '50대',
  '60대 이상',
] as const;

export type AgeRange = typeof AGE_RANGE_OPTIONS[number];

// 가입목적 라벨 매핑
export const SIGNUP_PURPOSE_LABELS: Record<SignupPurpose, string> = {
  SELF: '나의 약 관리',
  CHILD: '자녀 약 관리',
  PARENT: '부모님 약 관리',
  AI_REPORT: 'AI 복약 분석 레포트',
};

// 가입목적 옵션 배열
export const SIGNUP_PURPOSE_OPTIONS: SignupPurpose[] = [
  'SELF',
  'CHILD',
  'PARENT',
  'AI_REPORT',
];

export type MedicationTiming =
  | 'MORNING'
  | 'AFTERNOON'
  | 'EVENING'
  | 'AS_NEEDED';

export type IntakeStatus = 'TAKEN' | 'MISSED' | 'SKIPPED';

// 의약품 타입
export type DrugType = 'PROFESSIONAL' | 'GENERAL' | 'SUPPLEMENT' | 'UNKNOWN';

// 영양제 태그
export type SupplementTag =
  | 'VITAMIN_A'
  | 'VITAMIN_B'
  | 'VITAMIN_C'
  | 'VITAMIN_D'
  | 'VITAMIN_E'
  | 'OMEGA_3'
  | 'MAGNESIUM'
  | 'CALCIUM'
  | 'IRON'
  | 'ZINC'
  | 'ARGININE'
  | 'COLLAGEN'
  | 'PROBIOTICS'
  | 'LUTEIN'
  | 'COENZYME_Q10'
  | 'OTHER';

// 의약품 타입 라벨 매핑
export const DRUG_TYPE_LABELS: Record<DrugType, string> = {
  PROFESSIONAL: '전문',
  GENERAL: '일반',
  SUPPLEMENT: '영양제',
  UNKNOWN: '미분류',
};

// 의약품 타입 색상 매핑
export const DRUG_TYPE_COLORS: Record<DrugType, string> = {
  PROFESSIONAL: '#F97316',  // 주황색
  GENERAL: '#22C55E',       // 초록색
  SUPPLEMENT: '#3B82F6',    // 파란색
  UNKNOWN: '#6B7280',       // 회색
};

// 영양제 태그 라벨 매핑
export const SUPPLEMENT_TAG_LABELS: Record<SupplementTag, string> = {
  VITAMIN_A: '비타민 A',
  VITAMIN_B: '비타민 B',
  VITAMIN_C: '비타민 C',
  VITAMIN_D: '비타민 D',
  VITAMIN_E: '비타민 E',
  OMEGA_3: '오메가 3',
  MAGNESIUM: '마그네슘',
  CALCIUM: '칼슘',
  IRON: '철분',
  ZINC: '아연',
  ARGININE: '아르기닌',
  COLLAGEN: '콜라겐',
  PROBIOTICS: '유산균',
  LUTEIN: '루테인',
  COENZYME_Q10: '코엔자임Q10',
  OTHER: '기타',
};

// 영양제 태그 옵션 배열
export const SUPPLEMENT_TAG_OPTIONS: SupplementTag[] = [
  'VITAMIN_A',
  'VITAMIN_B',
  'VITAMIN_C',
  'VITAMIN_D',
  'VITAMIN_E',
  'OMEGA_3',
  'MAGNESIUM',
  'CALCIUM',
  'IRON',
  'ZINC',
  'ARGININE',
  'COLLAGEN',
  'PROBIOTICS',
  'LUTEIN',
  'COENZYME_Q10',
  'OTHER',
];

// Timing 라벨 매핑
export const TIMING_LABELS: Record<MedicationTiming, string> = {
  MORNING: '아침',
  AFTERNOON: '점심',
  EVENING: '저녁',
  AS_NEEDED: '필요시',
};

// Timing 옵션 배열
export const TIMING_OPTIONS: MedicationTiming[] = [
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'AS_NEEDED',
];

// 사용자
export interface User {
  id: number;
  kakaoId: string;
  name: string;
  email?: string;
  profileImage?: string;
  fontSize: FontSize;
  createdAt: string;
}

// 약물 정보 (식약처 API 기반)
export interface DrugInfo {
  itemSeq: string;        // 품목기준코드
  itemName: string;       // 제품명 (원본)
  displayName?: string;   // 표시용 약물명 ("메드론정4밀리그람")
  ingredientKr?: string;  // 한글 성분명 ("메틸프레드니솔론")
  entpName: string;       // 업체명
  efficacy?: string;      // 효능/효과
  useMethod?: string;     // 용법/용량
  warning?: string;       // 경고
  caution?: string;       // 주의사항
  interaction?: string;   // 상호작용
  sideEffect?: string;    // 부작용
  storageMethod?: string; // 보관법
  imageUrl?: string;      // 약 이미지
  drugType?: DrugType;    // 전문/일반/영양제 구분
}

// 약 정보 (상세)
export interface Medication {
  id: number;
  drugName: string;       // 약 이름 (drugInfo가 있으면 그것, 없으면 customDrugName)
  imageUrl?: string;      // 약 이미지 URL
  dosage: number;
  frequency: number;
  timings: MedicationTiming[];
  durationDays: number;
  totalCount: number;
  remainingCount: number;
  startDate: string;
  createdAt: string;
  memo?: string;
  reminders?: Reminder[];
  drugInfo?: DrugInfo;    // 식약처 API 약물 상세 정보
}

// 약 목록 아이템 (간략)
export interface MedicationListItem {
  id: number;
  drugName: string;       // 약 이름
  displayName?: string;   // 표시용 약물명 (한글 이름만)
  ingredientKr?: string;  // 한글 성분명
  imageUrl?: string;      // 약 이미지 URL
  dosage: number;
  frequency: number;
  timings: MedicationTiming[];
  remainingCount: number;
  daysLeft: number;
  reminders?: Reminder[]; // 알림 정보 (시간 표시용)
}

// 알림
export interface Reminder {
  id: number;
  medicationId?: number;
  medicationName?: string;
  time: string;
  timing: MedicationTiming;
  timingLabel?: string;
  enabled: boolean;
}

// 복약 기록
export interface Intake {
  id: number;
  medicationId: number;
  medicationName: string;
  takenAt: string;
  timing: MedicationTiming;
  status: IntakeStatus;
}

// 오늘의 복약 - 스케줄 내 약 정보
export interface ScheduleMedication {
  id: number;
  name: string;
  displayName?: string;      // 표시용 약물명 (한글 이름만)
  ingredientKr?: string;     // 한글 성분명
  dosage: number;
  taken: boolean;
  takenAt?: string | null;
  reminderId?: number;       // 알림 ID (스누즈용)
  drugType?: DrugType;       // 전문/일반 구분 (약물인 경우)
  supplementTag?: SupplementTag;  // 영양제 태그 (영양제인 경우)
  isSupplement?: boolean;    // 영양제 여부
  imageUrl?: string;         // 약 이미지
}

// 오늘의 복약 - 시간대별 스케줄
export interface TodaySchedule {
  timing: MedicationTiming;
  timingLabel: string;
  scheduledTime: string;
  medications: ScheduleMedication[];
  allTaken: boolean;
}

// 오늘의 복약 응답
export interface TodayResponse {
  date: string;
  dayOfWeek: string;
  schedules: TodaySchedule[];
  summary: {
    totalMedications: number;
    takenCount: number;
    remainingCount: number;
  };
}

// 약 목록 응답
export interface MedicationsResponse {
  medications: MedicationListItem[];
  totalCount: number;
}

// 알림 목록 응답
export interface RemindersResponse {
  reminders: Reminder[];
  totalCount: number;
}

// 복약 기록 응답
export interface IntakesResponse {
  date: string;
  schedules: TodaySchedule[];
  summary: {
    totalScheduled: number;
    totalTaken: number;
    completionRate: number;
  };
}

// 복약 확인 요청
export interface RecordIntakeRequest {
  medicationIds: number[];
  takenAt: string;
  timing: MedicationTiming;
  status?: IntakeStatus;  // 복용 상태 (기본값: TAKEN)
}

// 복약 확인 응답
export interface RecordIntakeResponse {
  intakes: Intake[];
  updatedMedications: {
    id: number;
    remainingCount: number;
    lowStock: boolean;
    lowStockMessage?: string;
  }[];
}

// 처방전 스캔 결과
export interface ScanResult {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  medications: ScannedMedication[];
  notes: string | null;
  // 처방전 메타정보 (AI 추출)
  patientName?: string | null;
  hospitalName?: string | null;
  diagnosis?: string | null;
  durationDays?: number | null;
}

export interface ScannedMedication {
  name: string;             // 처방전에서 추출한 이름
  drugItemSeq?: string;     // 매칭된 DrugInfo의 itemSeq (있으면)
  dosage: number;
  frequency: number;
  timings: MedicationTiming[];
  durationDays: number;
  totalCount: number;
  // DrugInfo에서 가져온 정보 (매칭된 경우)
  efficacy?: string;        // 효능/효과
  imageUrl?: string;        // 약 이미지
  entpName?: string;        // 제약회사
}

// 약 등록 요청
export interface CreateMedicationRequest {
  drugItemSeq?: string;     // 식약처 API 약물 코드 (우선)
  customDrugName?: string;  // 직접 입력한 약 이름 (API에 없는 경우)
  dosage: number;
  frequency: number;
  durationDays: number;
  totalCount: number;
  startDate: string;
  memo?: string;            // 사용자 메모
  prescriptionId?: number;  // 처방전 ID (처방전에서 등록된 경우)
  reminderTimes: string[];  // 알림 시간 목록 (필수)
}

// 처방전 복용 상태
export type PrescriptionStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';

// 처방전 복용 상태 라벨
export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  UPCOMING: '복용 예정',
  IN_PROGRESS: '복용 중',
  COMPLETED: '복용 완료',
};

// 처방전 복용 상태 색상
export const PRESCRIPTION_STATUS_COLORS: Record<PrescriptionStatus, { bg: string; text: string }> = {
  UPCOMING: { bg: '#EEF2FF', text: '#4F46E5' },       // 인디고
  IN_PROGRESS: { bg: '#DCFCE7', text: '#16A34A' },   // 초록
  COMPLETED: { bg: '#F3F4F6', text: '#6B7280' },     // 회색
};

// 처방전
export interface Prescription {
  id: number;
  imageUrl: string;
  prescriptionDate: string;
  patientName?: string;
  hospitalName?: string;
  doctorName?: string;
  diagnosis?: string;
  durationDays?: number;
  endDate?: string;
  status?: PrescriptionStatus;
  notes?: string;
  medicationCount: number;
  createdAt: string;
}

// 처방전 약품 요약 (리마인더 포함)
export interface PrescriptionMedicationSummary {
  id: number;
  drugName: string;
  displayName?: string;
  imageUrl?: string;
  dosage: string;
  frequency: number;
  durationDays?: number;
  remainingCount?: number;
  daysLeft?: number;
  reminders?: {
    id: number;
    time: string;
    enabled: boolean;
  }[];
}

// 처방전 상세 (연결된 약품 포함)
export interface PrescriptionDetail extends Prescription {
  medications: PrescriptionMedicationSummary[];
}

// 처방전 목록 응답
export interface PrescriptionListResponse {
  prescriptions: Prescription[];
  totalCount: number;
}

// 처방전 업로드 응답
export interface PrescriptionUploadResponse {
  prescriptionId: number;
  imageUrl: string;
  prescriptionDate: string;
}

// 복용 시점 + 알림 시간 쌍
export interface TimingWithTime {
  timing: MedicationTiming;
  time: string;  // "HH:mm" 형식
}

// 약물 정보 (처방전 일괄 등록용)
export interface RegisterMedicationInfo {
  drugItemSeq?: string;
  customDrugName?: string;
  dosage: number;
  frequency: number;
  timings: TimingWithTime[];
  durationDays: number;
  totalCount: number;
  startDate: string;
  memo?: string;
}

// 처방전 + 약물 일괄 등록 요청
export interface PrescriptionRegisterRequest {
  prescriptionDate?: string;
  patientName?: string;
  hospitalName?: string;
  diagnosis?: string;
  durationDays?: number;
  notes?: string;
  medications: RegisterMedicationInfo[];
}

// 등록된 약물 정보 (일괄 등록 결과용)
export interface RegisteredMedication {
  id: number;
  drugName: string;
  dosage: number;
  frequency: number;
  durationDays: number;
}

// 처방전 + 약물 일괄 등록 응답
export interface PrescriptionRegisterResponse {
  prescriptionId: number;
  imageUrl: string;
  prescriptionDate: string;
  medications: RegisteredMedication[];
  totalMedicationCount: number;
}

// 일별 복약 요약 상태
export type DayStatus = 'COMPLETE' | 'PARTIAL' | 'MISSED' | 'PENDING' | 'NONE';

// 일별 복약 요약
export interface DaySummary {
  date: string;
  totalScheduled: number;
  totalTaken: number;
  status: DayStatus;
}

// 복용 달력 데이터 응답
export interface MonthlySummaryResponse {
  year: number;
  month: number;
  days: DaySummary[];
}

// ========== 영양제 관련 타입 ==========

// 영양제 마스터 (검색용)
export interface Supplement {
  id: number;
  name: string;
  description?: string;
  tag: SupplementTag;
  tagLabel: string;
  imageUrl?: string;
  selectionCount: number;
  createdByName: string;
}

// 영양제 상세
export interface SupplementDetail extends Supplement {
  createdById: number;
  createdAt: string;
}

// 영양제 검색 결과 (페이징)
export interface SupplementListResponse {
  supplements: Supplement[];
  totalCount: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
}

// 사용자 영양제 (내 영양제)
export interface UserSupplement {
  id: number;
  supplementId: number;
  supplementName: string;
  tag: SupplementTag;
  tagLabel: string;
  imageUrl?: string;
  dosage: string;
  frequency: number;
  timings: MedicationTiming[];
}

// 사용자 영양제 목록
export interface UserSupplementListResponse {
  supplements: UserSupplement[];
  totalCount: number;
}

// 사용자 영양제 상세
export interface UserSupplementDetail {
  id: number;
  dosage: string;
  frequency: number;
  timings: MedicationTiming[];
  startDate: string;
  endDate?: string;
  memo?: string;
  createdAt: string;
  reminders: Reminder[];
  supplementInfo: SupplementDetail;
}

// 영양제 등록 요청 (마스터)
export interface CreateSupplementRequest {
  name: string;
  description?: string;
  tag: SupplementTag;
  imageUrl?: string;
}

// 사용자 영양제 추가 요청
export interface AddUserSupplementRequest {
  supplementId: number;
  dosage: string;
  frequency: number;
  timings: MedicationTiming[];
  startDate: string;
  endDate?: string;
  memo?: string;
}

// 사용자 영양제 수정 요청
export interface UpdateUserSupplementRequest {
  dosage?: string;
  frequency?: number;
  timings?: MedicationTiming[];
  endDate?: string;
  memo?: string;
}

// 의약품 검색 결과 (페이징)
export interface DrugSearchPageResponse {
  drugs: DrugInfo[];
  totalCount: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
}

// 스누즈 요청
export interface SnoozeRequest {
  minutes: number;  // 10, 30, 60
}

// 스누즈 응답
export interface SnoozeResponse {
  id: number;
  snoozeUntil: string;
  snoozeMinutes: number;
}

// ========== 중복 약물 체크 관련 타입 ==========

// 중복 약물 체크 요청
export interface DuplicateCheckRequest {
  drugItemSeqs: string[];
}

// 중복된 약물 정보
export interface DuplicateMedication {
  drugItemSeq: string;
  drugName: string;
  existingMedicationId: number;
  remainingCount: number;
  daysLeft: number;
}

// 중복 약물 체크 응답
export interface DuplicateCheckResponse {
  duplicates: DuplicateMedication[];
  duplicateCount: number;
}

// ========== 일괄 삭제 관련 타입 ==========

// 일괄 삭제 결과
export interface BatchDeleteResult {
  requestedCount: number;
  deletedCount: number;
}

// ========== 약물+영양제 통합 목록 타입 ==========

// 통합 목록 아이템 (약물 + 영양제)
export interface MedicationListItemUnified {
  id: number;
  type: 'medication' | 'supplement';

  // 공통 필드
  name: string;
  displayName?: string;
  dosage: string;
  frequency: number;
  imageUrl?: string;
  reminders?: Reminder[];

  // 약물 전용 필드
  remainingCount?: number;
  daysLeft?: number;
  drugType?: DrugType;
  ingredientKr?: string;

  // 영양제 전용 필드
  supplementTag?: SupplementTag;
}

// ========== AI 분석 관련 타입 ==========

// 상호작용 위험도
export type InteractionLevel = 'HIGH' | 'MEDIUM' | 'LOW';

// 상호작용 위험도 라벨 매핑
export const INTERACTION_LEVEL_LABELS: Record<InteractionLevel, string> = {
  HIGH: '주의 필요',
  MEDIUM: '참고',
  LOW: '알아두기',
};

// 상호작용 위험도 색상 매핑
export const INTERACTION_LEVEL_COLORS: Record<InteractionLevel, { bg: string; text: string }> = {
  HIGH: { bg: '#FFEBEE', text: '#D32F2F' },
  MEDIUM: { bg: '#FFF3E0', text: '#E65100' },
  LOW: { bg: '#E3F2FD', text: '#1565C0' },
};

// 기전 그룹 내 약물 정보
export interface MechanismMedication {
  name: string;
  ingredientName?: string;
}

// 기전(작용 메커니즘) 그룹
export interface MechanismGroup {
  categoryName: string;           // "혈압 조절", "당뇨 조절" 등
  categoryIcon: string;           // 이모지 아이콘
  description: string;            // 2~3문장 설명
  analogy: string;                // 비유 1줄
  medicationCount: number;        // 관련 약물 개수
  medications?: MechanismMedication[];  // 상세 클릭 시 표시
}

// 음식 상호작용 상세
export interface FoodInteractionDetail {
  medicationId?: number;
  medicationName: string;
  reason: string;
}

// 음식 병용 정보
export interface FoodInteraction {
  foodName: string;
  foodIcon: string;               // 이모지
  interactionLevel: InteractionLevel;
  affectedMedicationCount: number;
  summaryReason: string;
  details: FoodInteractionDetail[];
}

// 분석 결과 전체
export interface AnalysisResult {
  reportId: number;
  analysisDate: string;
  mechanismGroups: MechanismGroup[];
  foodInteractions: FoodInteraction[];
}

// 레포트 요약 (목록용)
export interface ReportSummary {
  id: number;
  analysisDate: string;
  mechanismGroupCount: number;
  foodInteractionCount: number;
}

// 레포트 목록 응답
export interface ReportListResponse {
  reports: ReportSummary[];
  totalCount: number;
}

// 분석 요청 응답 (동기 방식 - 분석 완료된 결과 직접 반환)
export interface AnalysisRequestResponse extends AnalysisResult {
  quota?: QuotaInfo;
}

// 분석 쿼터 정보
export interface QuotaInfo {
  monthlyLimit: number;
  usedCount: number;
  remainingCount: number;
  resetDate: string;
}

// ========== Q&A 관련 타입 ==========

// Q&A 상태
export type QnAStatus = 'PENDING' | 'ANSWERED' | 'CLOSED';

// Q&A 상태 라벨 매핑
export const QNA_STATUS_LABELS: Record<QnAStatus, string> = {
  PENDING: '답변 대기',
  ANSWERED: '답변 완료',
  CLOSED: '종료됨',
};

// Q&A 상태 색상 매핑
export const QNA_STATUS_COLORS: Record<QnAStatus, { bg: string; text: string }> = {
  PENDING: { bg: '#FFF3E0', text: '#E65100' },
  ANSWERED: { bg: '#E8F5E9', text: '#2E7D32' },
  CLOSED: { bg: '#F3F4F6', text: '#6B7280' },
};

// Q&A 질문 (목록용)
export interface QnAQuestion {
  id: number;
  title: string;
  status: QnAStatus;
  statusLabel: string;
  replyCount: number;
  createdAt: string;
  hasAdminReply: boolean;
}

// Q&A 질문 상세
export interface QnAQuestionDetail {
  id: number;
  title: string;
  content: string;
  status: QnAStatus;
  statusLabel: string;
  createdAt: string;
  replies: QnAReply[];
}

// Q&A 답글
export interface QnAReply {
  id: number;
  content: string;
  isAdmin: boolean;
  adminName?: string;
  createdAt: string;
}

// Q&A 목록 응답
export interface QnAListResponse {
  questions: QnAQuestion[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
}

// Q&A 답글 추가 결과
export interface QnAReplyResult {
  id: number;
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

// ========== AI 동의 관련 타입 ==========

// AI 동의 상태
export interface AiConsentStatus {
  aiDataAgreed: boolean;
  consentedAt?: string;
  consentVersion?: string;
}
