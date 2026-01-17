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
import { Colors, Shadows } from '../../constants';
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
        {/* 아이콘 영역 */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Typography variant="h2">{suggestion.foodIcon}</Typography>
          </View>
          {/* 좋은 궁합 뱃지 */}
          <View style={styles.badge}>
            <Typography variant="caption" color={Colors.success} style={styles.badgeText}>
              좋은 궁합
            </Typography>
          </View>
        </View>

        {/* 음식명 */}
        <Typography variant="h4" style={styles.title}>
          {suggestion.foodName}
        </Typography>

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
            <Typography variant="caption" color={Colors.success}>
              💡 {suggestion.tip}
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
  iconContainer: {
    height: 80,
    backgroundColor: '#E8F5E9', // 연한 초록 배경
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontWeight: '600',
  },
  title: {
    marginBottom: 8,
  },
  reasonContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
    marginBottom: 12,
  },
  reason: {
    lineHeight: 20,
  },
  tipContainer: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
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
