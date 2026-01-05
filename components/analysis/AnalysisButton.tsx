import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Typography } from '../ui';
import { Colors, Shadows } from '../../constants';

interface AnalysisButtonProps {
  isLoading: boolean;
  onPress: () => void;
}

export function AnalysisButton({
  isLoading,
  onPress,
}: AnalysisButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isLoading && styles.containerDisabled,
      ]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {/* AI 아이콘 */}
      <View style={styles.iconContainer}>
        {isLoading ? (
          <ActivityIndicator color={Colors.brand} size="small" />
        ) : (
          <Typography variant="h2">✨</Typography>
        )}
      </View>

      {/* 텍스트 영역 */}
      <View style={styles.textContainer}>
        <Typography variant="h4" color={isLoading ? Colors.textSecondary : Colors.brand}>
          {isLoading ? '분석 중...' : 'AI 약물 분석 시작하기'}
        </Typography>
        <Typography variant="caption" color={Colors.textSecondary}>
          복용 중인 약물의 작용 기전과 음식 상호작용을 알아보세요
        </Typography>
      </View>

      {/* 화살표 */}
      {!isLoading && (
        <View style={styles.arrowContainer}>
          <Typography variant="h4" color={Colors.brand}>
            →
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brandLightest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.brandLight,
    ...Shadows.medium,
  },
  containerDisabled: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    ...Shadows.small,
  },
  textContainer: {
    flex: 1,
  },
  arrowContainer: {
    marginLeft: 8,
  },
});
