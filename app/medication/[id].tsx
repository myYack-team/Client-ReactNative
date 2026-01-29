import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Image as RNImage } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Button, Card, Typography, ExpandableText } from '../../components/ui';
import { Colors, API_BASE_URL } from '../../constants';
import { useMedicationStore } from '../../stores';
import { Medication, TIMING_LABELS, MedicationTiming } from '../../types';

const getImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http')) return imageUrl;
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${baseUrl}${path}`;
};

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMedicationDetail, deleteMedication, isLoading } = useMedicationStore();
  const navigation = useNavigation();
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
      if (data) {
        navigation.setOptions({ title: data.drugInfo?.displayName || data.drugName });
      }
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
        {/* 약 이미지 */}
        {drugInfo?.imageUrl ? (
          <View style={styles.drugImageContainer}>
            <Image
              source={{ uri: getImageUrl(drugInfo.imageUrl) }}
              style={styles.drugImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>
        ) : (
          <View style={styles.drugImagePlaceholder}>
            <RNImage
              source={require('../../assets/icons_iamge_processed/02_Pill.png')}
              style={styles.placeholderIcon}
              resizeMode="contain"
            />
          </View>
        )}

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
            <ExpandableText text={drugInfo.efficacy} numberOfLines={3} />
          </Card>
        )}

        {/* 용법/용량 - drugInfo에서 가져옴 */}
        {drugInfo?.useMethod && (
          <Card variant="elevated" style={styles.infoCard}>
            <Typography variant="h3" style={styles.sectionTitle}>
              용법/용량
            </Typography>
            <ExpandableText text={drugInfo.useMethod} numberOfLines={3} />
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
              <ExpandableText text={drugInfo.warning} numberOfLines={3} />
            )}
            {drugInfo.caution && (
              <View style={styles.cautionContainer}>
                <ExpandableText text={drugInfo.caution} numberOfLines={3} />
              </View>
            )}
          </Card>
        )}

        {/* 부작용 - drugInfo에서 가져옴 */}
        {drugInfo?.sideEffect && (
          <Card variant="elevated" style={styles.infoCard}>
            <Typography variant="h3" style={styles.sectionTitle}>
              부작용
            </Typography>
            <ExpandableText text={drugInfo.sideEffect} numberOfLines={3} />
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

        {/* 데이터 출처 안내 */}
        {drugInfo && (
          <View style={styles.sourceSection}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
            <Typography variant="caption" color={Colors.textSecondary} style={styles.sourceText}>
              약물 정보는 식품의약품안전처 공공데이터를 기반으로 제공되며, 참고용으로만 사용해 주세요.
            </Typography>
          </View>
        )}
        <Button
          title="삭제하기"
          variant="danger"
          size="large"
          onPress={handleDelete}
          loading={isLoading}
          style={styles.deleteButton}
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
  cautionContainer: {
    marginTop: 12,
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
  deleteButton: {
    marginTop: 8,
  },
  sourceSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 16,
  },
  sourceText: {
    flex: 1,
    lineHeight: 18,
  },
  drugImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  drugImage: {
    width: '100%',
    height: '100%',
  },
  drugImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderIcon: {
    width: 64,
    height: 64,
    tintColor: Colors.textSecondary,
  },
});
