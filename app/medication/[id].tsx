import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Button, Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';
import { Medication } from '../../types';

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { medications, deleteMedication, isLoading } = useMedicationStore();
  const [medication, setMedication] = useState<Medication | null>(null);

  useEffect(() => {
    const found = medications.find((m) => m.id === parseInt(id));
    setMedication(found || null);
  }, [id, medications]);

  const handleDelete = () => {
    Alert.alert(
      '약 삭제',
      '이 약을 삭제하시겠어요?\n삭제하면 복구할 수 없어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedication(parseInt(id));
              router.back();
            } catch (error) {
              Alert.alert('오류', '약 삭제에 실패했어요.');
            }
          },
        },
      ]
    );
  };

  if (!medication) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContent}>
          <Typography variant="body">약을 찾을 수 없어요</Typography>
          <Button
            title="돌아가기"
            variant="primary"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const daysLeft = Math.ceil(medication.remainingCount / medication.frequency);
  const isLowStock = medication.remainingCount <= 3 * medication.frequency;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card variant="elevated" style={styles.headerCard}>
          <Typography variant="h2">{medication.name}</Typography>
          <Typography variant="body" color={Colors.textSecondary}>
            {medication.dosage}
          </Typography>
        </Card>

        <Card variant="elevated" style={styles.infoCard}>
          <Typography variant="h3" style={styles.sectionTitle}>
            복용 정보
          </Typography>

          <View style={styles.infoRow}>
            <Typography variant="body" color={Colors.textSecondary}>
              하루 복용 횟수
            </Typography>
            <Typography variant="body">{medication.frequency}회</Typography>
          </View>

          <View style={styles.infoRow}>
            <Typography variant="body" color={Colors.textSecondary}>
              복용 시간
            </Typography>
            <Typography variant="body">{medication.timing.join(', ')}</Typography>
          </View>

          <View style={styles.infoRow}>
            <Typography variant="body" color={Colors.textSecondary}>
              처방 일수
            </Typography>
            <Typography variant="body">{medication.durationDays}일</Typography>
          </View>
        </Card>

        <Card variant="elevated" style={styles.stockCard}>
          <Typography variant="h3" style={styles.sectionTitle}>
            남은 약
          </Typography>

          <View style={styles.stockInfo}>
            <Typography
              variant="h1"
              color={isLowStock ? Colors.warning : Colors.primary}
            >
              {medication.remainingCount}
            </Typography>
            <Typography variant="body" color={Colors.textSecondary}>
              / {medication.totalCount}개
            </Typography>
          </View>

          {isLowStock && (
            <View style={styles.warningBadge}>
              <Typography variant="bodySmall" color={Colors.warning}>
                약이 {daysLeft}일치 남았어요. 재처방을 준비하세요!
              </Typography>
            </View>
          )}
        </Card>

        <Card variant="elevated" style={styles.dateCard}>
          <View style={styles.infoRow}>
            <Typography variant="body" color={Colors.textSecondary}>
              시작일
            </Typography>
            <Typography variant="body">
              {new Date(medication.startDate).toLocaleDateString('ko-KR')}
            </Typography>
          </View>

          <View style={styles.infoRow}>
            <Typography variant="body" color={Colors.textSecondary}>
              등록일
            </Typography>
            <Typography variant="body">
              {new Date(medication.createdAt).toLocaleDateString('ko-KR')}
            </Typography>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="삭제하기"
          variant="outline"
          size="large"
          onPress={handleDelete}
          loading={isLoading}
          style={styles.deleteButton}
          textStyle={{ color: Colors.error }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backButton: {
    marginTop: 16,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  headerCard: {
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  stockCard: {
    marginBottom: 16,
  },
  dateCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  warningBadge: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
});
