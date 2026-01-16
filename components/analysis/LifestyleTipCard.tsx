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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface LifestyleTipCardProps {
  tip: LifestyleTip;
  onPress?: () => void;
}

// 하늘색 배경 색상
const SKY_BLUE_BG = '#E3F2FD';
const SKY_BLUE_TEXT = '#1565C0';

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
        {/* 카테고리 아이콘 영역 - 하늘색 배경 */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Typography variant="h2">{tip.categoryIcon}</Typography>
          </View>
          {/* 카테고리 뱃지 */}
          <View style={styles.categoryBadge}>
            <Typography variant="caption" color={Colors.white} style={styles.badgeText}>
              {tip.categoryLabel}
            </Typography>
          </View>
        </View>

        {/* 제목 */}
        <Typography variant="h4" style={styles.title}>
          {tip.categoryIcon} {tip.title}
        </Typography>

        {/* 팁 내용 */}
        <View style={styles.tipContainer}>
          <Typography
            variant="bodySmall"
            color={Colors.textSecondary}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {tip.tip}
          </Typography>
        </View>

        {/* 확장 시 상세 정보 */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* 상세 설명 */}
            {tip.detailedExplanation && (
              <View style={styles.detailedExplanation}>
                <Typography variant="bodySmall" color={Colors.textSecondary}>
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
                        {med.detail}
                      </Typography>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* 출처 - 필수 표시 */}
            <View style={styles.sourceContainer}>
              <Typography variant="caption" color={Colors.textTertiary}>
                {tip.source}
              </Typography>
            </View>
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
    backgroundColor: SKY_BLUE_BG,
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
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: SKY_BLUE_TEXT,
    paddingHorizontal: 10,
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
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: SKY_BLUE_TEXT,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  detailedExplanation: {
    backgroundColor: SKY_BLUE_BG,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  medicationList: {
    marginBottom: 12,
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
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandHint: {
    alignItems: 'center',
    marginTop: 12,
  },
});
