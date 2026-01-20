import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../ui';
import { Colors } from '../../constants';
import { Pattern, PatternType } from '../../types';

interface PatternCardProps {
  pattern: Pattern;
}

const PATTERN_TYPE_STYLES: Record<PatternType, { borderColor: string; bgColor: string; textColor: string; label: string }> = {
  POSITIVE: {
    borderColor: '#4CAF50',
    bgColor: '#E8F5E9',
    textColor: '#2E7D32',
    label: '긍정 패턴',
  },
  NEGATIVE: {
    borderColor: '#FF9800',
    bgColor: '#FFF3E0',
    textColor: '#E65100',
    label: '개선 포인트',
  },
  NEUTRAL: {
    borderColor: '#2196F3',
    bgColor: '#E3F2FD',
    textColor: '#1565C0',
    label: '참고 사항',
  },
};

export function PatternCard({ pattern }: PatternCardProps) {
  const typeStyle = PATTERN_TYPE_STYLES[pattern.patternType] || PATTERN_TYPE_STYLES.NEUTRAL;

  return (
    <View style={[styles.card, { borderLeftColor: typeStyle.borderColor }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Typography variant="h3">{pattern.patternIcon || '📊'}</Typography>
        </View>
        <View style={styles.headerText}>
          <View style={[styles.typeBadge, { backgroundColor: typeStyle.bgColor }]}>
            <Typography variant="caption" style={{ color: typeStyle.textColor }}>
              {typeStyle.label}
            </Typography>
          </View>
          <Typography variant="h4" style={styles.title}>
            {pattern.title}
          </Typography>
        </View>
      </View>

      {/* 설명 */}
      <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.description}>
        {pattern.description}
      </Typography>

      {/* 제안 (있을 경우) */}
      {pattern.suggestion && (
        <View style={styles.suggestionContainer}>
          <Typography variant="caption" color={Colors.brand}>
            💡 {pattern.suggestion}
          </Typography>
        </View>
      )}
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
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  title: {
    lineHeight: 22,
  },
  description: {
    lineHeight: 20,
  },
  suggestionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
});
