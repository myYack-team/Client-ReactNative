import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Typography } from '../ui';
import { Colors } from '../../constants';
import type { SymptomOption } from '../../constants/Symptoms';

interface SymptomChipProps {
  symptom: SymptomOption;
  selected: boolean;
  onPress: () => void;
}

export function SymptomChip({ symptom, selected, onPress }: SymptomChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && { borderColor: symptom.color, backgroundColor: `${symptom.color}15` },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Image
          source={symptom.icon}
          style={styles.icon}
          resizeMode="contain"
        />
        <Typography
          variant="caption"
          color={selected ? symptom.color : Colors.textSecondary}
          style={[styles.label, selected && { fontWeight: '600' }]}
        >
          {symptom.label}
        </Typography>
      </View>
      {selected && (
        <View style={[styles.checkMark, { backgroundColor: symptom.color }]}>
          <Typography variant="caption" color={Colors.white} style={styles.checkText}>
            V
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    width: 40,
    height: 40,
  },
  label: {
    textAlign: 'center',
    fontSize: 11,
  },
  checkMark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
