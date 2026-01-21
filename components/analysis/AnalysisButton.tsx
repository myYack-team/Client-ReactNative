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
  weeklyRemainingCount?: number;
  weeklyLimit?: number;
}

export function AnalysisButton({
  isLoading,
  onPress,
  weeklyRemainingCount,
  weeklyLimit,
}: AnalysisButtonProps) {
  const hasQuotaInfo = weeklyRemainingCount !== undefined && weeklyLimit !== undefined;
  const isQuotaExceeded = hasQuotaInfo && weeklyRemainingCount <= 0;
  const isDisabled = isLoading || isQuotaExceeded;

  const getButtonText = () => {
    if (isLoading) return '분석 중...';
    if (isQuotaExceeded) return '이번 주 분석 횟수를 모두 사용했어요';
    return 'AI 약물 분석 시작하기';
  };

  const getSubText = () => {
    if (isQuotaExceeded) return '다음 주 월요일에 다시 이용해주세요';
    return '복용 중인 약물의 작용 기전과 음식 상호작용을 알아보세요';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isDisabled && styles.containerDisabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {/* AI 아이콘 */}
      <View style={styles.iconContainer}>
        {isLoading ? (
          <ActivityIndicator color={Colors.brand} size="small" />
        ) : (
          <Typography variant="h2">{isQuotaExceeded ? '⏰' : '✨'}</Typography>
        )}
      </View>

      {/* 텍스트 영역 */}
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Typography
            variant="h4"
            color={isDisabled ? Colors.textSecondary : Colors.brand}
            style={styles.titleText}
          >
            {getButtonText()}
          </Typography>
          {/* 쿼터 배지 */}
          {hasQuotaInfo && !isLoading && (
            <View style={[styles.quotaBadge, isQuotaExceeded && styles.quotaBadgeExceeded]}>
              <Typography
                variant="caption"
                color={isQuotaExceeded ? Colors.error : Colors.brand}
                style={styles.quotaText}
              >
                {weeklyRemainingCount}/{weeklyLimit}
              </Typography>
            </View>
          )}
        </View>
        <View style={styles.subtextRow}>
          <Typography variant="caption" color={Colors.textSecondary} style={styles.subtextText}>
            {getSubText()}
          </Typography>
          {/* 화살표를 설명 오른쪽으로 이동 */}
          {!isDisabled && (
            <Typography variant="h4" color={Colors.brand}>
              →
            </Typography>
          )}
        </View>
      </View>
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
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  titleText: {
    flexShrink: 1,
    flexGrow: 0,
  },
  quotaBadge: {
    backgroundColor: Colors.brandLightest,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.brand,
    flexShrink: 0,
    flexGrow: 0,
  },
  quotaBadgeExceeded: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.error,
  },
  quotaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtextText: {
    flex: 1,
  },
});
