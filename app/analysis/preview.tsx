import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Typography, Button } from '../../components/ui';
import { MechanismCard, FoodInteractionCard } from '../../components/analysis';
import { Colors } from '../../constants';
import { MechanismGroup, FoodInteraction } from '../../types';

// 목업 데이터
const MOCK_MECHANISM_GROUPS: MechanismGroup[] = [
  {
    categoryName: '혈압 조절',
    categoryIcon: '❤️',
    description: '혈관을 확장시켜 혈압을 낮추는 작용을 해요. 심장의 부담을 줄여주고 혈액 순환을 개선합니다.',
    analogy: '수도 호스를 넓혀서 물이 더 쉽게 흐르게 하는 것과 같아요',
    medicationCount: 2,
    medications: [
      { name: '노바스크정 5mg', ingredientName: '암로디핀베실산염' },
      { name: '디오반정 80mg', ingredientName: '발사르탄' },
    ],
  },
  {
    categoryName: '혈당 조절',
    categoryIcon: '🩸',
    description: '인슐린 분비를 촉진하거나 인슐린 감수성을 높여 혈당을 조절해요. 식후 혈당 상승을 완만하게 합니다.',
    analogy: '몸의 에너지 사용 효율을 높이는 연비 개선과 비슷해요',
    medicationCount: 1,
    medications: [
      { name: '글루코파지정 500mg', ingredientName: '메트포르민염산염' },
    ],
  },
  {
    categoryName: '콜레스테롤 조절',
    categoryIcon: '💊',
    description: '간에서 콜레스테롤 합성을 억제하여 혈중 콜레스테롤 수치를 낮춰요. 심혈관 질환 예방에 도움이 됩니다.',
    analogy: '혈관 벽에 쌓이는 기름때를 줄여주는 청소부 역할을 해요',
    medicationCount: 1,
    medications: [
      { name: '리피토정 10mg', ingredientName: '아토르바스타틴칼슘' },
    ],
  },
];

const MOCK_FOOD_INTERACTIONS: FoodInteraction[] = [
  {
    foodName: '자몽',
    foodIcon: '🍊',
    interactionLevel: 'HIGH',
    affectedMedicationCount: 2,
    summaryReason: '약물 대사를 방해하여 혈중 농도가 과도하게 높아질 수 있어요',
    details: [
      {
        medicationId: 1,
        medicationName: '노바스크정 5mg',
        reason: '자몽이 CYP3A4 효소를 억제하여 암로디핀의 혈중 농도가 높아질 수 있어요. 혈압이 과도하게 떨어지거나 부작용이 강해질 수 있습니다.',
      },
      {
        medicationId: 4,
        medicationName: '리피토정 10mg',
        reason: '자몽 주스가 아토르바스타틴의 대사를 방해해요. 근육통이나 간 수치 상승 등의 부작용 위험이 높아질 수 있습니다.',
      },
    ],
  },
  {
    foodName: '우유/유제품',
    foodIcon: '🥛',
    interactionLevel: 'MEDIUM',
    affectedMedicationCount: 1,
    summaryReason: '약물 흡수를 방해할 수 있어요',
    details: [
      {
        medicationId: 5,
        medicationName: '레보플록사신정',
        reason: '유제품의 칼슘이 약물과 결합하여 흡수율을 떨어뜨려요. 복용 2시간 전후로는 유제품 섭취를 피하는 것이 좋습니다.',
      },
    ],
  },
  {
    foodName: '녹색 채소 (시금치, 브로콜리)',
    foodIcon: '🥬',
    interactionLevel: 'MEDIUM',
    affectedMedicationCount: 1,
    summaryReason: '약물 효과에 영향을 줄 수 있어요',
    details: [
      {
        medicationId: 6,
        medicationName: '와파린정',
        reason: '비타민 K가 풍부한 녹색 채소는 와파린의 항응고 효과를 감소시킬 수 있어요. 갑자기 섭취량을 늘리거나 줄이지 말고 일정하게 유지하세요.',
      },
    ],
  },
  {
    foodName: '알코올',
    foodIcon: '🍺',
    interactionLevel: 'HIGH',
    affectedMedicationCount: 3,
    summaryReason: '약물 부작용을 증가시키고 간 손상 위험이 있어요',
    details: [
      {
        medicationId: 3,
        medicationName: '글루코파지정 500mg',
        reason: '알코올과 메트포르민을 함께 복용하면 젖산산증 위험이 높아져요. 저혈당 위험도 증가합니다.',
      },
      {
        medicationId: 4,
        medicationName: '리피토정 10mg',
        reason: '알코올이 간 손상 위험을 높일 수 있어요. 스타틴 계열 약물 복용 중에는 음주를 자제하세요.',
      },
      {
        medicationId: 1,
        medicationName: '노바스크정 5mg',
        reason: '알코올이 혈압 강하 효과를 증가시켜 어지러움이나 실신 위험이 높아질 수 있어요.',
      },
    ],
  },
  {
    foodName: '카페인 음료',
    foodIcon: '☕',
    interactionLevel: 'LOW',
    affectedMedicationCount: 1,
    summaryReason: '약물 효과에 영향을 줄 수 있어요',
    details: [
      {
        medicationId: 1,
        medicationName: '노바스크정 5mg',
        reason: '과도한 카페인 섭취는 혈압을 일시적으로 올릴 수 있어요. 적당량의 커피는 괜찮지만, 과도한 섭취는 피하세요.',
      },
    ],
  },
];

export default function AnalysisPreviewScreen() {
  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.previewBadge}>
            <Typography variant="caption" color={Colors.white}>
              미리보기
            </Typography>
          </View>
          <View style={styles.headerTitleRow}>
            <Typography variant="h2" style={styles.headerEmoji}>✨</Typography>
            <Typography variant="h2">분석 완료</Typography>
          </View>
          <Typography variant="body" color={Colors.textSecondary}>
            2025년 1월 4일 기준
          </Typography>
        </View>

        {/* 기전 그룹 섹션 */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            💊 약물 작용 기전
          </Typography>
          <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.sectionDescription}>
            복용 중인 약물들이 어떻게 작용하는지 쉽게 설명해드려요
          </Typography>
          <View style={styles.cardList}>
            {MOCK_MECHANISM_GROUPS.map((group, index) => (
              <MechanismCard key={index} mechanism={group} />
            ))}
          </View>
        </View>

        {/* 음식 상호작용 섹션 */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            🍽️ 음식 상호작용
          </Typography>
          <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.sectionDescription}>
            약물과 함께 섭취 시 주의가 필요한 음식들이에요
          </Typography>
          <View style={styles.cardList}>
            {MOCK_FOOD_INTERACTIONS.map((interaction, index) => (
              <FoodInteractionCard key={index} interaction={interaction} />
            ))}
          </View>
        </View>

        {/* 면책 조항 */}
        <View style={styles.disclaimer}>
          <Typography variant="caption" color={Colors.textTertiary} style={styles.disclaimerText}>
            ⚠️ AI 분석 결과는 참고용이며, 의료적 판단이나 처방을 대체하지 않습니다.
            복용에 관한 결정은 반드시 의사나 약사와 상담하세요.
          </Typography>
        </View>

        {/* 완료 버튼 */}
        <Button
          title="돌아가기"
          variant="primary"
          size="large"
          onPress={handleGoBack}
          style={styles.completeButton}
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
  previewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerEmoji: {
    fontSize: 28,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
  },
  cardList: {
    gap: 16,
  },
  disclaimer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  disclaimerText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  completeButton: {
    marginTop: 24,
  },
});