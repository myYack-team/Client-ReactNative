import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '../ui';
import { Colors } from '../../constants';

interface ConditionSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const CONDITION_SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function ConditionSlider({ value, onChange }: ConditionSliderProps) {
  return (
    <View style={styles.container}>
      {/* 라벨 */}
      <View style={styles.labelContainer}>
        <View style={styles.labelLeft}>
          <Typography variant="h3" style={styles.emoji}>😫</Typography>
          <Typography variant="caption" color={Colors.textSecondary}>
            최악
          </Typography>
        </View>
        <View style={styles.labelRight}>
          <Typography variant="h3" style={styles.emoji}>😄</Typography>
          <Typography variant="caption" color={Colors.textSecondary}>
            최고
          </Typography>
        </View>
      </View>

      {/* 점수 버튼 */}
      <View style={styles.buttonsContainer}>
        {CONDITION_SCORES.map((score) => {
          const isSelected = value === score;
          return (
            <TouchableOpacity
              key={score}
              style={[
                styles.scoreButton,
                isSelected && styles.scoreButtonSelected,
              ]}
              onPress={() => onChange(score)}
            >
              <Typography
                variant="body"
                color={isSelected ? Colors.white : Colors.textPrimary}
                style={isSelected ? styles.scoreTextSelected : styles.scoreText}
              >
                {score}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 현재 선택된 점수 표시 */}
      <View style={styles.selectedContainer}>
        <Typography variant="bodySmall" color={Colors.textSecondary}>
          오늘의 컨디션:{' '}
        </Typography>
        <Typography variant="body" color={Colors.brand} style={styles.selectedScore}>
          {value}점
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  labelLeft: {
    alignItems: 'flex-start',
  },
  labelRight: {
    alignItems: 'flex-end',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  scoreButton: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 32,
    minWidth: 24,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreButtonSelected: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '400',
  },
  scoreTextSelected: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  selectedScore: {
    fontWeight: '600',
  },
});
