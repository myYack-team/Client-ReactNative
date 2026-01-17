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
import {
  SupplementInteraction,
  SupplementInteractionLevel,
  SUPPLEMENT_INTERACTION_LEVEL_LABELS,
  SUPPLEMENT_INTERACTION_LEVEL_COLORS,
  SUPPLEMENT_TAG_LABELS,
} from '../../types';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SupplementInteractionCardProps {
  interaction: SupplementInteraction;
  onPress?: () => void;
}

// 영양제 태그별 아이콘 매핑
const SUPPLEMENT_ICONS: Record<string, string> = {
  VITAMIN_A: '🥕',
  VITAMIN_B: '🍖',
  VITAMIN_C: '🍊',
  VITAMIN_D: '☀️',
  VITAMIN_E: '🥜',
  OMEGA_3: '🐟',
  MAGNESIUM: '🧲',
  CALCIUM: '🦴',
  IRON: '💪',
  ZINC: '🛡️',
  ARGININE: '🏃',
  COLLAGEN: '✨',
  PROBIOTICS: '🦠',
  LUTEIN: '👁️',
  COENZYME_Q10: '⚡',
  OTHER: '💊',
};

export function SupplementInteractionCard({ interaction, onPress }: SupplementInteractionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
    onPress?.();
  };

  const levelColors = SUPPLEMENT_INTERACTION_LEVEL_COLORS[interaction.interactionLevel] || SUPPLEMENT_INTERACTION_LEVEL_COLORS.GOOD;
  const levelLabel = SUPPLEMENT_INTERACTION_LEVEL_LABELS[interaction.interactionLevel] || '함께 OK';
  const supplementIcon = SUPPLEMENT_ICONS[interaction.supplementTag] || '💊';
  const tagLabel = SUPPLEMENT_TAG_LABELS[interaction.supplementTag] || interaction.supplementTag;

  // 레벨별 배경색 결정
  const getBackgroundColor = () => {
    switch (interaction.interactionLevel) {
      case 'GOOD':
        return '#E8F5E9';
      case 'TIMING':
        return '#FFF3E0';
      case 'CAUTION':
        return '#FFEBEE';
      default:
        return '#E8F5E9';
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handleToggle}>
      <Card style={styles.card} variant="elevated">
        {/* 아이콘 영역 */}
        <View style={[styles.iconContainer, { backgroundColor: getBackgroundColor() }]}>
          <View style={styles.iconBackground}>
            <Typography variant="h2">{supplementIcon}</Typography>
          </View>
          {/* 상호작용 레벨 뱃지 */}
          <View style={[styles.badge, { backgroundColor: levelColors.bg, borderColor: levelColors.text }]}>
            <Typography variant="caption" style={[styles.badgeText, { color: levelColors.text }]}>
              {levelLabel}
            </Typography>
          </View>
        </View>

        {/* 영양제명 */}
        <Typography variant="h4" style={styles.title}>
          {interaction.supplementName}
        </Typography>

        {/* 태그 */}
        <View style={styles.tagContainer}>
          <View style={styles.tag}>
            <Typography variant="caption" color={Colors.textSecondary}>
              {tagLabel}
            </Typography>
          </View>
        </View>

        {/* 요약 이유 */}
        <View style={[styles.reasonContainer, { borderLeftColor: levelColors.text }]}>
          <Typography
            variant="bodySmall"
            color={Colors.textSecondary}
            style={styles.reason}
          >
            {interaction.summaryReason}
          </Typography>
        </View>

        {/* 출처 (있을 경우) */}
        {interaction.source && (
          <View style={styles.sourceContainer}>
            <Typography variant="caption" color={Colors.textTertiary}>
              📚 출처: {interaction.source}
            </Typography>
          </View>
        )}

        {/* 확장 시 상세 정보 */}
        {isExpanded && interaction.details && interaction.details.length > 0 && (
          <View style={styles.detailList}>
            <Typography variant="caption" color={Colors.textSecondary} style={styles.detailListTitle}>
              관련 약물 상세
            </Typography>
            {interaction.details.map((detail, index) => (
              <View key={`${detail.medicationName}-${index}`} style={styles.detailItem}>
                <Typography variant="bodySmall" style={styles.detailMedName}>
                  {detail.medicationName}
                </Typography>
                <Typography variant="caption" color={Colors.textSecondary}>
                  → {detail.reason}
                </Typography>
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
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontWeight: '600',
  },
  title: {
    marginBottom: 4,
  },
  tagContainer: {
    marginBottom: 12,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reasonContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  reason: {
    lineHeight: 20,
  },
  sourceContainer: {
    marginBottom: 8,
  },
  detailList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  detailListTitle: {
    marginBottom: 8,
  },
  detailItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 6,
    marginBottom: 6,
  },
  detailMedName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  expandHint: {
    alignItems: 'center',
    marginTop: 12,
  },
});
