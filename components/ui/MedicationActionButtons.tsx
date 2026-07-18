import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';

interface MedicationActionButtonsProps {
  onSkip: () => void;
  onMiss: () => void;
  onTakeNow: () => void;
  disabled?: boolean;
}

export function MedicationActionButtons({
  onSkip,
  onMiss,
  onTakeNow,
  disabled = false,
}: MedicationActionButtonsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.skipButton]}
        onPress={onSkip}
        disabled={disabled}
      >
        <Ionicons name="play-skip-forward" size={18} color={Colors.textLight} />
        <Text style={[styles.buttonText, styles.skipText]}>건너뛰기</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <TouchableOpacity
        style={[styles.button, styles.missButton]}
        onPress={onMiss}
        disabled={disabled}
      >
        <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
        <Text style={[styles.buttonText, styles.missText]}>누락</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <TouchableOpacity
        style={[styles.button, styles.takeButton]}
        onPress={onTakeNow}
        disabled={disabled}
      >
        <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
        <Text style={[styles.buttonText, styles.takeText]}>지금 복용</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  skipButton: {},
  skipText: {
    color: Colors.textLight,
  },
  missButton: {},
  missText: {
    color: '#EF4444',
  },
  takeButton: {},
  takeText: {
    color: Colors.primary,
  },
});
