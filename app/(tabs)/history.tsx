import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { intakeService } from '../../services';
import { Intake } from '../../types';

export default function HistoryScreen() {
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await intakeService.getIntakes();
      setIntakes(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupByDate = (intakes: Intake[]) => {
    const groups: Record<string, Intake[]> = {};
    intakes.forEach((intake) => {
      const date = new Date(intake.takenAt).toLocaleDateString('ko-KR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(intake);
    });
    return groups;
  };

  const groupedIntakes = groupByDate(intakes);
  const dates = Object.keys(groupedIntakes).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Typography variant="h2">복약 기록 📅</Typography>
          <Typography variant="body" color={Colors.textSecondary}>
            복용 내역을 확인하세요
          </Typography>
        </View>

        {dates.length === 0 ? (
          <Card style={styles.emptyCard} variant="elevated">
            <Typography variant="body" style={styles.emptyText}>
              복약 기록이 없어요
            </Typography>
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.emptySubtext}>
              약을 복용하면 여기에 기록됩니다
            </Typography>
          </Card>
        ) : (
          dates.map((date) => (
            <Card key={date} style={styles.dateCard} variant="elevated">
              <Typography variant="h3" style={styles.dateTitle}>
                {date}
              </Typography>
              {groupedIntakes[date].map((intake) => (
                <View key={intake.id} style={styles.intakeItem}>
                  <Typography variant="body">
                    ✅ 복용 완료
                  </Typography>
                  <Typography variant="caption" color={Colors.textSecondary}>
                    {new Date(intake.takenAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </View>
              ))}
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
  dateCard: {
    marginBottom: 12,
  },
  dateTitle: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  intakeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
});
