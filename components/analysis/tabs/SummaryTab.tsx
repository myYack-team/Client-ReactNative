import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../../ui';
import { MechanismCard } from '../MechanismCard';
import { FoodInteractionCard } from '../FoodInteractionCard';
import { Colors } from '../../../constants';
import { AnalysisResult } from '../../../types';

interface SummaryTabProps {
  result: AnalysisResult;
}

export function SummaryTab({ result }: SummaryTabProps) {
  const hasMechanisms = result.mechanismGroups && result.mechanismGroups.length > 0;
  const hasFoodInteractions = result.foodInteractions && result.foodInteractions.length > 0;

  if (!hasMechanisms && !hasFoodInteractions) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="h1" style={styles.emptyEmoji}>
          &#x1F50D;
        </Typography>
        <Typography variant="h3" style={styles.emptyTitle}>
          분석 결과가 없어요
        </Typography>
        <Typography variant="body" color={Colors.textSecondary}>
          등록된 약물이 없거나 분석할 정보가 부족해요
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 기전 그룹 섹션 */}
      {hasMechanisms && (
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            약물 작용 기전
          </Typography>
          <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.sectionDescription}>
            복용 중인 약물들이 어떻게 작용하는지 쉽게 설명해드려요
          </Typography>
          <View style={styles.cardList}>
            {result.mechanismGroups.map((group, index) => (
              <MechanismCard key={index} mechanism={group} />
            ))}
          </View>
        </View>
      )}

      {/* 주의할 음식 섹션 */}
      {hasFoodInteractions && (
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            주의할 음식
          </Typography>
          <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.sectionDescription}>
            약물과 함께 섭취 시 주의가 필요한 음식들이에요
          </Typography>
          <View style={styles.cardList}>
            {result.foodInteractions.map((interaction, index) => (
              <FoodInteractionCard key={index} interaction={interaction} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
});
