import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Button, Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';
import { intakeService } from '../../services';
import { MedicationTiming, TodaySchedule, DaySummary, DayStatus } from '../../types';

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

export default function HomeScreen() {
  const { todayData, fetchTodaySchedule, recordIntake, isLoading } = useMedicationStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [monthlySummary, setMonthlySummary] = useState<DaySummary[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  const today = new Date().toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      fetchTodaySchedule();
      loadMonthlySummary(currentMonth.year, currentMonth.month);
    }, [currentMonth])
  );

  const loadMonthlySummary = async (year: number, month: number) => {
    try {
      const data = await intakeService.getMonthlySummary(year, month);
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

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: { year: number; month: number }) => {
    setCurrentMonth({ year: month.year, month: month.month });
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
      loadMonthlySummary(currentMonth.year, currentMonth.month);
    } catch (error) {
      console.error('Failed to record intake:', error);
    }
  };

  const dateDisplay = todayData
    ? `${todayData.date.replace(/-/g, '.')} (${todayData.dayOfWeek})`
    : new Date().toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });

  const schedules = todayData?.schedules || [];
  const summary = todayData?.summary;

  // 선택된 날짜의 요약 정보
  const selectedDaySummary = monthlySummary.find((d) => d.date === selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
        <View style={styles.header}>
          <Typography variant="h2">오늘의 약 💊</Typography>
        </View>

        {/* 달력 섹션 */}
        <Card style={styles.calendarCard} variant="elevated">
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

        {/* 오늘의 복약 스케줄 */}
        <View style={styles.scheduleSection}>
          <Typography variant="h3" style={styles.sectionTitle}>
            {dateDisplay}
          </Typography>
          {summary && (
            <Typography variant="bodySmall" color={Colors.textSecondary}>
              {summary.takenCount}/{summary.totalMedications}개 복용 완료
            </Typography>
          )}
        </View>

        {schedules.length === 0 ? (
          <Card style={styles.emptyCard} variant="elevated">
            <Typography variant="body" style={styles.emptyText}>
              오늘 먹을 약이 없어요
            </Typography>
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.emptySubtext}>
              약을 추가하면 여기에 표시됩니다
            </Typography>
          </Card>
        ) : (
          schedules.map((schedule, index) => (
            <Card key={index} style={styles.scheduleCard} variant="elevated">
              <View style={styles.scheduleHeader}>
                <Typography variant="h3">
                  {getTimingEmoji(schedule.timingLabel)} {schedule.timingLabel} ({schedule.scheduledTime})
                </Typography>
              </View>

              <View style={styles.medicationList}>
                {schedule.medications.map((med) => (
                  <View key={med.id} style={styles.medicationItem}>
                    <View style={styles.medicationRow}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: med.taken ? STATUS_COLORS.COMPLETE : Colors.backgroundSecondary },
                        ]}
                      />
                      <Typography variant="body">
                        {med.name} {med.dosage}정
                      </Typography>
                    </View>
                  </View>
                ))}
              </View>

              {!schedule.allTaken && (
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
          title="📷 약 추가하기"
          variant="secondary"
          size="large"
          onPress={() => router.push('/scan/camera')}
          style={styles.addButton}
        />
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  calendarCard: {
    marginBottom: 16,
    padding: 8,
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
  medicationList: {
    marginBottom: 16,
  },
  medicationItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
