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
import { LifestyleTip } from '../../types';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface LifestyleTipCardProps {
  tip: LifestyleTip;
  onPress?: () => void;
}

export function LifestyleTipCard({ tip, onPress }: LifestyleTipCardProps) {
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
            <Typography variant="h2">{tip.categoryIcon}</Typography>
          </View>
          {/* 카테고리 뱃지 */}
          <View style={styles.badge}>
            <Typography variant="caption" color={Colors.info} style={styles.badgeText}>
              {tip.categoryLabel}
            </Typography>
          </View>
        </View>

        {/* 팁 제목 */}
        <Typography variant="h4" style={styles.title}>
          {tip.title}
        </Typography>

        {/* 팁 내용 */}
        <View style={styles.tipContainer}>
          <Typography
            variant="bodySmall"
            color={Colors.textSecondary}
            style={styles.tipContent}
          >
            {tip.tip}
          </Typography>
        </View>

        {/* 출처 (필수) */}
        <View style={styles.sourceContainer}>
          <Typography variant="caption" color={Colors.textTertiary}>
            📚 출처: {tip.source}
          </Typography>
        </View>

        {/* 확장 시 상세 설명 및 관련 약물 */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* 상세 설명 */}
            {tip.detailedExplanation && (
              <View style={styles.detailedContainer}>
                <Typography variant="caption" color={Colors.textSecondary} style={styles.detailedTitle}>
                  상세 설명
                </Typography>
                <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.detailedText}>
                  {tip.detailedExplanation}
                </Typography>
              </View>
            )}

            {/* 관련 약물 */}
            {tip.relatedMedications && tip.relatedMedications.length > 0 && (
              <View style={styles.medicationList}>
                <Typography variant="caption" color={Colors.textSecondary} style={styles.medicationListTitle}>
                  관련 약물
                </Typography>
                {tip.relatedMedications.map((med, index) => (
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
    backgroundColor: '#E3F2FD', // 연한 파란 배경
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
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: Colors.info,
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
  tipContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.info,
    marginBottom: 8,
  },
  tipContent: {
    lineHeight: 20,
  },
  sourceContainer: {
    marginBottom: 8,
  },
  expandedContent: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  detailedContainer: {
    marginBottom: 16,
  },
  detailedTitle: {
    marginBottom: 6,
    fontWeight: '500',
  },
  detailedText: {
    lineHeight: 20,
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
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
