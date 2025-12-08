import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';
import { MedicationTiming, TodaySchedule } from '../../types';

export default function HomeScreen() {
  const { todayData, fetchTodaySchedule, recordIntake, isLoading } = useMedicationStore();

  useEffect(() => {
    fetchTodaySchedule();
  }, []);

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchTodaySchedule}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Typography variant="h2">오늘의 약 💊</Typography>
          <Typography variant="body" color={Colors.textSecondary}>
            {dateDisplay}
          </Typography>
          {summary && (
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.summary}>
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
                    <Typography variant="body">
                      {med.taken ? '✅' : '⬜'} {med.name} {med.dosage}정
                    </Typography>
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
