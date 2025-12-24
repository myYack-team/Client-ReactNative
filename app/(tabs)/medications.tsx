import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';
import { MedicationListItem, Reminder } from '../../types';

export default function MedicationsScreen() {
  const { medications, fetchMedications, isLoading, error, needsRefresh, clearNeedsRefresh } = useMedicationStore();

  // 탭이 실제로 포커스될 때 조건부 데이터 로드
  // - 데이터가 없거나 needsRefresh 플래그가 true일 때만 로드
  useFocusEffect(
    useCallback(() => {
      if (medications.length === 0 || needsRefresh) {
        fetchMedications().then(() => {
          clearNeedsRefresh();
        }).catch((err) => {
          console.error('Failed to fetch medications:', err);
        });
      }
    }, [needsRefresh])
  );

  // 약 이름 가져오기 (displayName 우선)
  const getDrugDisplayName = (medication: MedicationListItem): string => {
    return medication.displayName || medication.drugName;
  };

  // 알림 시간 태그 렌더링
  const renderReminderTimeTags = (reminders?: Reminder[]) => {
    if (!reminders || reminders.length === 0) {
      return (
        <Typography variant="caption" color={Colors.textSecondary}>
          알림 설정 없음
        </Typography>
      );
    }
    return (
      <View style={styles.reminderTagsContainer}>
        {reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderTimeTag}>
            <Typography variant="caption" color={Colors.primary}>
              {reminder.time.substring(0, 5)}
            </Typography>
          </View>
        ))}
      </View>
    );
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
                <View style={styles.medicationRow}>
                  {/* 약물 이미지 썸네일 */}
                  {medication.imageUrl ? (
                    <Image source={{ uri: medication.imageUrl }} style={styles.medThumbnail} resizeMode="cover" />
                  ) : (
                    <View style={[styles.medThumbnail, styles.medThumbnailPlaceholder]}>
                      <Typography variant="body" color={Colors.textSecondary}>💊</Typography>
                    </View>
                  )}
                  <View style={styles.medicationContent}>
                    <View style={styles.medicationHeader}>
                      <Typography variant="body" style={styles.drugName} numberOfLines={1}>
                        {getDrugDisplayName(medication)}
                      </Typography>
                      <Typography variant="caption" color={Colors.textSecondary}>
                        1회 {medication.dosage}정 / 하루 {medication.frequency}회{medication.ingredientKr ? ` · ${medication.ingredientKr}` : ''}
                      </Typography>
                    </View>

                    <View style={styles.medicationInfo}>
                      <View style={styles.infoItem}>
                        <Typography variant="caption" color={Colors.textSecondary}>
                          알림 시간
                        </Typography>
                        {renderReminderTimeTags(medication.reminders)}
                      </View>

                      <View style={styles.infoItem}>
                        <Typography variant="caption" color={Colors.textSecondary}>
                          남은 약
                        </Typography>
                        <Typography
                          variant="caption"
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
  medicationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  medThumbnail: {
    width: 60,
    height: 48,
    borderRadius: 8,
  },
  medThumbnailPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationContent: {
    flex: 1,
  },
  medicationHeader: {
    marginBottom: 8,
  },
  medicationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  drugName: {
    fontWeight: '600',
    fontSize: 17,
  },
  reminderTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  reminderTimeTag: {
    backgroundColor: Colors.primaryLightest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  addButton: {
    marginTop: 24,
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#FFF0F0',
  },
});
