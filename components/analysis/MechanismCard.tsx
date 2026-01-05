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
import { MechanismGroup } from '../../types';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MechanismCardProps {
  mechanism: MechanismGroup;
  onPress?: () => void;
}

export function MechanismCard({ mechanism: group, onPress }: MechanismCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
    onPress?.();
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handleToggle}>
      <Card style={styles.card} variant="elevated">
        {/* 카테고리 아이콘 영역 */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Typography variant="h2">{group.categoryIcon}</Typography>
          </View>
          {/* 약물 개수 뱃지 */}
          <View style={styles.countBadge}>
            <Typography variant="caption" color={Colors.white} style={styles.countText}>
              {group.medicationCount}개 약물
            </Typography>
          </View>
        </View>

        {/* 카테고리 태그 */}
        <View style={styles.tagContainer}>
          <View style={styles.tag}>
            <Typography variant="caption" color={Colors.brand}>
              {group.categoryName}
            </Typography>
          </View>
        </View>

        {/* 타이틀 */}
        <Typography variant="h4" style={styles.title}>
          {group.categoryName}
        </Typography>

        {/* 설명 (2줄 제한) */}
        <Typography
          variant="bodySmall"
          color={Colors.textSecondary}
          numberOfLines={isExpanded ? undefined : 2}
          style={styles.description}
        >
          {group.description}
        </Typography>

        {/* 비유 영역 */}
        <View style={styles.analogyContainer}>
          <Typography variant="caption" color={Colors.textSecondary}>
            {group.analogy}
          </Typography>
        </View>

        {/* 확장 시 약물 목록 */}
        {isExpanded && group.medications && group.medications.length > 0 && (
          <View style={styles.medicationList}>
            <Typography variant="caption" color={Colors.textSecondary} style={styles.medicationListTitle}>
              관련 약물
            </Typography>
            {group.medications.map((med, index) => (
              <View key={`${med.name}-${index}`} style={styles.medicationItem}>
                <Typography variant="bodySmall">{med.name}</Typography>
                {med.ingredientName && (
                  <Typography variant="caption" color={Colors.textSecondary}>
                    {med.ingredientName}
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
    backgroundColor: Colors.brandLightest,
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
  countBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.brand,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontWeight: '600',
  },
  tagContainer: {
    marginBottom: 8,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.brandLightest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 12,
    lineHeight: 20,
  },
  analogyContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brandLight,
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
