import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, FlatList, Dimensions, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Button, Card, Typography, MedicationActionButtons, SnoozeModal, DrugTypeBadge, SupplementTagBadge } from '../../components/ui';
import { Colors } from '../../constants';
import { useResponsive } from '../../hooks';
import { useMedicationStore } from '../../stores';
import { intakeService, reminderService } from '../../services';
import { MedicationTiming, TodaySchedule, DaySummary, DayStatus, ScheduleMedication, IntakesResponse } from '../../types';
import { getMedDisplayName } from '../../utils';

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
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

export default function HomeScreen() {
  const { contentStyle } = useResponsive();
  const { todayData, fetchTodaySchedule, recordIntake, isLoading, fetchScheduleForDate, isLoadingSchedule: storeIsLoadingSchedule, fetchMonthlySummary } = useMedicationStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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

  const today = new Date().toISOString().split('T')[0];

  // 오늘 날짜로 주간 달력 스크롤
  const scrollToToday = useCallback(() => {
    const todayIndex = weekDates.findIndex((d) => d === today);
    if (todayIndex !== -1 && weekListRef.current) {
      weekListRef.current.scrollToIndex({
        index: Math.max(0, todayIndex - 3),
        animated: true,
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
      loadMonthlySummary(currentMonth.year, currentMonth.month);
    }, [currentMonth])
  );

  // 선택된 날짜가 변경되면 스케줄 로드
  useEffect(() => {
    loadScheduleForDate(selectedDate);
  }, [selectedDate, loadScheduleForDate]);

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
          index: Math.max(0, todayIndex - 3),
          animated: false,
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
        {/* 상태 점 */}
        {status !== 'NONE' && status !== 'COMPLETE' && (
          <View style={[styles.weekDayStatusDot, { backgroundColor: statusColor }]} />
        )}
      </TouchableOpacity>
    );
  };

  const getTimingEmoji = (timingLabel: string): string => {
    if (timingLabel.includes('아침')) return '☀️';
    if (timingLabel.includes('점심')) return '🌤️';
    if (timingLabel.includes('저녁')) return '🌙';
    if (timingLabel.includes('취침')) return '🌃';
    return '💊';
  };

  const handleTakeAll = async (schedule: TodaySchedule) => {
    const notTakenMeds = schedule.medications.filter((m) => !m.taken);
    if (notTakenMeds.length === 0) return;

    try {
      await recordIntake(
        notTakenMeds.map((m) => m.id),
        schedule.timing
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
      await recordIntake([med.id], timing);
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

  // 선택된 날짜의 요약 정보
  const selectedDaySummary = monthlySummary.find((d) => d.date === selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        onTouchStart={scrollToToday}
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
              <Typography variant="h3">📅</Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* 주간 달력 스트립 */}
        <Card style={styles.weekStripCard} variant="elevated">
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
        </Card>

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
                <Calendar
                  current={`${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}-01`}
                  onDayPress={handleDayPress}
                  onMonthChange={handleMonthChange}
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
                  renderHeader={(date) => {
                    const d = new Date(date.toString());
                    return (
                      <Typography variant="h3" style={{ marginVertical: 10 }}>
                        {d.getFullYear()}년 {d.getMonth() + 1}월
                      </Typography>
                    );
                  }}
                />

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

        {/* 선택된 날짜 정보 */}
        {selectedDaySummary && selectedDaySummary.status !== 'NONE' && (
          <Card style={styles.summaryCard}>
            <Typography variant="bodySmall" color={Colors.textSecondary}>
              {selectedDate === today ? '오늘' : selectedDate.replace(/-/g, '.')}
            </Typography>
            <Typography variant="body">
              {selectedDaySummary.totalTaken}/{selectedDaySummary.totalScheduled}개 복용
              {selectedDaySummary.status === 'COMPLETE' && ' ✓'}
            </Typography>
          </Card>
        )}

        {/* 복약 스케줄 */}
        <View style={styles.scheduleSection}>
          <Typography variant="h3" style={styles.sectionTitle}>
            {isSelectedDateToday ? '오늘의 복약' : `${selectedDate.substring(5).replace('-', '/')} 복약`}
          </Typography>
        </View>

        {storeIsLoadingSchedule ? (
          <Card style={styles.emptyCard} variant="elevated">
            <Typography variant="body" style={styles.emptyText}>
              불러오는 중...
            </Typography>
          </Card>
        ) : schedules.length === 0 ? (
          <Card style={styles.emptyCard} variant="elevated">
            <Typography variant="body" style={styles.emptyText}>
              {isSelectedDateToday ? '오늘 먹을 약이 없어요' : '이 날짜에 복약 기록이 없어요'}
            </Typography>
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.emptySubtext}>
              {isSelectedDateToday ? '약을 추가하면 여기에 표시됩니다' : ''}
            </Typography>
          </Card>
        ) : (
          schedules.map((schedule, index) => (
            <Card key={index} style={styles.scheduleCard} variant="elevated">
              <View style={styles.scheduleHeader}>
                <View style={styles.scheduleHeaderRow}>
                  <Typography variant="h3">
                    {getTimingEmoji(schedule.timingLabel)} {schedule.timingLabel}
                  </Typography>
                  <Typography variant="body" style={styles.scheduleTime}>
                    {schedule.scheduledTime}
                  </Typography>
                </View>
              </View>

              <View style={styles.medicationList}>
                {schedule.medications.map((med) => (
                  <View key={med.id} style={styles.medicationItem}>
                    <View style={styles.medicationRow}>
                      {/* 약물 이미지 썸네일 */}
                      <View style={styles.medThumbnailContainer}>
                        {med.imageUrl ? (
                          <Image source={{ uri: med.imageUrl }} style={styles.medThumbnail} resizeMode="cover" />
                        ) : (
                          <View style={[styles.medThumbnail, styles.medThumbnailPlaceholder]}>
                            <Typography variant="caption" color={Colors.textSecondary}>
                              {med.isSupplement ? '🍀' : '💊'}
                            </Typography>
                          </View>
                        )}
                        {/* 복용 상태 표시 */}
                        {med.taken && (
                          <View style={styles.takenOverlay}>
                            <Typography variant="caption" color={Colors.white}>✓</Typography>
                          </View>
                        )}
                      </View>
                      <View style={styles.medicationInfo}>
                        <View style={styles.medicationNameRow}>
                          <Typography
                            variant="body"
                            style={styles.medicationName}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {getMedDisplayName(med)}
                          </Typography>
                          {med.isSupplement && med.supplementTag ? (
                            <SupplementTagBadge tag={med.supplementTag} size="small" />
                          ) : med.drugType ? (
                            <DrugTypeBadge type={med.drugType} size="small" />
                          ) : null}
                        </View>
                        <Typography variant="caption" color={Colors.textSecondary}>
                          {med.dosage}정
                        </Typography>
                      </View>
                    </View>
                    {/* 복용 안 한 약물에만 액션 버튼 표시 (오늘 날짜일 때만) */}
                    {!med.taken && isSelectedDateToday && (
                      <MedicationActionButtons
                        onSkip={() => handleSkipMedication(med, schedule.timing)}
                        onMiss={() => handleMissMedication(med, schedule.timing)}
                        onTakeNow={() => handleTakeMedication(med, schedule.timing)}
                        disabled={processingMeds.has(med.id)}
                      />
                    )}
                  </View>
                ))}
              </View>

              {!schedule.allTaken && isSelectedDateToday && (
                <Button
                  title="모두 먹었어요 ✓"
                  variant="primary"
                  size="medium"
                  onPress={() => handleTakeAll(schedule)}
                  style={styles.takeButton}
                />
              )}

              {schedule.allTaken && (
                <View style={styles.completedBadge}>
                  <Typography variant="body" color={Colors.primary}>
                    ✓ 완료
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  weekStripCard: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 0,
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
  weekDayStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
  summaryCard: {
    marginBottom: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
