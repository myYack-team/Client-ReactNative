import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Typography, Button } from '../ui';
import { Colors } from '../../constants';
import { AnalysisResultExtended } from '../../types';

interface AnalysisCompletedCardProps {
  result: AnalysisResultExtended;
  onViewDetails: () => void;
  onDismiss: () => void;
}

export function AnalysisCompletedCard({
  result,
  onViewDetails,
  onDismiss,
}: AnalysisCompletedCardProps) {
  // 분석 결과 카운트 계산
  const mechanismCount = result.mechanismGroups?.length || 0;
  const foodInteractionCount = result.foodInteractions?.length || 0;
  const foodSuggestionCount = result.foodSuggestions?.length || 0;
  const supplementCount = result.supplementInteractions?.length || 0;
  const tipsCount = result.lifestyleTips?.length || 0;

  const totalFoodCount = foodInteractionCount + foodSuggestionCount;

  return (
    <Card style={styles.container} variant="elevated">
      {/* 닫기 버튼 */}
      <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
        <Typography variant="body" color={Colors.textSecondary}>
          X
        </Typography>
      </TouchableOpacity>

      {/* 완료 아이콘 & 제목 */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Typography variant="h1" style={styles.icon}>
            ✅
          </Typography>
        </View>
        <View style={styles.headerText}>
          <Typography variant="h4" style={styles.title}>
            분석이 완료되었어요!
          </Typography>
          <Typography variant="bodySmall" color={Colors.textSecondary}>
            AI가 복용 중인 약물을 분석했어요
          </Typography>
        </View>
      </View>

      {/* 분석 결과 요약 */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Typography variant="caption" color={Colors.textSecondary}>
            기전
          </Typography>
          <Typography variant="h4" color={Colors.brand}>
            {mechanismCount}개
          </Typography>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Typography variant="caption" color={Colors.textSecondary}>
            음식
          </Typography>
          <Typography variant="h4" color={Colors.brand}>
            {totalFoodCount}개
          </Typography>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Typography variant="caption" color={Colors.textSecondary}>
            영양제
          </Typography>
          <Typography variant="h4" color={Colors.brand}>
            {supplementCount}개
          </Typography>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Typography variant="caption" color={Colors.textSecondary}>
            생활 팁
          </Typography>
          <Typography variant="h4" color={Colors.brand}>
            {tipsCount}개
          </Typography>
        </View>
      </View>

      {/* 자세히 보기 버튼 */}
      <Button
        title="자세히 보기"
        variant="primary"
        onPress={onViewDetails}
        style={styles.button}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: Colors.primaryLightest,
    borderWidth: 1,
    borderColor: Colors.primary,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingRight: 32,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    marginBottom: 2,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  button: {
    marginTop: 0,
  },
});
