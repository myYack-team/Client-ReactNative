import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DrugType, DRUG_TYPE_LABELS, DRUG_TYPE_COLORS } from '../../types';

interface DrugTypeBadgeProps {
  type: DrugType;
  size?: 'small' | 'medium';
}

export function DrugTypeBadge({ type, size = 'small' }: DrugTypeBadgeProps) {
  const label = DRUG_TYPE_LABELS[type];
  const color = DRUG_TYPE_COLORS[type];

  return (
    <View style={[styles.badge, { backgroundColor: color }, size === 'medium' && styles.badgeMedium]}>
      <Text style={[styles.text, size === 'medium' && styles.textMedium]}>{label}</Text>
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
});
