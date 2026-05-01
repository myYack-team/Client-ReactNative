import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, FlatList, Dimensions, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { CalendarList, LocaleConfig } from 'react-native-calendars';
import { Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useResponsive } from '../../hooks';
import { useFamilyStore } from '../../stores';
import { TodaySchedule, DaySummary, DayStatus, MedicationTiming } from '../../types';
import { getMedDisplayName } from '../../utils';
import { getTodayString, formatDateToLocal, addDays } from '../../utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_ITEM_WIDTH = (SCREEN_WIDTH - 40) / 7;

// 날짜 상태에 따른 색상
const STATUS_COLORS: Record<DayStatus, string> = {
  COMPLETE: '#4CAF50',
  PARTIAL: '#FF9800',
  MISSED: '#F44336',
  PENDING: '#2196F3',
  NONE: 'transparent',
};

const DAY_OF_WEEK_COLORS = {
  SUNDAY: '#F44336',
  SATURDAY: '#2196F3',
  WEEKDAY: Colors.textSecondary,
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

const generateWeekDates = () => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = -21; i <= 21; i++) {
    dates.push(formatDateToLocal(addDays(today, i)));
  }
  return dates;
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

export default function FamilyUserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { contentStyle } = useResponsive();
  const insets = useSafeAreaInsets();
  const {
    linkStatus,
    fetchFamilyScheduleForDate,
    fetchFamilyMonthlySummary,
    isLoadingSchedule,
  } = useFamilyStore();

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [schedules, setSchedules] = useState<TodaySchedule[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<DaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [weekDates] = useState(generateWeekDates());
  const weekListRef = useRef<FlatList>(null);
  const [currentMonth, setCurrentMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  const today = getTodayString();
  const numericUserId = parseInt(userId || '0', 10);

  // 가족 정보 찾기
  const familyMember = linkStatus?.linkedFamilies?.find(f => f.userId === numericUserId);

  // 데이터 로드
  const loadData = useCallback(async () => {
    if (!numericUserId) return;

    setIsLoading(true);
    try {
      const [scheduleData, summaryData] = await Promise.all([
        fetchFamilyScheduleForDate(numericUserId, selectedDate),
        fetchFamilyMonthlySummary(
          numericUserId,
          new Date(selectedDate).getFullYear(),
          new Date(selectedDate).getMonth() + 1
        ),
      ]);
      setSchedules(scheduleData);
      setMonthlySummary(summaryData.days);
    } catch (error) {
      console.error('Failed to load family data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [numericUserId, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 마킹 날짜 업데이트
  useEffect(() => {
    const marked: MarkedDates = {};
    monthlySummary.forEach((day) => {
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
    const daySummary = monthlySummary.find((d) => d.date === dateString);
    if (daySummary) return daySummary.status as DayStatus;
    const dateObj = new Date(dateString);
    const todayObj = new Date(today);
    if (dateString === today) return 'PENDING';
    if (dateObj > todayObj) return 'PENDING';
    return 'NONE';
  };

  const getDayOfWeekColor = (dayIndex: number): string => {
    if (dayIndex === 0) return DAY_OF_WEEK_COLORS.SUNDAY;
    if (dayIndex === 6) return DAY_OF_WEEK_COLORS.SATURDAY;
    return DAY_OF_WEEK_COLORS.WEEKDAY;
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
              backgroundColor: isSelected
                ? Colors.primary
                : status === 'COMPLETE'
                  ? STATUS_COLORS.COMPLETE
                  : Colors.background,
              borderWidth: 2,
              borderColor: !isSelected && status !== 'COMPLETE' && status !== 'NONE'
                ? statusColor
                : 'transparent',
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, contentStyle, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            colors={[Colors.primary]}
          />
        }
      >
        {/* 가족 정보 */}
        {familyMember && (
          <View style={styles.familyHeader}>
            {familyMember.profileImage ? (
              <Image source={{ uri: familyMember.profileImage }} style={styles.familyAvatar} resizeMode="cover" />
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
            <Typography variant="h3">{familyMember.name}님의 복약 현황</Typography>
          </View>
        )}

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
            extraData={`${selectedDate}_${monthlySummary.length}`}
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
            <Typography variant="body">이 날짜에 복약 기록이 없어요</Typography>
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
                              resizeMode="contain"
                            />
                          </View>
                        )}
                        {med.taken && (
                          <View style={styles.takenOverlaySmall}>
                            <Image
                              source={require('../../assets/icons_iamge_processed/31_Checkmark.png')}
                              style={styles.checkmarkIcon}
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
});
