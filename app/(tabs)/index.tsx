import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, FlatList, Dimensions, Image, Alert, TextStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { CalendarList, LocaleConfig } from 'react-native-calendars';
import { Button, Card, Typography, MedicationActionButtons, SnoozeModal, DrugTypeBadge, SupplementTagBadge } from '../../components/ui';
import { Colors } from '../../constants';
import { useResponsive } from '../../hooks';
import { useMedicationStore } from '../../stores';
import { intakeService, reminderService } from '../../services';
import { MedicationTiming, TodaySchedule, DaySummary, DayStatus, ScheduleMedication, IntakesResponse, TimePeriodGroup, TimeSlot } from '../../types';
import { getMedDisplayName } from '../../utils';
import { getTodayString, formatDateToLocal, addDays } from '../../utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_ITEM_WIDTH = (SCREEN_WIDTH - 40) / 7; // 양쪽 padding 20씩 빼고 7등분

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
  COMPLETE: '#4CAF50',   // 초록색 - 모든 약 복용
  PARTIAL: '#FF9800',    // 주황색 - 일부 복용
  MISSED: '#F44336',     // 빨간색 - 미복용
  PENDING: '#2196F3',    // 파란색 - 오늘/미래
  NONE: 'transparent',   // 예정된 약 없음
};

// 요일별 색상
const DAY_OF_WEEK_COLORS = {
  SUNDAY: '#F44336',     // 일요일 - 빨간색
  SATURDAY: '#2196F3',   // 토요일 - 파란색
  WEEKDAY: Colors.textSecondary,  // 평일 - 기본 회색
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

// 주간 날짜 데이터 생성 (오늘 기준 전후 21일씩, 총 43일)
const generateWeekDates = () => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = -21; i <= 21; i++) {
    dates.push(formatDateToLocal(addDays(today, i)));
  }
  return dates;
};

export default function HomeScreen() {
  const { contentStyle } = useResponsive();
  const insets = useSafeAreaInsets();
  const { todayData, fetchTodaySchedule, recordIntake, isLoading, fetchScheduleForDate, isLoadingSchedule: storeIsLoadingSchedule, fetchMonthlySummary } = useMedicationStore();
  const [selectedDate, setSelectedDate] = useState(getTodayString()); // 로컬 타임존 기준 오늘 날짜
  const [currentMonth, setCurrentMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [monthlySummary, setMonthlySummary] = useState<DaySummary[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [weekDates] = useState(generateWeekDates());
  const weekListRef = useRef<FlatList>(null);

  // 스누즈 모달 상태
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [selectedMedForSnooze, setSelectedMedForSnooze] = useState<ScheduleMedication | null>(null);
  const [selectedTiming, setSelectedTiming] = useState<MedicationTiming | null>(null);

  // 중복 클릭 방지용 처리 중인 약물 ID 추적
  const [processingMeds, setProcessingMeds] = useState<Set<number>>(new Set());

  // 선택된 날짜의 스케줄 데이터
  const [selectedDateSchedules, setSelectedDateSchedules] = useState<TodaySchedule[]>([]);

  const today = getTodayString(); // 로컬 타임존 기준 오늘 날짜
  const isSelectedDatePastOrToday = selectedDate <= today;

  // 오늘 날짜로 주간 달력 스크롤
  const scrollToToday = useCallback(() => {
    const todayIndex = weekDates.findIndex((d) => d === today);
    if (todayIndex !== -1 && weekListRef.current) {
      weekListRef.current.scrollToIndex({
        index: todayIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [weekDates, today]);

  // 선택된 날짜의 스케줄 가져오기 (오늘이면 todayData 재사용, 아니면 캐시/API)
  const loadScheduleForDate = useCallback(async (date: string) => {
    // 오늘 날짜이고 todayData가 있으면 재사용 (중복 호출 방지)
    if (date === today && todayData?.schedules) {
      setSelectedDateSchedules(todayData.schedules);
      return;
    }
    const schedules = await fetchScheduleForDate(date);
    setSelectedDateSchedules(schedules);
  }, [today, todayData, fetchScheduleForDate]);

  useFocusEffect(
    useCallback(() => {
      fetchTodaySchedule();
      loadScheduleForDate(selectedDate);
      loadMonthlySummary(currentMonth.year, currentMonth.month);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 포커스 복귀 시 항상 최신 데이터 로드
    }, [])
  );

  // 선택된 날짜가 변경되면 스케줄 로드
  useEffect(() => {
    loadScheduleForDate(selectedDate);
  }, [selectedDate, loadScheduleForDate]);

  // 복용 기록 후 todayData 변경 시 월별 요약 갱신 (주간 달력 상태 반영)
  useEffect(() => {
    if (todayData) {
      loadMonthlySummary(currentMonth.year, currentMonth.month);
    }
  }, [todayData]);

  const loadMonthlySummary = async (year: number, month: number) => {
    try {
      // store의 캐싱 함수 사용
      const data = await fetchMonthlySummary(year, month);
      setMonthlySummary(data.days);
      updateMarkedDates(data.days);
    } catch (error) {
      console.error('Failed to load monthly summary:', error);
    }
  };

  const updateMarkedDates = (days: DaySummary[]) => {
    const marked: MarkedDates = {};

    days.forEach((day) => {
      const isToday = day.date === today;
      const isSelected = day.date === selectedDate;
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

    // 선택된 날짜 강조
    if (marked[selectedDate]) {
      marked[selectedDate].customStyles.container = {
        ...marked[selectedDate].customStyles.container,
        borderWidth: 2,
        borderColor: Colors.primary,
      };
    }

    setMarkedDates(marked);
  };

  useEffect(() => {
    if (monthlySummary.length > 0) {
      updateMarkedDates(monthlySummary);
    }
  }, [selectedDate]);

  // 주간 달력 초기 스크롤 위치 설정 (오늘 날짜가 중앙에 오도록)
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

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setShowCalendarModal(false);
  };

  const handleWeekDayPress = (dateString: string) => {
    setSelectedDate(dateString);
    const index = weekDates.findIndex((d) => d === dateString);
    if (index !== -1 && weekListRef.current) {
      weekListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  const handleMonthChange = (month: { year: number; month: number }) => {
    setCurrentMonth({ year: month.year, month: month.month });
  };


  // 날짜 상태 가져오기
  const getDayStatus = (dateString: string): DayStatus => {
    const daySummary = monthlySummary.find((d) => d.date === dateString);
    if (daySummary) {
      return daySummary.status as DayStatus;
    }
    // 기본 상태: 오늘이면 PENDING, 미래면 PENDING, 과거면 NONE
    const dateObj = new Date(dateString);
    const todayObj = new Date(today);
    if (dateString === today) return 'PENDING';
    if (dateObj > todayObj) return 'PENDING';
    return 'NONE';
  };

  // 요일별 색상 가져오기
  const getDayOfWeekColor = (dayIndex: number): string => {
    if (dayIndex === 0) return DAY_OF_WEEK_COLORS.SUNDAY;
    if (dayIndex === 6) return DAY_OF_WEEK_COLORS.SATURDAY;
    return DAY_OF_WEEK_COLORS.WEEKDAY;
  };

  // 주간 달력 아이템 렌더링
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
        style={[
          styles.weekDayItem,
          isSelected && styles.weekDayItemSelected,
        ]}
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
            isSelected && { backgroundColor: Colors.primary },
            status === 'COMPLETE' && !isSelected && { backgroundColor: STATUS_COLORS.COMPLETE },
            !isSelected && status !== 'COMPLETE' && status !== 'NONE' && {
              borderWidth: 2,
              borderColor: statusColor,
            },
          ]}
        >
          <Typography
            variant="body"
            color={isSelected || status === 'COMPLETE' ? Colors.white : isToday ? Colors.primary : dayOfWeekColor}
            style={isToday ? { fontWeight: 'bold' } : undefined}
          >
            {dayNum}
          </Typography>
        </View>
      </TouchableOpacity>
    );
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

  // 시간대 정보 매핑
  const TIMING_INFO: Record<MedicationTiming, { label: string }> = {
    MORNING: { label: '아침' },
    AFTERNOON: { label: '점심' },
    EVENING: { label: '저녁' },
    AS_NEEDED: { label: '필요시' },
  };

  // 알림 시간으로부터 6시간이 경과했는지 확인
  const isElapsedOver6Hours = (scheduledTime: string, selectedDate: string): boolean => {
    const now = new Date();
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    // 경과 시간 (밀리초)
    const elapsedMs = now.getTime() - scheduledDateTime.getTime();
    const sixHoursMs = 6 * 60 * 60 * 1000;

    return elapsedMs >= sixHoursMs;
  };

  // 약물 복용 상태 결정
  type MedStatus = 'pending' | 'taken' | 'missed' | 'future';
  const getMedStatus = (med: ScheduleMedication, slotTime: string): MedStatus => {
    if (med.taken) return 'taken';
    // 미래 날짜이면 복용 버튼 비활성화
    if (selectedDate > today) return 'future';
    if (isElapsedOver6Hours(slotTime, selectedDate)) return 'missed';
    return 'pending';
  };

  // TodaySchedule[] -> TimePeriodGroup[] 변환 함수
  const transformToTimePeriodGroups = (schedules: TodaySchedule[]): TimePeriodGroup[] => {
    // timing별로 그룹핑 (서버에서 올바른 timing을 보내줌)
    const groupMap = new Map<MedicationTiming, TodaySchedule[]>();

    schedules.forEach((schedule) => {
      const existing = groupMap.get(schedule.timing);
      if (existing) {
        existing.push(schedule);
      } else {
        groupMap.set(schedule.timing, [schedule]);
      }
    });

    // 시간대 순서 정의
    const timingOrder: MedicationTiming[] = ['MORNING', 'AFTERNOON', 'EVENING', 'AS_NEEDED'];

    return timingOrder
      .filter((timing) => groupMap.has(timing))
      .map((timing) => {
        const scheduleList = groupMap.get(timing)!;
        const info = TIMING_INFO[timing];

        // 같은 timing 내에서 scheduledTime별로 TimeSlot 생성
        const timeSlotMap = new Map<string, ScheduleMedication[]>();
        scheduleList.forEach((schedule) => {
          const time = schedule.scheduledTime;
          const existing = timeSlotMap.get(time);
          if (existing) {
            existing.push(...schedule.medications);
          } else {
            timeSlotMap.set(time, [...schedule.medications]);
          }
        });

        // TimeSlot 배열 생성 (시간순 정렬)
        const timeSlots: TimeSlot[] = Array.from(timeSlotMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([time, medications]) => ({
            time,
            medications,
            allTaken: medications.every((m) => m.taken),
          }));

        return {
          timing,
          timingLabel: info.label,
          timingIcon: getTimingIcon(timing),
          timeSlots,
          allTaken: timeSlots.every((slot) => slot.allTaken),
        };
      });
  };

  const handleTakeAll = async (schedule: TodaySchedule) => {
    const notTakenMeds = schedule.medications.filter((m) => !m.taken);
    if (notTakenMeds.length === 0) return;

    try {
      await recordIntake(
        notTakenMeds.map((m) => m.id),
        schedule.timing,
        selectedDate
      );
    } catch (error) {
      console.error('Failed to record intake:', error);
      Alert.alert('오류', '복용 기록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 시간 슬롯 전체 복용 처리
  const handleTakeAllInSlot = async (timeSlot: TimeSlot, timing: MedicationTiming) => {
    const notTakenMeds = timeSlot.medications.filter((m) => !m.taken);
    if (notTakenMeds.length === 0) return;

    try {
      await recordIntake(
        notTakenMeds.map((m) => m.id),
        timing,
        selectedDate
      );
    } catch (error) {
      console.error('Failed to record intake:', error);
      Alert.alert('오류', '복용 기록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 개별 약물 복용 처리
  const handleTakeMedication = async (med: ScheduleMedication, timing: MedicationTiming) => {
    if (med.taken || processingMeds.has(med.id)) return;

    setProcessingMeds(prev => new Set(prev).add(med.id));
    try {
      await recordIntake([med.id], timing, selectedDate);
    } catch (error) {
      console.error('Failed to record intake:', error);
      Alert.alert('오류', '복용 기록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessingMeds(prev => {
        const next = new Set(prev);
        next.delete(med.id);
        return next;
      });
    }
  };

  // 건너뛰기 (스누즈 모달 열기)
  const handleSkipMedication = (med: ScheduleMedication, timing: MedicationTiming) => {
    setSelectedMedForSnooze(med);
    setSelectedTiming(timing);
    setShowSnoozeModal(true);
  };

  // 스누즈 선택 처리
  const handleSnoozeSelect = async (minutes: number) => {
    if (!selectedMedForSnooze?.reminderId) return;
    try {
      await reminderService.snoozeReminder(selectedMedForSnooze.reminderId, minutes);
      setShowSnoozeModal(false);
      setSelectedMedForSnooze(null);
      setSelectedTiming(null);
      fetchTodaySchedule();
    } catch (error) {
      console.error('Failed to snooze:', error);
      Alert.alert('오류', '알림 미루기에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 누락 처리
  const handleMissMedication = async (med: ScheduleMedication, timing: MedicationTiming) => {
    if (med.taken || processingMeds.has(med.id)) return;

    setProcessingMeds(prev => new Set(prev).add(med.id));
    try {
      await intakeService.recordMissed(med.id, timing);
      fetchTodaySchedule();
    } catch (error) {
      console.error('Failed to record missed:', error);
      Alert.alert('오류', '누락 기록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessingMeds(prev => {
        const next = new Set(prev);
        next.delete(med.id);
        return next;
      });
    }
  };

  // 선택된 날짜 표시
  const getDateDisplay = () => {
    const dateObj = new Date(selectedDate);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    return `${selectedDate.replace(/-/g, '.')} (${dayOfWeek})`;
  };

  const dateDisplay = getDateDisplay();

  // 선택된 날짜가 오늘인지 확인
  const isSelectedDateToday = selectedDate === today;

  // 표시할 스케줄 (선택된 날짜 기준)
  const schedules = selectedDateSchedules;
  const summary = isSelectedDateToday ? todayData?.summary : null;

  // TimePeriodGroup으로 변환 (useMemo로 성능 최적화)
  const timePeriodGroups = useMemo(() => transformToTimePeriodGroups(schedules), [schedules]);

  // 선택된 날짜의 요약 정보
  const selectedDaySummary = monthlySummary.find((d) => d.date === selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, contentStyle, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              fetchTodaySchedule();
              loadMonthlySummary(currentMonth.year, currentMonth.month);
            }}
            colors={[Colors.primary]}
          />
        }
      >
        {/* 헤더 - 날짜, 복용 현황, 달력 아이콘 */}
        <View style={styles.header}>
          <Typography variant="h3">{dateDisplay}</Typography>
          <View style={styles.headerRight}>
            {summary && (
              <View style={styles.completionBadge}>
                <Typography variant="bodySmall" color={Colors.primary} style={{ fontWeight: '600' }}>
                  {summary.takenCount}/{summary.totalMedications} 복용완료
                </Typography>
              </View>
            )}
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
        </View>

        {/* 주간 달력 스트립 */}
        <View style={styles.weekStrip}>
          <FlatList
            ref={weekListRef}
            data={weekDates}
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
                    <Typography variant="h3">✕</Typography>
                  </TouchableOpacity>
                </View>
                <View style={styles.calendarListContainer}>
                  <CalendarList
                    current={`${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-01`}
                    onDayPress={handleDayPress}
                    onVisibleMonthsChange={(months) => {
                      if (months.length > 0) {
                        const visibleMonth = months[0];
                        setCurrentMonth({ year: visibleMonth.year, month: visibleMonth.month });
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
                  dayComponent={({ date, state }) => {
                    if (!date) return null;
                    const dateObj = new Date(date.dateString);
                    const dayIndex = dateObj.getDay();
                    const dayColor = getDayOfWeekColor(dayIndex);
                    const isToday = date.dateString === today;
                    const isSelected = date.dateString === selectedDate;
                    const daySummary = monthlySummary.find((d) => d.date === date.dateString);
                    const status = daySummary?.status as DayStatus || 'NONE';
                    const statusColor = STATUS_COLORS[status] || 'transparent';
                    const isDisabled = state === 'disabled';

                    return (
                      <TouchableOpacity
                        style={[
                          styles.calendarDayContainer,
                          status === 'COMPLETE' && { backgroundColor: statusColor },
                          status !== 'COMPLETE' && status !== 'NONE' && { borderWidth: 2, borderColor: statusColor },
                          isSelected && { borderWidth: 2, borderColor: Colors.primary },
                        ]}
                        onPress={() => handleDayPress({ dateString: date.dateString })}
                        disabled={isDisabled}
                      >
                        <Typography
                          variant="body"
                          color={
                            isDisabled
                              ? Colors.textSecondary
                              : status === 'COMPLETE'
                              ? Colors.white
                              : isToday
                              ? Colors.primary
                              : dayColor
                          }
                          style={isToday ? { fontWeight: 'bold' } : undefined}
                        >
                          {date.day}
                        </Typography>
                      </TouchableOpacity>
                    );
                  }}
                  />
                </View>

                {/* 범례 */}
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
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { borderWidth: 2, borderColor: STATUS_COLORS.PENDING }]} />
                    <Typography variant="caption">예정</Typography>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* 컨디션 기록 카드 */}
        {isSelectedDatePastOrToday && (
          <TouchableOpacity
            style={styles.conditionCard}
            onPress={() => router.push(`/health-note/${selectedDate}`)}
          >
            <View style={styles.conditionCardContent}>
              <Image
                source={require('../../assets/icons_iamge_processed/03_Clipboard.png')}
                style={styles.conditionCardIcon}
                accessibilityLabel="Condition record icon"
                resizeMode="contain"
              />
              <View style={styles.conditionCardText}>
                <Typography variant="body" style={styles.conditionCardTitle}>
                  {isSelectedDateToday ? '오늘의 컨디션 기록' : '이 날의 컨디션 기록'}
                </Typography>
                <Typography variant="caption" color={Colors.textSecondary}>
                  몸 상태와 메모를 남겨보세요
                </Typography>
              </View>
              <Typography variant="body" color={Colors.textTertiary}>
                &gt;
              </Typography>
            </View>
          </TouchableOpacity>
        )}

        {/* 복약 스케줄 */}
        {storeIsLoadingSchedule ? (
          <Card style={styles.emptyCard} variant="elevated">
            <Typography variant="body" style={styles.emptyText}>
              불러오는 중...
            </Typography>
          </Card>
        ) : timePeriodGroups.length === 0 ? (
          <Card style={styles.emptyCard} variant="elevated">
            <Typography variant="body" style={styles.emptyText}>
              {isSelectedDateToday ? '오늘 먹을 약이 없어요' : '이 날짜에 복약 기록이 없어요'}
            </Typography>
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.emptySubtext}>
              {isSelectedDateToday ? '약을 추가하면 여기에 표시됩니다' : ''}
            </Typography>
          </Card>
        ) : (
          timePeriodGroups.map((group) => (
            <Card key={group.timing} style={styles.scheduleCard} variant="elevated">
              {/* 시간대 헤더 */}
              <View style={styles.timePeriodHeader}>
                <View style={styles.timingHeaderLeft}>
                  <Image
                    source={group.timingIcon}
                    style={styles.timingIcon}
                    accessibilityLabel={`${group.timingLabel} timing icon`}
                    resizeMode="contain"
                  />
                  <Typography variant="h3">
                    {group.timingLabel}
                  </Typography>
                </View>
                <View style={styles.timePeriodHeaderActions}>
                  {/* 모두 복용 버튼 */}
                  {!group.allTaken && group.timeSlots.some(slot => slot.medications.filter(m => !m.taken).length > 0) && (
                    <TouchableOpacity
                      style={styles.takeAllGroupButton}
                      onPress={() => {
                        // 시간대 전체 미복용 약물 수집
                        const allNotTakenMeds = group.timeSlots.flatMap(slot =>
                          slot.medications.filter(m => !m.taken).map(m => m.id)
                        );
                        if (allNotTakenMeds.length > 0) {
                          recordIntake(allNotTakenMeds, group.timing, selectedDate);
                        }
                      }}
                    >
                      <Typography variant="caption" color={Colors.primary}>모두 복용</Typography>
                    </TouchableOpacity>
                  )}
                  {/* 완료 배지 */}
                  {group.allTaken && (
                    <View style={styles.completedBadgeSmall}>
                      <Typography variant="caption" color={Colors.primary}>완료</Typography>
                    </View>
                  )}
                </View>
              </View>

              {/* 약물 목록 (시간순 정렬) */}
              <View style={styles.medicationList}>
                {group.timeSlots
                  .flatMap((slot) => slot.medications.map((med) => ({ med, slotTime: slot.time })))
                  .sort((a, b) => {
                    const timeA = a.med.reminderTime || a.slotTime;
                    const timeB = b.med.reminderTime || b.slotTime;
                    return timeA.localeCompare(timeB);
                  })
                  .map(({ med, slotTime }) => {
                    const status = getMedStatus(med, slotTime);
                    return (
                      <View key={med.id} style={styles.medicationItemCompact}>
                        <View style={styles.medicationRowCompact}>
                          {/* 알림 시간 */}
                          <Typography variant="caption" style={styles.medTimeLabel}>
                            {med.reminderTime || slotTime}
                          </Typography>

                          {/* 약물 이미지 썸네일 */}
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

                          {/* 약물 정보 */}
                          <View style={styles.medicationInfoCompact}>
                            <Typography
                              variant="body"
                              style={med.taken ? StyleSheet.flatten([styles.medicationNameCompact, styles.medicationNameTaken]) : styles.medicationNameCompact}
                              numberOfLines={1}
                            >
                              {getMedDisplayName(med)}
                            </Typography>
                          </View>

                          {/* 복용 상태 표시 */}
                          {status === 'pending' ? (
                            <TouchableOpacity
                              style={styles.takeButtonCompact}
                              onPress={() => handleTakeMedication(med, group.timing)}
                              disabled={processingMeds.has(med.id)}
                            >
                              <Typography variant="caption" color={Colors.white}>지금 복용</Typography>
                            </TouchableOpacity>
                          ) : status === 'taken' ? (
                            <View style={styles.takenBadge}>
                              <Typography variant="caption" color={Colors.primary}>복용 완료</Typography>
                            </View>
                          ) : status === 'future' ? (
                            <View style={styles.futureBadge}>
                              <Typography variant="caption" color={Colors.textTertiary}>예정</Typography>
                            </View>
                          ) : (
                            <View style={styles.missedBadge}>
                              <Typography variant="caption" color="#F44336">누락</Typography>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })
                }
              </View>

              {/* 시간대 전체 완료 표시 */}
              {group.allTaken && (
                <View style={styles.allCompletedBadge}>
                  <Typography variant="body" color={Colors.primary}>
                    ✓ 모두 복용 완료
                  </Typography>
                </View>
              )}
            </Card>
          ))
        )}

        <Button
          title="+ 약/영양제 추가하기"
          variant="secondary"
          size="large"
          onPress={() => router.push('/medication/add')}
          style={styles.addButton}
        />
      </ScrollView>

      {/* 스누즈 모달 */}
      <SnoozeModal
        visible={showSnoozeModal}
        onClose={() => {
          setShowSnoozeModal(false);
          setSelectedMedForSnooze(null);
          setSelectedTiming(null);
        }}
        onSelect={handleSnoozeSelect}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completionBadge: {
    backgroundColor: Colors.primaryLightest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
  weekDayItemSelected: {
    // 선택된 날짜 스타일 (필요시)
  },
  weekDayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
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
  calendarDayContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  scheduleSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
  },
  scheduleCard: {
    marginBottom: 16,
  },
  scheduleHeader: {
    marginBottom: 12,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleTime: {
    color: '#2196F3',
    fontWeight: '600',
  },
  medicationList: {
    marginBottom: 16,
  },
  medicationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  medicationName: {
    fontWeight: '500',
    flex: 1,
    flexShrink: 1,
  },
  medThumbnailContainer: {
    position: 'relative',
  },
  medThumbnail: {
    width: 44,
    height: 36,
    borderRadius: 6,
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
  takenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeButton: {
    marginTop: 8,
  },
  completedBadge: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    marginTop: 8,
  },
  addButton: {
    marginTop: 24,
  },
  // 시간대 그룹 스타일
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
  timePeriodHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  takeAllGroupButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
  },
  completedBadgeSmall: {
    backgroundColor: Colors.primaryLightest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  // 컴팩트 약물 아이템 스타일
  medicationItemCompact: {
    paddingVertical: 8,
  },
  medicationRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  medThumbnailContainerSmall: {
    position: 'relative',
  },
  medThumbnailSmall: {
    width: 36,
    height: 28,
    borderRadius: 4,
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
  medTimeLabel: {
    color: Colors.secondary,
    fontWeight: '500',
    fontSize: 12,
    minWidth: 40,
  },
  takeButtonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
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
  futureBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  takeAllSlotButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    marginTop: 8,
  },
  allCompletedBadge: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.primaryLightest,
    borderRadius: 8,
    marginTop: 8,
  },
  // 컨디션 기록 카드 스타일
  conditionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conditionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  conditionCardIcon: {
    width: 36,  // 28 * 1.3 ≈ 36
    height: 36,
  },
  conditionCardText: {
    flex: 1,
  },
  conditionCardTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
});
