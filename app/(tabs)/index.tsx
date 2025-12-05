import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore, useAuthStore } from '../../stores';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const { todayMedications, fetchTodayMedications, recordIntake, isLoading } = useMedicationStore();

  useEffect(() => {
    fetchTodayMedications();
  }, []);

  const today = new Date();
  const dateString = today.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const handleTakeAll = async (timing: string, medicationIds: number[]) => {
    try {
      await recordIntake(medicationIds);
    } catch (error) {
      console.error('Failed to record intake:', error);
    }
  };

  const getTimingEmoji = (timing: string): string => {
    if (timing.includes('아침')) return '☀️';
    if (timing.includes('점심')) return '🌤️';
    if (timing.includes('저녁')) return '🌙';
    if (timing.includes('취침')) return '🌃';
    return '💊';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchTodayMedications}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Typography variant="h2">오늘의 약 💊</Typography>
          <Typography variant="body" color={Colors.textSecondary}>
            {dateString}
          </Typography>
        </View>

        {todayMedications.length === 0 ? (
          <Card style={styles.emptyCard} variant="elevated">
            <Typography variant="body" style={styles.emptyText}>
              오늘 먹을 약이 없어요
            </Typography>
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.emptySubtext}>
              약을 추가하면 여기에 표시됩니다
            </Typography>
          </Card>
        ) : (
          todayMedications.map((schedule, index) => {
            const allTaken = schedule.medications.every((m) => m.isTaken);
            const notTakenMeds = schedule.medications.filter((m) => !m.isTaken);

            return (
              <Card key={index} style={styles.scheduleCard} variant="elevated">
                <View style={styles.scheduleHeader}>
                  <Typography variant="h3">
                    {getTimingEmoji(schedule.timing)} {schedule.timing} ({schedule.time})
                  </Typography>
                </View>

                <View style={styles.medicationList}>
                  {schedule.medications.map((med) => (
                    <View key={med.id} style={styles.medicationItem}>
                      <Typography variant="body">
                        {med.isTaken ? '✅' : '⬜'} {med.name} {med.dosage}
                      </Typography>
                    </View>
                  ))}
                </View>

                {!allTaken && (
                  <Button
                    title="모두 먹었어요 ✓"
                    variant="primary"
                    size="medium"
                    onPress={() =>
                      handleTakeAll(
                        schedule.timing,
                        notTakenMeds.map((m) => m.id)
                      )
                    }
                    style={styles.takeButton}
                  />
                )}

                {allTaken && (
                  <View style={styles.completedBadge}>
                    <Typography variant="body" color={Colors.primary}>
                      ✓ 완료
                    </Typography>
                  </View>
                )}
              </Card>
            );
          })
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
