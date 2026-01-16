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
        {/* 음식 아이콘 영역 - 초록색 배경 */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Typography variant="h2">{suggestion.foodIcon}</Typography>
          </View>
          {/* 좋은 궁합 뱃지 */}
          <View style={styles.goodBadge}>
            <Typography variant="caption" color={Colors.white} style={styles.badgeText}>
              좋은 궁합
            </Typography>
          </View>
        </View>

        {/* 음식명 */}
        <Typography variant="h4" style={styles.title}>
          {suggestion.foodIcon} {suggestion.foodName}
        </Typography>

        {/* 이유 설명 */}
        <View style={styles.reasonContainer}>
          <Typography variant="bodySmall" color={Colors.textSecondary}>
            "{suggestion.reason}"
          </Typography>
        </View>

        {/* 확장 시 상세 정보 */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* 팁이 있는 경우 */}
            {suggestion.tip && (
              <View style={styles.tipContainer}>
                <Typography variant="caption" color={Colors.primary} style={styles.tipLabel}>
                  TIP
                </Typography>
                <Typography variant="bodySmall" color={Colors.textSecondary}>
                  {suggestion.tip}
                </Typography>
              </View>
            )}

            {/* 관련 약물 */}
            {suggestion.relatedMedications && suggestion.relatedMedications.length > 0 && (
              <View style={styles.medicationList}>
                <Typography variant="caption" color={Colors.textSecondary} style={styles.medicationListTitle}>
                  관련 약물
                </Typography>
                {suggestion.relatedMedications.map((med, index) => (
                  <View key={`${med.name}-${index}`} style={styles.medicationItem}>
                    <Typography variant="bodySmall">{med.name}</Typography>
                    {med.detail && (
                      <Typography variant="caption" color={Colors.textSecondary}>
                        {med.detail}
                      </Typography>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 확장 힌트 */}
        <View style={styles.expandHint}>
          <Typography variant="caption" color={Colors.textTertiary}>
            {isExpanded ? '접기' : '상세 보기 >'}
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
    backgroundColor: Colors.primaryLightest,
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
  goodBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontWeight: '600',
  },
  title: {
    marginBottom: 4,
  },
  reasonContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  tipContainer: {
    backgroundColor: Colors.primaryLightest,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tipLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  medicationList: {
    marginTop: 8,
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
