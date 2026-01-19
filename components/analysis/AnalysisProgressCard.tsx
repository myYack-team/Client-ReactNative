import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, Typography } from '../ui';
import { Colors } from '../../constants';

interface AnalysisProgressCardProps {
  onCancel?: () => void;
}

// 분석 단계별 메시지
const ANALYSIS_STAGES = [
  '약물 정보 확인 중...',
  '처방전 분석 중...',
  '자료 조사 중...',
  '결과 정리 중...',
];

export function AnalysisProgressCard({ onCancel }: AnalysisProgressCardProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  // 진행률 업데이트
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 0.15, 95));
    }, 100);

    return () => clearInterval(progressInterval);
  }, []);

  // 단계 변경 (2초 간격)
  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % ANALYSIS_STAGES.length);
    }, 2000);

    return () => clearInterval(stageInterval);
  }, []);

  return (
    <Card style={styles.container} variant="elevated">
      <View style={styles.content}>
        {/* 로딩 아이콘 */}
        <View style={styles.iconContainer}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>

        {/* 텍스트 영역 */}
        <View style={styles.textContainer}>
          <Typography variant="h4" style={styles.title}>
            AI가 분석 중이에요
          </Typography>
          <Typography variant="bodySmall" color={Colors.textSecondary}>
            {ANALYSIS_STAGES[currentStage]}
          </Typography>
        </View>
      </View>

      {/* 진행바 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Typography variant="caption" color={Colors.textSecondary} style={styles.progressText}>
          {Math.round(progress)}%
        </Typography>
      </View>

      {/* 안내 문구 */}
      <Typography variant="caption" color={Colors.textTertiary} style={styles.hint}>
        잠시만 기다려주세요. 화면을 이동해도 분석은 계속됩니다.
      </Typography>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: Colors.brandLightest,
    borderWidth: 1,
    borderColor: Colors.brand,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBackground: {
    height: 6,
    backgroundColor: Colors.white,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brand,
    borderRadius: 3,
  },
  progressText: {
    textAlign: 'right',
    marginTop: 4,
  },
  hint: {
    textAlign: 'center',
  },
});
