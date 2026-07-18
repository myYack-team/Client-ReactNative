import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Card, Typography } from '../ui';
import { Colors, Radius } from '../../constants';
import { FoodSuggestion } from '../../types';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FoodSuggestionCardProps {
  suggestion: FoodSuggestion;
  onPress?: () => void;
}

export function FoodSuggestionCard({ suggestion, onPress }: FoodSuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
    onPress?.();
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handleToggle}>
      <Card style={styles.card} variant="elevated">
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.iconTile}>
            <Typography variant="h4">{suggestion.foodIcon}</Typography>
          </View>
          <Typography variant="h4" style={styles.title}>
            {suggestion.foodName}
          </Typography>
          {/* 좋은 궁합 뱃지 */}
          <View style={styles.badge}>
            <Typography variant="caption" color={Colors.success} style={styles.badgeText}>
              좋은 궁합
            </Typography>
          </View>
        </View>

        {/* 추천 이유 */}
        <View style={styles.reasonContainer}>
          <Typography
            variant="bodySmall"
            color={Colors.textSecondary}
            style={styles.reason}
          >
            {suggestion.reason}
          </Typography>
        </View>

        {/* 팁 (있을 경우) */}
        {suggestion.tip && (
          <View style={styles.tipContainer}>
            <Typography variant="caption" color={Colors.textTertiary} style={styles.tipLabel}>
              TIP
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary} style={styles.tipText}>
              {suggestion.tip}
            </Typography>
          </View>
        )}

        {/* 확장 시 관련 약물 목록 */}
        {isExpanded && suggestion.relatedMedications && suggestion.relatedMedications.length > 0 && (
          <View style={styles.medicationList}>
            <Typography variant="caption" color={Colors.textSecondary} style={styles.medicationListTitle}>
              관련 약물
            </Typography>
            {suggestion.relatedMedications.map((med, index) => (
              <View key={`${med.name}-${index}`} style={styles.medicationItem}>
                <Typography variant="bodySmall">{med.name}</Typography>
                {med.detail && (
                  <Typography variant="caption" color={Colors.textSecondary}>
                    → {med.detail}
                  </Typography>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 확장 힌트 */}
        <View style={styles.expandHint}>
          <Typography variant="caption" color={Colors.textTertiary}>
            {isExpanded ? '접기' : '자세히 보기'}
          </Typography>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLightest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: Colors.primaryLightest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  badgeText: {
    fontWeight: '600',
  },
  title: {
    flex: 1,
    lineHeight: 22,
  },
  reasonContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
    marginBottom: 12,
  },
  reason: {
    lineHeight: 20,
  },
  tipContainer: {
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 8,
  },
  tipLabel: {
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  tipText: {
    lineHeight: 18,
  },
  medicationList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  medicationListTitle: {
    marginBottom: 8,
  },
  medicationItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 6,
    marginBottom: 4,
  },
  expandHint: {
    alignItems: 'center',
    marginTop: 12,
  },
});
