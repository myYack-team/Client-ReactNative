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
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.iconTile}>
            <Typography variant="h4">{group.categoryIcon}</Typography>
          </View>
          <View style={styles.headerText}>
            <Typography variant="h4" style={styles.title}>
              {group.categoryName}
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary}>
              복용 중인 약물 {group.medicationCount}개
            </Typography>
          </View>
        </View>

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
    backgroundColor: Colors.brandLightest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    lineHeight: 22,
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
