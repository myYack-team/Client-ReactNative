import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../../ui';
import { FoodInteractionCard } from '../FoodInteractionCard';
import { FoodSuggestionCard } from '../FoodSuggestionCard';
import { Colors } from '../../../constants';
import { AnalysisResult } from '../../../types';

interface FoodTabProps {
  result: AnalysisResult;
}

export function FoodTab({ result }: FoodTabProps) {
  const hasFoodInteractions = result.foodInteractions && result.foodInteractions.length > 0;
  const hasFoodSuggestions = result.foodSuggestions && result.foodSuggestions.length > 0;

  if (!hasFoodInteractions && !hasFoodSuggestions) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="h1" style={styles.emptyEmoji}>
          &#x1F371;
        </Typography>
        <Typography variant="h3" style={styles.emptyTitle}>
          음식 정보가 없어요
        </Typography>
        <Typography variant="body" color={Colors.textSecondary}>
          분석 결과에 음식 관련 정보가 없습니다
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

      {/* 구분선 */}
      {hasFoodInteractions && hasFoodSuggestions && (
        <View style={styles.divider} />
      )}

      {/* 도움이 되는 음식 섹션 */}
      {hasFoodSuggestions && (
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            도움이 되는 음식
          </Typography>
          <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.sectionDescription}>
            복용 중인 약물과 함께 먹으면 좋은 음식이에요
          </Typography>
          <View style={styles.cardList}>
            {result.foodSuggestions.map((suggestion, index) => (
              <FoodSuggestionCard key={index} suggestion={suggestion} />
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
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 24,
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
