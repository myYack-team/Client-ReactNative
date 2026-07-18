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
import { FoodInteraction, INTERACTION_LEVEL_LABELS, INTERACTION_LEVEL_COLORS } from '../../types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FoodInteractionCardProps {
  interaction: FoodInteraction;
  onPress?: () => void;
}

export function FoodInteractionCard({ interaction, onPress }: FoodInteractionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const levelStyle = INTERACTION_LEVEL_COLORS[interaction.interactionLevel];

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
          <View style={[styles.iconTile, { backgroundColor: levelStyle.bg }]}>
            <Typography variant="h4">{interaction.foodIcon}</Typography>
          </View>
          <View style={styles.headerText}>
            <Typography variant="h4" style={styles.title}>
              {interaction.foodName}
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary}>
              복용 중인 약물 {interaction.affectedMedicationCount}개와 상호작용
            </Typography>
          </View>
          {/* 위험도 뱃지 */}
          <View style={[styles.levelBadge, { backgroundColor: levelStyle.bg }]}>
            <Typography variant="caption" style={[styles.levelText, { color: levelStyle.text }]}>
              {INTERACTION_LEVEL_LABELS[interaction.interactionLevel]}
            </Typography>
          </View>
        </View>

        {/* 요약 이유 */}
        <View style={[styles.reasonContainer, { borderLeftColor: levelStyle.text }]}>
          <Typography variant="bodySmall" color={Colors.textSecondary}>
            "{interaction.summaryReason}"
          </Typography>
        </View>

        {/* 확장 시 상세 목록 */}
        {isExpanded && interaction.details.length > 0 && (
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

        {/* 상세 보기 힌트 */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  levelText: {
    fontWeight: '600',
  },
  title: {
    lineHeight: 22,
  },
  reasonContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
  },
  detailList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
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
  expandHint: {
    alignItems: 'center',
    marginTop: 12,
  },
});
