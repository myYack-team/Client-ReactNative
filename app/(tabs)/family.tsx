import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, FlatList, Dimensions, Image, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { CalendarList, LocaleConfig } from 'react-native-calendars';
import { Button, Card, Typography, TabHeader } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { useResponsive } from '../../hooks';
import { useFamilyStore, useAuthStore } from '../../stores';
import { LinkedFamily, PendingRequest, Guardian, TodaySchedule, DaySummary, DayStatus, ScheduleMedication, MedicationTiming } from '../../types';
import { getMedDisplayName } from '../../utils';
import { getTodayString, formatDateToLocal, addDays } from '../../utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_ITEM_WIDTH = (SCREEN_WIDTH - 40) / 7;

// 한글 설정
LocaleConfig.locales['ko'] = {
  monthNames: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  monthNamesShort: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

// 날짜 상태에 따른 색상
const STATUS_COLORS: Record<DayStatus, string> = {
  COMPLETE: '#4CAF50',
  PARTIAL: '#FF9800',
  MISSED: '#F44336',
  PENDING: '#2196F3',
  NONE: 'transparent',
};

// COMPLETE 상태용 연한 배경색

// 요일별 색상
const DAY_OF_WEEK_COLORS = {
  SUNDAY: '#F44336',
  SATURDAY: '#2196F3',
  WEEKDAY: Colors.textPrimary,
};

type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

interface MarkedDates {
  [date: string]: {
    customStyles: {
      container: {
        backgroundColor?: string;
        borderWidth?: number;
        borderColor?: string;
      };
      text: {
        color: string;
        fontWeight?: FontWeight;
      };
    };
  };
}

// 주간 날짜 데이터 생성
const generateWeekDates = () => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = -21; i <= 21; i++) {
    dates.push(formatDateToLocal(addDays(today, i)));
  }
  return dates;
};

// 빈 상태 (가족 연결 없음)
function EmptyFamilyView({ onConnectPress }: { onConnectPress: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../../assets/icons_iamge_processed/family.png')}
        style={styles.emptyIcon}
        accessibilityLabel="Family icon"
        resizeMode="contain"
      />
      <Typography variant="h3" style={styles.emptyTitle}>
        가족과 연결하여 복약을 관리하세요
      </Typography>
      <Typography variant="body" color={Colors.textSecondary} style={styles.emptyDescription}>
        가족의 전화번호로 연동 요청을 보내면{'\n'}
        가족의 복약 현황을 확인할 수 있어요
      </Typography>
      <Button
        title="가족 연결하기"
        variant="primary"
        size="large"
        onPress={onConnectPress}
        style={styles.connectButton}
      />
    </View>
  );
}

// 받은 요청 리스트
function ReceivedRequestsView({
  requests,
  onAccept,
  onReject,
  isLoading,
}: {
  requests: PendingRequest[];
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
  isLoading: boolean;
}) {
  return (
    <Card style={styles.requestCard} variant="elevated">
      <Typography variant="h3" style={styles.requestTitle}>
        받은 연동 요청
      </Typography>
      {requests.map((request) => (
        <View key={request.requestId} style={styles.requestItem}>
          <View style={styles.requestInfo}>
            {request.profileImage ? (
              <Image source={{ uri: request.profileImage }} style={styles.requestAvatar} resizeMode="cover" />
            ) : (
              <View style={[styles.requestAvatar, styles.requestAvatarPlaceholder]}>
                <Image
                  source={require('../../assets/icons_iamge_processed/05_User.png')}
                  style={styles.requestAvatarIcon}
                  accessibilityLabel="User placeholder"
                  resizeMode="contain"
                />
              </View>
            )}
            <View style={styles.requestTextInfo}>
              <Typography variant="body" style={styles.requestName}>
                {request.name}
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                {request.phone}
              </Typography>
            </View>
          </View>
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={[styles.requestActionButton, styles.rejectButton]}
              onPress={() => onReject(request.requestId)}
              disabled={isLoading}
            >
              <Typography variant="caption" color={Colors.error}>거절</Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.requestActionButton, styles.acceptButton]}
              onPress={() => onAccept(request.requestId)}
              disabled={isLoading}
            >
              <Typography variant="caption" color={Colors.white}>수락</Typography>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </Card>
  );
}

// 보낸 요청 대기 상태
function PendingRequestView({
  requests,
  onCancel,
  isLoading,
}: {
  requests: PendingRequest[];
  onCancel: (requestId: number) => void;
  isLoading: boolean;
}) {
  return (
    <Card style={styles.requestCard} variant="elevated">
      <Typography variant="h3" style={styles.requestTitle}>
        보낸 연동 요청
      </Typography>
      {requests.map((request) => (
        <View key={request.requestId} style={styles.pendingRequestItem}>
          <View style={styles.requestInfo}>
            {request.profileImage ? (
              <Image source={{ uri: request.profileImage }} style={styles.requestAvatar} resizeMode="cover" />
            ) : (
              <View style={[styles.requestAvatar, styles.requestAvatarPlaceholder]}>
                <Image
                  source={require('../../assets/icons_iamge_processed/05_User.png')}
                  style={styles.requestAvatarIcon}
                  accessibilityLabel="User placeholder"
                  resizeMode="contain"
                />
              </View>
            )}
            <View style={styles.requestTextInfo}>
              <Typography variant="body" style={styles.requestName}>
                {request.name}님에게 요청 중...
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                {request.phone}
              </Typography>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.requestActionButton, styles.cancelButton]}
            onPress={() => onCancel(request.requestId)}
            disabled={isLoading}
          >
            <Typography variant="caption" color={Colors.error}>취소</Typography>
          </TouchableOpacity>
        </View>
      ))}
    </Card>
  );
}

// 보호자 배너
function GuardianBanner({ guardians }: { guardians: Guardian[] }) {
  if (guardians.length === 0) return null;

  const guardianNames = guardians.map((g) => g.name).join(', ');

  return (
    <View style={styles.guardianBanner}>
      <Image
        source={require('../../assets/icons_iamge_processed/41_Shield.png')}
        style={styles.guardianIcon}
        accessibilityLabel="Guardian icon"
        resizeMode="contain"
      />
      <Typography variant="body" style={styles.guardianText}>
        보호자: {guardianNames}님이 나를 보호하고 있습니다
      </Typography>
    </View>
  );
}

// 시간대 정보 매핑
const TIMING_INFO: Record<MedicationTiming, { label: string }> = {
  MORNING: { label: '아침' },
  AFTERNOON: { label: '점심' },
  EVENING: { label: '저녁' },
  AS_NEEDED: { label: '필요시' },
};

const getTimingIcon = (timing: MedicationTiming): any => {
  const icons: Record<MedicationTiming, any> = {
    MORNING: require('../../assets/icons_iamge_processed/06_Morning.png'),
    AFTERNOON: require('../../assets/icons_iamge_processed/07_Afternoon.png'),
    EVENING: require('../../assets/icons_iamge_processed/08_Evening.png'),
    AS_NEEDED: require('../../assets/icons_iamge_processed/02_Pill.png'),
  };
  return icons[timing];
};

// 연동된 가족 화면 (달력 + 복약 목록)
function LinkedFamilyView({
  family,
  selectedDate,
  setSelectedDate,
  schedules,
  monthlySummary,
  isLoading,
  onRefresh,
  onMonthChange,
}: {
  family: LinkedFamily;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  schedules: TodaySchedule[];
  monthlySummary: DaySummary[];
  isLoading: boolean;
  onRefresh: () => void;
  onMonthChange: (year: number, month: number) => void;
}) {
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [weekDates] = useState(generateWeekDates());
  const weekListRef = useRef<FlatList>(null);
  const [currentMonth, setCurrentMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  const today = getTodayString();

  // 마킹 날짜 업데이트
  useEffect(() => {
    const marked: MarkedDates = {};
    (monthlySummary || []).forEach((day) => {
      const isToday = day.date === today;
      const statusColor = STATUS_COLORS[day.status as DayStatus] || 'transparent';

      marked[day.date] = {
        customStyles: {
          container: {
            backgroundColor: day.status === 'COMPLETE' ? statusColor : 'transparent',
            borderWidth: day.status !== 'COMPLETE' && day.status !== 'NONE' ? 2 : 0,
            borderColor: statusColor,
          },
          text: {
            color: isToday
              ? Colors.primary
              : day.status === 'COMPLETE'
              ? Colors.white
              : Colors.textPrimary,
            fontWeight: (isToday ? 'bold' : 'normal') as FontWeight,
          },
        },
      };
    });

    if (marked[selectedDate]) {
      marked[selectedDate].customStyles.container = {
        ...marked[selectedDate].customStyles.container,
        borderWidth: 2,
        borderColor: Colors.primary,
      };
    }

    setMarkedDates(marked);
  }, [monthlySummary, selectedDate, today]);

  const getDayStatus = (dateString: string): DayStatus => {
    const daySummary = (monthlySummary || []).find((d) => d.date === dateString);
    if (daySummary) {
      return daySummary.status as DayStatus;
    }
    // 서버 데이터 없는 날짜는 NONE (PENDING은 서버가 결정하는 상태)
    return 'NONE';
  };

  const getDayOfWeekColor = (dayIndex: number): string => {
    if (dayIndex === 0) return DAY_OF_WEEK_COLORS.SUNDAY;
    if (dayIndex === 6) return DAY_OF_WEEK_COLORS.SATURDAY;
    return DAY_OF_WEEK_COLORS.WEEKDAY;
  };

  const handleWeekDayPress = async (dateString: string) => {
    setSelectedDate(dateString);

    // 선택한 날짜의 월 데이터가 monthlySummary에 없으면 해당 월 데이터 추가 로드
    if (linkedFamily) {
      const [year, month] = dateString.split('-').map(Number);
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      const hasDataForMonth = monthlySummary.some(d => d.date.startsWith(monthPrefix));

      if (!hasDataForMonth) {
        try {
          const newSummary = await fetchFamilyMonthlySummary(linkedFamily.userId, year, month);
          setMonthlySummary(prev => {
            // 중복 제거하며 병합
            const existingDates = new Set(prev.map(d => d.date));
            const newDays = (newSummary?.days || []).filter(d => !existingDates.has(d.date));
            return [...prev, ...newDays];
          });
        } catch (error) {
          console.error('Failed to load monthly summary:', error);
        }
      }
    }

    const index = weekDates.findIndex((d) => d === dateString);
    if (index !== -1 && weekListRef.current) {
      weekListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  const renderWeekDayItem = ({ item: dateString }: { item: string }) => {
    const dateObj = new Date(dateString);
    const dayIndex = dateObj.getDay();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dayIndex];
    const dayNum = dateObj.getDate();
    const isToday = dateString === today;
    const isSelected = dateString === selectedDate;
    const status = getDayStatus(dateString);
    const statusColor = STATUS_COLORS[status] || 'transparent';
    const dayOfWeekColor = getDayOfWeekColor(dayIndex);

    return (
      <TouchableOpacity
        style={[styles.weekDayItem, isSelected && styles.weekDayItemSelected]}
        onPress={() => handleWeekDayPress(dateString)}
      >
        <Typography
          variant="caption"
          color={isToday ? Colors.primary : dayOfWeekColor}
          style={isToday ? { fontWeight: 'bold' } : undefined}
        >
          {dayOfWeek}
        </Typography>
        <View
          style={[
            styles.weekDayNumber,
            // 항상 borderWidth를 유지하여 Android compositing 버그 방지
            {
              backgroundColor: isSelected ? Colors.secondary : Colors.background,
              borderWidth: 2,
              borderColor: isSelected
                ? Colors.secondary
                : status === 'COMPLETE'
                  ? STATUS_COLORS.COMPLETE
                  : status !== 'NONE'
                    ? statusColor
                    : 'transparent',
            },
          ]}
        >
          <Typography
            variant="body"
            color={isSelected ? Colors.white : isToday ? Colors.primary : dayOfWeekColor}
            style={(isToday || isSelected) ? { fontWeight: 'bold' } : undefined}
          >
            {dayNum}
          </Typography>
        </View>
      </TouchableOpacity>
    );
  };

  const getDateDisplay = () => {
    const dateObj = new Date(selectedDate);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    return `${selectedDate.replace(/-/g, '.')} (${dayOfWeek})`;
  };

  // 주간 달력 초기 스크롤
  useEffect(() => {
    const todayIndex = weekDates.findIndex((d) => d === today);
    if (todayIndex !== -1 && weekListRef.current) {
      setTimeout(() => {
        weekListRef.current?.scrollToIndex({
          index: todayIndex,
          animated: false,
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, []);

  return (
    <View style={styles.linkedFamilyContainer}>
      {/* 가족 정보 헤더 */}
      <View style={styles.familyHeader}>
        {family.profileImage ? (
          <Image source={{ uri: family.profileImage }} style={styles.familyAvatar} />
        ) : (
          <View style={[styles.familyAvatar, styles.familyAvatarPlaceholder]}>
            <Image
              source={require('../../assets/icons_iamge_processed/05_User.png')}
              style={styles.familyAvatarIcon}
              accessibilityLabel="User placeholder"
              resizeMode="contain"
            />
          </View>
        )}
        <Typography variant="h3">{family.name}님의 복약 현황</Typography>
      </View>

      {/* 날짜 헤더 */}
      <View style={styles.dateHeader}>
        <Typography variant="h3">{getDateDisplay()}</Typography>
        <TouchableOpacity
          style={styles.calendarIconButton}
          onPress={() => setShowCalendarModal(true)}
        >
          <Image
            source={require('../../assets/icons_iamge_processed/Calender.png')}
            style={styles.calendarIcon}
            accessibilityLabel="Calendar icon"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* 주간 달력 */}
      <View style={styles.weekStrip}>
        <FlatList
          ref={weekListRef}
          data={weekDates}
          extraData={`${selectedDate}_${(monthlySummary || []).length}`}
          renderItem={renderWeekDayItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: DAY_ITEM_WIDTH,
            offset: DAY_ITEM_WIDTH * index,
            index,
          })}
          onScrollToIndexFailed={() => {}}
        />
        <View style={styles.weekStripDivider} />
      </View>

      {/* 복약 목록 */}
      {isLoading ? (
        <Card style={styles.emptyCard} variant="elevated">
          <Typography variant="body">불러오는 중...</Typography>
        </Card>
      ) : schedules.length === 0 ? (
        <Card style={styles.emptyCard} variant="elevated">
          <Typography variant="body">
            이 날짜에 복약 기록이 없어요
          </Typography>
        </Card>
      ) : (
        schedules.map((schedule) => (
          <Card key={schedule.timing} style={styles.scheduleCard} variant="elevated">
            <View style={styles.timePeriodHeader}>
              <View style={styles.timingHeaderLeft}>
                <Image
                  source={getTimingIcon(schedule.timing)}
                  style={styles.timingIcon}
                  accessibilityLabel={`${schedule.timingLabel} timing icon`}
                  resizeMode="contain"
                />
                <Typography variant="h3">{schedule.timingLabel}</Typography>
              </View>
              {schedule.allTaken && (
                <View style={styles.completedBadgeSmall}>
                  <Typography variant="caption" color={Colors.primary}>완료</Typography>
                </View>
              )}
            </View>
            <View style={styles.medicationList}>
              {schedule.medications.map((med) => (
                <View key={med.id} style={styles.medicationItemCompact}>
                  <View style={styles.medicationRowCompact}>
                    <Typography variant="caption" style={styles.medTimeLabel}>
                      {med.reminderTime || schedule.scheduledTime}
                    </Typography>
                    <View style={styles.medThumbnailContainerSmall}>
                      {med.imageUrl ? (
                        <Image source={{ uri: med.imageUrl }} style={styles.medThumbnailSmall} resizeMode="cover" />
                      ) : (
                        <View style={[styles.medThumbnailSmall, styles.medThumbnailPlaceholder]}>
                          <Image
                            source={med.isSupplement
                              ? require('../../assets/icons_iamge_processed/47_Leaf.png')
                              : require('../../assets/icons_iamge_processed/02_Pill.png')
                            }
                            style={styles.placeholderIcon}
                            accessibilityLabel={med.isSupplement ? 'Supplement placeholder' : 'Medication placeholder'}
                            resizeMode="contain"
                          />
                        </View>
                      )}
                      {med.taken && (
                        <View style={styles.takenOverlaySmall}>
                          <Image
                            source={require('../../assets/icons_iamge_processed/31_Checkmark.png')}
                            style={styles.checkmarkIcon}
                            accessibilityLabel="Taken checkmark"
                            resizeMode="contain"
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.medicationInfoCompact}>
                      <Typography
                        variant="body"
                        style={med.taken ? [styles.medicationNameCompact, styles.medicationNameTaken] : styles.medicationNameCompact}
                        numberOfLines={1}
                      >
                        {getMedDisplayName(med)}
                      </Typography>
                    </View>
                    {med.taken ? (
                      <View style={styles.takenBadge}>
                        <Typography variant="caption" color={Colors.primary}>복용 완료</Typography>
                      </View>
                    ) : (
                      <View style={styles.missedBadge}>
                        <Typography variant="caption" color="#F44336">미복용</Typography>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ))
      )}

      {/* 달력 모달 */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendarModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Card style={styles.calendarModalCard} variant="elevated">
              <View style={styles.modalHeader}>
                <Typography variant="h3">달력</Typography>
                <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                  <Typography variant="h3">X</Typography>
                </TouchableOpacity>
              </View>
              <View style={styles.calendarListContainer}>
                <CalendarList
                  current={`${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-01`}
                  onDayPress={(day) => {
                    setSelectedDate(day.dateString);
                    setShowCalendarModal(false);
                  }}
                  onVisibleMonthsChange={(months) => {
                    if (months.length > 0) {
                      const visibleMonth = months[0];
                      if (visibleMonth.year !== currentMonth.year || visibleMonth.month !== currentMonth.month) {
                        setCurrentMonth({ year: visibleMonth.year, month: visibleMonth.month });
                        onMonthChange(visibleMonth.year, visibleMonth.month);
                      }
                    }
                  }}
                  horizontal={true}
                  pagingEnabled={true}
                  pastScrollRange={12}
                  futureScrollRange={12}
                  showScrollIndicator={false}
                  calendarWidth={SCREEN_WIDTH - 40 - 32}
                  staticHeader={true}
                  markingType="custom"
                  markedDates={markedDates as any}
                  theme={{
                    backgroundColor: Colors.white,
                    calendarBackground: Colors.white,
                    textSectionTitleColor: Colors.textSecondary,
                    selectedDayBackgroundColor: Colors.primary,
                    selectedDayTextColor: Colors.white,
                    todayTextColor: Colors.primary,
                    dayTextColor: Colors.textPrimary,
                    textDisabledColor: Colors.textSecondary,
                    arrowColor: Colors.primary,
                    monthTextColor: Colors.textPrimary,
                    textMonthFontWeight: 'bold',
                    textDayFontSize: 14,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 12,
                  }}
                />
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.COMPLETE }]} />
                  <Typography variant="caption">완료</Typography>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { borderWidth: 2, borderColor: STATUS_COLORS.PARTIAL }]} />
                  <Typography variant="caption">일부</Typography>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { borderWidth: 2, borderColor: STATUS_COLORS.MISSED }]} />
                  <Typography variant="caption">미복용</Typography>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function FamilyScreen() {
  const { contentStyle } = useResponsive();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const {
    linkStatus,
    isLoadingStatus,
    selectedFamilySchedule,
    isLoadingSchedule,
    fetchLinkStatus,
    sendLinkRequest,
    cancelRequest,
    acceptRequest,
    rejectRequest,
    fetchFamilyTodaySchedule,
    fetchFamilyScheduleForDate,
    fetchFamilyMonthlySummary,
    error,
  } = useFamilyStore();

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [familySchedules, setFamilySchedules] = useState<TodaySchedule[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<DaySummary[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  // 데이터 로드
  useFocusEffect(
    useCallback(() => {
      fetchLinkStatus();
    }, [])
  );

  // 연동된 가족이 있을 때 스케줄 로드
  const linkedFamily = linkStatus?.linkedFamilies?.[0];

  useEffect(() => {
    if (linkedFamily) {
      loadFamilyData(linkedFamily.userId, selectedDate);
    }
  }, [linkedFamily, selectedDate]);

  const loadFamilyData = async (userId: number, date: string) => {
    setIsLoadingLocal(true);
    try {
      const year = new Date(date).getFullYear();
      const month = new Date(date).getMonth() + 1;

      // 주간 달력이 ±21일을 커버하므로 해당 범위의 모든 월을 로드
      const monthsToLoad = new Set<string>();

      // 선택 월 ±1
      const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
      const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
      monthsToLoad.add(`${prevMonth.year}-${prevMonth.month}`);
      monthsToLoad.add(`${year}-${month}`);
      monthsToLoad.add(`${nextMonth.year}-${nextMonth.month}`);

      // 주간 달력 전체 범위도 커버 (오늘 ±21일)
      const todayDate = new Date();
      const startDate = addDays(todayDate, -21);
      const endDate = addDays(todayDate, 21);
      monthsToLoad.add(`${startDate.getFullYear()}-${startDate.getMonth() + 1}`);
      monthsToLoad.add(`${endDate.getFullYear()}-${endDate.getMonth() + 1}`);

      const monthEntries = Array.from(monthsToLoad).map(key => {
        const [y, m] = key.split('-').map(Number);
        return { year: y, month: m };
      });

      const [schedules, ...summaryResults] = await Promise.all([
        fetchFamilyScheduleForDate(userId, date),
        ...monthEntries.map(({ year: y, month: m }) => fetchFamilyMonthlySummary(userId, y, m)),
      ]);

      setFamilySchedules(schedules || []);
      const allDays = summaryResults.flatMap(r => r?.days || []);
      // 중복 제거하며 기존 데이터와 병합
      setMonthlySummary(prev => {
        const merged = new Map(prev.map(d => [d.date, d]));
        allDays.forEach(d => merged.set(d.date, d));
        return Array.from(merged.values());
      });
    } catch (error) {
      console.error('Failed to load family data:', error);
      setFamilySchedules([]);
      setMonthlySummary([]);
    } finally {
      setIsLoadingLocal(false);
    }
  };

  const handleRefresh = async () => {
    await fetchLinkStatus();
    if (linkedFamily) {
      await loadFamilyData(linkedFamily.userId, selectedDate);
    }
  };

  // 달력 모달에서 월이 변경될 때 해당 월의 summary 로드
  const handleMonthChange = async (year: number, month: number) => {
    if (!linkedFamily) return;
    try {
      const summary = await fetchFamilyMonthlySummary(linkedFamily.userId, year, month);
      setMonthlySummary(summary?.days || []);
    } catch (error) {
      console.error('Failed to load monthly summary:', error);
    }
  };

  const handleConnectPress = () => {
    // 전화번호 등록 여부 확인
    if (!user?.phone) {
      Alert.alert(
        '전화번호 등록 필요',
        '가족 연동을 위해 먼저 전화번호를 등록해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '등록하기', onPress: () => router.push('/profile/edit') },
        ]
      );
      return;
    }
    router.push('/family/request');
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptRequest(requestId);
      Alert.alert('완료', '연동 요청을 수락했습니다.');
    } catch (error) {
      Alert.alert('오류', '요청 수락에 실패했습니다.');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    Alert.alert(
      '요청 거절',
      '정말 이 요청을 거절하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거절',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectRequest(requestId);
            } catch (error) {
              Alert.alert('오류', '요청 거절에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = async (requestId: number) => {
    Alert.alert(
      '요청 취소',
      '보낸 요청을 취소하시겠어요?',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRequest(requestId);
            } catch (error) {
              Alert.alert('오류', '요청 취소에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 상태별 렌더링
  const hasLinkedFamilies = linkStatus && linkStatus.linkedFamilies.length > 0;
  const hasReceivedRequests = linkStatus && linkStatus.receivedRequests.length > 0;
  const hasSentRequests = linkStatus && linkStatus.sentRequests.length > 0;
  const hasGuardians = linkStatus && linkStatus.guardians.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* 헤더 */}
      <TabHeader title="가족연동" subtitle="가족의 복약 현황을 함께 관리해요" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, contentStyle, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingStatus || isLoadingLocal}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* 보호자 배너 */}
        {hasGuardians && <GuardianBanner guardians={linkStatus.guardians} />}

        {/* 받은 요청 */}
        {hasReceivedRequests && (
          <ReceivedRequestsView
            requests={linkStatus.receivedRequests}
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
            isLoading={isLoadingStatus}
          />
        )}

        {/* 보낸 요청 (대기 중) */}
        {hasSentRequests && (
          <PendingRequestView
            requests={linkStatus.sentRequests}
            onCancel={handleCancelRequest}
            isLoading={isLoadingStatus}
          />
        )}

        {/* 연동된 가족이 있을 때 */}
        {hasLinkedFamilies && linkedFamily && (
          <LinkedFamilyView
            family={linkedFamily}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            schedules={familySchedules}
            monthlySummary={monthlySummary}
            isLoading={isLoadingLocal || isLoadingSchedule}
            onRefresh={handleRefresh}
            onMonthChange={handleMonthChange}
          />
        )}

        {/* 아무 연동도 없고 요청도 없을 때 */}
        {!hasLinkedFamilies && !hasReceivedRequests && !hasSentRequests && (
          <EmptyFamilyView onConnectPress={handleConnectPress} />
        )}

        {/* 연동된 가족이 없지만 요청이 있을 때 연결 버튼 */}
        {!hasLinkedFamilies && (hasReceivedRequests || hasSentRequests) && (
          <Button
            title="+ 가족 연결하기"
            variant="secondary"
            size="large"
            onPress={handleConnectPress}
            style={styles.addFamilyButton}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  connectButton: {
    minWidth: 200,
  },
  // Request cards
  requestCard: {
    marginBottom: 16,
  },
  requestTitle: {
    marginBottom: 16,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pendingRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  requestAvatarPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestAvatarIcon: {
    width: 24,
    height: 24,
  },
  requestTextInfo: {
    flex: 1,
  },
  requestName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  rejectButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Guardian banner
  guardianBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLightest,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  guardianIcon: {
    width: 20,
    height: 20,
  },
  guardianText: {
    flex: 1,
    color: Colors.primary,
  },
  // Linked family view
  linkedFamilyContainer: {
    flex: 1,
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  familyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  familyAvatarPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  familyAvatarIcon: {
    width: 28,
    height: 28,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarIconButton: {
    padding: 4,
  },
  calendarIcon: {
    width: 24,
    height: 24,
  },
  weekStrip: {
    marginBottom: 16,
    paddingVertical: 4,
  },
  weekStripDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginTop: 8,
  },
  weekDayItem: {
    width: DAY_ITEM_WIDTH,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayItemSelected: {},
  weekDayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  // Cards
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  scheduleCard: {
    marginBottom: 16,
  },
  timePeriodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: -16,
    marginTop: -16,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  timingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timingIcon: {
    width: 24,
    height: 24,
  },
  completedBadgeSmall: {
    backgroundColor: Colors.primaryLightest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  medicationList: {
    marginBottom: 8,
  },
  medicationItemCompact: {
    paddingVertical: 8,
  },
  medicationRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  medTimeLabel: {
    color: Colors.secondary,
    fontWeight: '500',
    fontSize: 12,
    minWidth: 40,
  },
  medThumbnailContainerSmall: {
    position: 'relative',
  },
  medThumbnailSmall: {
    width: 36,
    height: 28,
    borderRadius: 4,
  },
  medThumbnailPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    width: 20,
    height: 20,
  },
  takenOverlaySmall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIcon: {
    width: 16,
    height: 16,
  },
  medicationInfoCompact: {
    flex: 1,
  },
  medicationNameCompact: {
    fontWeight: '500',
    fontSize: 15,
  },
  medicationNameTaken: {
    color: Colors.textSecondary,
  },
  takenBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.primaryLightest,
    borderRadius: 12,
  },
  missedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalCard: {
    width: SCREEN_WIDTH - 40,
    padding: 16,
  },
  calendarListContainer: {
    width: SCREEN_WIDTH - 40 - 32,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  addFamilyButton: {
    marginTop: 16,
  },
});
