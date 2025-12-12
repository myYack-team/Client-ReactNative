import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SupplementTag, SUPPLEMENT_TAG_LABELS } from '../../types';

interface SupplementTagBadgeProps {
  tag: SupplementTag;
  size?: 'small' | 'medium';
}

// 태그별 색상 정의
const TAG_COLORS: Record<SupplementTag, string> = {
  VITAMIN_A: '#FF9800',
  VITAMIN_B: '#FFC107',
  VITAMIN_C: '#FF5722',
  VITAMIN_D: '#FFEB3B',
  VITAMIN_E: '#8BC34A',
  OMEGA_3: '#03A9F4',
  MAGNESIUM: '#9C27B0',
  CALCIUM: '#E0E0E0',
  IRON: '#795548',
  ZINC: '#607D8B',
  ARGININE: '#F44336',
  COLLAGEN: '#E91E63',
  PROBIOTICS: '#4CAF50',
  LUTEIN: '#009688',
  COENZYME_Q10: '#673AB7',
  OTHER: '#9E9E9E',
};

// 밝은 배경색에는 어두운 텍스트, 어두운 배경색에는 밝은 텍스트
const LIGHT_BACKGROUND_TAGS: SupplementTag[] = [
  'VITAMIN_D',
  'FFC107',
  'CALCIUM',
] as SupplementTag[];

export function SupplementTagBadge({ tag, size = 'small' }: SupplementTagBadgeProps) {
  const label = SUPPLEMENT_TAG_LABELS[tag];
  const color = TAG_COLORS[tag];
  const isLightBg = ['VITAMIN_D', 'VITAMIN_B', 'CALCIUM'].includes(tag);

  return (
    <View style={[styles.badge, { backgroundColor: color }, size === 'medium' && styles.badgeMedium]}>
      <Text style={[styles.text, size === 'medium' && styles.textMedium, isLightBg && styles.darkText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  textMedium: {
    fontSize: 13,
  },
  darkText: {
    color: '#333333',
  },
});
