import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Button, Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';
import { Medication, TIMING_LABELS, MedicationTiming } from '../../types';

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMedicationDetail, deleteMedication, isLoading } = useMedicationStore();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    loadMedication();
  }, [id]);

  const loadMedication = async () => {
    try {
      setLoadingDetail(true);
      const data = await getMedicationDetail(parseInt(id));
      setMedication(data);
    } catch (error) {
      console.error('Failed to load medication:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

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

  const formatTimings = (timings: MedicationTiming[]): string => {
    return timings.map((t) => TIMING_LABELS[t]).join(', ');
  };

  if (loadingDetail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
  const isLowStock = daysLeft <= 3;
  const drugInfo = medication.drugInfo;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card variant="elevated" style={styles.headerCard}>
          <Typography variant="h2">{medication.drugName}</Typography>
          {drugInfo?.entpName && (
            <Typography variant="bodySmall" color={Colors.textSecondary}>
              {drugInfo.entpName}
            </Typography>
          )}
          <Typography variant="body" color={Colors.textSecondary}>
            1회 {medication.dosage}정 / 하루 {medication.frequency}회
          </Typography>
        </Card>

        {/* 약 효능/용도 - drugInfo에서 가져옴 */}
        {drugInfo?.efficacy && (
          <Card variant="elevated" style={styles.infoCard}>
            <Typography variant="h3" style={styles.sectionTitle}>
              효능/용도
            </Typography>
            <Typography variant="body" style={styles.descriptionText}>
              {drugInfo.efficacy}
            </Typography>
          </Card>
        )}

        {/* 용법/용량 - drugInfo에서 가져옴 */}
        {drugInfo?.useMethod && (
          <Card variant="elevated" style={styles.infoCard}>
            <Typography variant="h3" style={styles.sectionTitle}>
              용법/용량
            </Typography>
            <Typography variant="body" style={styles.descriptionText}>
              {drugInfo.useMethod}
            </Typography>
          </Card>
        )}

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
            <Typography variant="body">{formatTimings(medication.timings)}</Typography>
          </View>

          <View style={styles.infoRow}>
            <Typography variant="body" color={Colors.textSecondary}>
              처방 일수
            </Typography>
            <Typography variant="body">{medication.durationDays}일</Typography>
          </View>
        </Card>

        {/* 주의사항 - drugInfo에서 가져옴 */}
        {(drugInfo?.warning || drugInfo?.caution) && (
          <Card variant="elevated" style={styles.warningCard}>
            <Typography variant="h3" style={styles.sectionTitle}>
              주의사항
            </Typography>
            {drugInfo.warning && (
              <Typography variant="body" style={styles.descriptionText}>
                {drugInfo.warning}
              </Typography>
            )}
            {drugInfo.caution && (
              <Typography variant="body" style={styles.descriptionTextWithMargin}>
                {drugInfo.caution}
              </Typography>
            )}
          </Card>
        )}

        {/* 부작용 - drugInfo에서 가져옴 */}
        {drugInfo?.sideEffect && (
          <Card variant="elevated" style={styles.infoCard}>
            <Typography variant="h3" style={styles.sectionTitle}>
              부작용
            </Typography>
            <Typography variant="body" style={styles.descriptionText}>
              {drugInfo.sideEffect}
            </Typography>
          </Card>
        )}

        {/* 보관법 - drugInfo에서 가져옴 */}
        {drugInfo?.storageMethod && (
          <Card variant="elevated" style={styles.infoCard}>
            <Typography variant="h3" style={styles.sectionTitle}>
              보관법
            </Typography>
            <Typography variant="body" style={styles.descriptionText}>
              {drugInfo.storageMethod}
            </Typography>
          </Card>
        )}

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

        {/* 메모 */}
        {medication.memo && (
          <Card variant="elevated" style={styles.infoCard}>
            <Typography variant="h3" style={styles.sectionTitle}>
              메모
            </Typography>
            <Typography variant="body" style={styles.descriptionText}>
              {medication.memo}
            </Typography>
          </Card>
        )}
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
  warningCard: {
    marginBottom: 16,
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  descriptionText: {
    lineHeight: 24,
  },
  descriptionTextWithMargin: {
    lineHeight: 24,
    marginTop: 8,
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
