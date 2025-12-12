import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';
import { TIMING_LABELS, MedicationTiming } from '../../types';

export default function MedicationsScreen() {
  const { medications, fetchMedications, isLoading, error } = useMedicationStore();

  useEffect(() => {
    console.log('Fetching medications...');
    fetchMedications().then(() => {
      console.log('Medications fetched:', medications.length);
    }).catch((err) => {
      console.error('Failed to fetch medications:', err);
    });
  }, []);

  const formatTimings = (timings: MedicationTiming[]): string => {
    return timings.map((t) => TIMING_LABELS[t]).join(', ');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchMedications}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Typography variant="h2">약 목록 💊</Typography>
          <Typography variant="body" color={Colors.textSecondary}>
            등록된 약 {medications.length}개
          </Typography>
        </View>

        {error && (
          <Card style={styles.errorCard} variant="elevated">
            <Typography variant="body" color={Colors.error}>
              오류: {error}
            </Typography>
          </Card>
        )}

        {medications.length === 0 && !error ? (
          <Card style={styles.emptyCard} variant="elevated">
            <Typography variant="body" style={styles.emptyText}>
              등록된 약이 없어요
            </Typography>
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.emptySubtext}>
              처방전 사진을 찍어 약을 추가해보세요
            </Typography>
          </Card>
        ) : (
          medications.map((medication) => (
            <TouchableOpacity
              key={medication.id}
              onPress={() => router.push(`/medication/${medication.id}`)}
              activeOpacity={0.8}
            >
              <Card style={styles.medicationCard} variant="elevated">
                <View style={styles.medicationHeader}>
                  <Typography variant="h3" numberOfLines={1}>
                    {medication.drugName}
                  </Typography>
                  <Typography variant="bodySmall" color={Colors.textSecondary}>
                    1회 {medication.dosage}정 / 하루 {medication.frequency}회
                  </Typography>
                </View>

                <View style={styles.medicationInfo}>
                  <View style={styles.infoItem}>
                    <Typography variant="caption" color={Colors.textSecondary}>
                      복용 시간
                    </Typography>
                    <Typography variant="bodySmall">
                      {formatTimings(medication.timings)}
                    </Typography>
                  </View>

                  <View style={styles.infoItem}>
                    <Typography variant="caption" color={Colors.textSecondary}>
                      남은 약
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      color={
                        medication.daysLeft <= 3
                          ? Colors.warning
                          : Colors.textPrimary
                      }
                    >
                      {medication.remainingCount}개 ({medication.daysLeft}일분)
                      {medication.daysLeft <= 3 && ' ⚠️'}
                    </Typography>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
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
  medicationCard: {
    marginBottom: 12,
  },
  medicationHeader: {
    marginBottom: 12,
  },
  medicationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  addButton: {
    marginTop: 24,
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#FFF0F0',
  },
});
