import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { intakeService } from '../../services';
import { IntakesResponse, TodaySchedule } from '../../types';

export default function HistoryScreen() {
  const [intakesData, setIntakesData] = useState<IntakesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await intakeService.getIntakesByDate();
      setIntakesData(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimingEmoji = (timingLabel: string): string => {
    if (timingLabel.includes('아침')) return '☀️';
    if (timingLabel.includes('점심')) return '🌤️';
    if (timingLabel.includes('저녁')) return '🌙';
    if (timingLabel.includes('취침')) return '🌃';
    return '💊';
  };

  const schedules = intakesData?.schedules || [];
  const summary = intakesData?.summary;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadHistory}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Typography variant="h2">복약 기록 📅</Typography>
          <Typography variant="body" color={Colors.textSecondary}>
            {intakesData?.date || '오늘'}의 복용 내역
          </Typography>
          {summary && (
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.summary}>
              복용률 {summary.completionRate.toFixed(0)}% ({summary.totalTaken}/{summary.totalScheduled}개)
            </Typography>
          )}
        </View>

        {schedules.length === 0 ? (
          <Card style={styles.emptyCard} variant="elevated">
            <Typography variant="body" style={styles.emptyText}>
              복약 기록이 없어요
            </Typography>
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.emptySubtext}>
              약을 복용하면 여기에 기록됩니다
            </Typography>
          </Card>
        ) : (
          schedules.map((schedule, index) => (
            <Card key={index} style={styles.scheduleCard} variant="elevated">
              <View style={styles.scheduleHeader}>
                <Typography variant="h3">
                  {getTimingEmoji(schedule.timingLabel)} {schedule.timingLabel}
                </Typography>
                <Typography variant="caption" color={Colors.textSecondary}>
                  {schedule.scheduledTime}
                </Typography>
              </View>

              {schedule.medications.map((med) => (
                <View key={med.id} style={styles.medicationItem}>
                  <View style={styles.medicationInfo}>
                    <Typography variant="body">
                      {med.taken ? '✅' : '⬜'} {med.name}
                    </Typography>
                    <Typography variant="caption" color={Colors.textSecondary}>
                      {med.dosage}정
                    </Typography>
                  </View>
                  {med.taken && med.takenAt && (
                    <Typography variant="caption" color={Colors.primary}>
                      {new Date(med.takenAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  )}
                </View>
              ))}

              {schedule.allTaken && (
                <View style={styles.completedBadge}>
                  <Typography variant="bodySmall" color={Colors.primary}>
                    ✓ 모두 복용 완료
                  </Typography>
                </View>
              )}
            </Card>
          ))
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  summary: {
    marginTop: 4,
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
    marginBottom: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  medicationInfo: {
    flex: 1,
  },
  completedBadge: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
});
