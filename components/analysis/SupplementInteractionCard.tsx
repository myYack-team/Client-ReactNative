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
  SUPPLEMENT_INTERACTION_LABELS,
  SUPPLEMENT_INTERACTION_COLORS,
} from '../../types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SupplementInteractionCardProps {
  interaction: SupplementInteraction;
  onPress?: () => void;
}

export function SupplementInteractionCard({ interaction, onPress }: SupplementInteractionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const levelStyle = SUPPLEMENT_INTERACTION_COLORS[interaction.interactionLevel];

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
    onPress?.();
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handleToggle}>
      <Card style={styles.card} variant="elevated">
        {/* 영양제 아이콘 영역 - 레벨별 배경색 */}
        <View style={[styles.iconContainer, { backgroundColor: levelStyle.bg }]}>
          <View style={styles.iconBackground}>
            <Typography variant="h2">💊</Typography>
          </View>
          {/* 레벨 뱃지 */}
          <View style={[styles.levelBadge, { backgroundColor: levelStyle.text }]}>
            <Typography variant="caption" color={Colors.white} style={styles.badgeText}>
              {SUPPLEMENT_INTERACTION_LABELS[interaction.interactionLevel]}
            </Typography>
          </View>
        </View>

        {/* 영양제명 + 태그 */}
        <View style={styles.titleRow}>
          <Typography variant="h4" style={styles.title}>
            {interaction.supplementName}
          </Typography>
          <View style={[styles.tagBadge, { backgroundColor: levelStyle.bg }]}>
            <Typography variant="caption" color={levelStyle.text}>
              {interaction.supplementTag}
            </Typography>
          </View>
        </View>

        {/* 요약 이유 */}
        <View style={[styles.reasonContainer, { borderLeftColor: levelStyle.text }]}>
          <Typography variant="bodySmall" color={Colors.textSecondary}>
            "{interaction.summaryReason}"
          </Typography>
        </View>

        {/* 확장 시 상세 정보 */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* 상세 목록 */}
            {interaction.details && interaction.details.length > 0 && (
              <View style={styles.detailList}>
                {interaction.details.map((detail, index) => (
                  <View key={index} style={styles.detailItem}>
                    <Typography variant="bodySmall" style={styles.detailMedName}>
                      {detail.medicationName}
                    </Typography>
                    <Typography variant="caption" color={Colors.textSecondary}>
                      {detail.reason}
                    </Typography>
                  </View>
                ))}
              </View>
            )}

            {/* 출처 */}
            {interaction.source && (
              <View style={styles.sourceContainer}>
                <Typography variant="caption" color={Colors.textTertiary}>
                  {interaction.source}
                </Typography>
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
  levelBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    flex: 1,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reasonContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  detailList: {
    marginBottom: 12,
  },
  detailItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailMedName: {
    fontWeight: '600',
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
