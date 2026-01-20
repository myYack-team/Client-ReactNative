import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui';
import { Colors } from '../../constants';
import { Insight } from '../../types';

interface InsightCardProps {
  insight: Insight;
}

// 인사이트 타입별 레이블
const INSIGHT_TYPE_LABELS: Record<string, string> = {
  CONDITION_CORRELATION: '컨디션 상관관계',
  HABIT_SUGGESTION: '습관 제안',
  ACHIEVEMENT: '성취',
  PATTERN: '패턴 분석',
};

export function InsightCard({ insight }: InsightCardProps) {
  const typeLabel = insight.insightType
    ? INSIGHT_TYPE_LABELS[insight.insightType] || insight.insightType
    : '인사이트';

  return (
    <View style={styles.card}>
      {/* 아이콘 */}
      <View style={styles.iconContainer}>
        <Typography variant="h3">{insight.insightIcon || '💡'}</Typography>
      </View>

      {/* 내용 */}
      <View style={styles.content}>
        {/* 타입 */}
        <Typography variant="caption" color={Colors.textTertiary} style={styles.category}>
          {typeLabel}
        </Typography>

        {/* 제목 */}
        <Typography variant="body" style={styles.title}>
          {insight.title}
        </Typography>

        {/* 설명 */}
        <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.description}>
          {insight.description}
        </Typography>

        {/* 실천 항목 (있을 경우) */}
        {insight.actionItem && (
          <View style={styles.actionContainer}>
            <Typography variant="caption" color={Colors.brand}>
              👉 {insight.actionItem}
            </Typography>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brandLightest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  category: {
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: 8,
    backgroundColor: Colors.brandLightest,
    padding: 10,
    borderRadius: 8,
  },
});
