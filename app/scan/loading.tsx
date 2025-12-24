import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Typography, Button } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';

// 단계별 메시지 정의
const PROGRESS_STAGES = [
  { threshold: 0, message: '📤 이미지 업로드 중...', subMessage: '처방전을 서버로 전송하고 있어요' },
  { threshold: 20, message: '🔍 처방전 인식 중...', subMessage: 'AI가 처방전을 분석하고 있어요' },
  { threshold: 45, message: '💊 약 정보 추출 중...', subMessage: '약 이름과 복용법을 찾고 있어요' },
  { threshold: 70, message: '✨ 데이터 정리 중...', subMessage: '추출된 정보를 정리하고 있어요' },
  { threshold: 90, message: '⏳ 거의 완료...', subMessage: '잠시만 기다려주세요' },
];

// 현재 진행률에 해당하는 메시지 반환
const getStageMessage = (progress: number) => {
  for (let i = PROGRESS_STAGES.length - 1; i >= 0; i--) {
    if (progress >= PROGRESS_STAGES[i].threshold) {
      return PROGRESS_STAGES[i];
    }
  }
  return PROGRESS_STAGES[0];
};

export default function LoadingScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { scanPrescription, clearScanError } = useMedicationStore();
  const hasStartedScan = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // 가짜 진행률 업데이트 (90%까지)
  useEffect(() => {
    if (isComplete || error) return;

    const intervals = [
      { delay: 300, target: 15 },
      { delay: 1000, target: 25 },
      { delay: 2000, target: 40 },
      { delay: 3500, target: 55 },
      { delay: 5000, target: 70 },
      { delay: 7000, target: 80 },
      { delay: 9000, target: 88 },
    ];

    const timers = intervals.map(({ delay, target }) =>
      setTimeout(() => {
        if (!isComplete && !error) {
          setProgress(target);
          Animated.timing(progressAnim, {
            toValue: target,
            duration: 400,
            useNativeDriver: false,
          }).start();
        }
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [isComplete, error]);

  const performScan = async () => {
    if (!uri) return;

    setError(null);
    clearScanError();

    try {
      const result = await scanPrescription(uri);

      // 완료 시 100%로 애니메이션
      setIsComplete(true);
      setProgress(100);
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // 짧은 딜레이 후 결과 화면으로 이동
      setTimeout(() => {
        if (result.confidence === 'low') {
          Alert.alert(
            '인식 실패',
            '처방전을 인식하지 못했어요.\n다시 촬영해주세요.',
            [{ text: '확인', onPress: () => router.back() }]
          );
        } else {
          router.replace('/scan/result');
        }
      }, 500);
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || '스캔에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (!uri || hasStartedScan.current) return;
    hasStartedScan.current = true;
    performScan();
  }, [uri]);

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setIsComplete(false);
    progressAnim.setValue(0);
    hasStartedScan.current = false;
    performScan();
  };

  const handleGoBack = () => {
    clearScanError();
    router.back();
  };

  // 에러 화면
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <Typography variant="h3" style={styles.errorTitle}>
              ⚠️ 오류 발생
            </Typography>
            <Typography variant="body" style={styles.errorMessage}>
              {error}
            </Typography>
            <View style={styles.errorButtons}>
              <Button
                title="다시 시도"
                onPress={handleRetry}
                style={styles.retryButton}
              />
              <Button
                title="돌아가기"
                variant="outline"
                onPress={handleGoBack}
                style={styles.backButton}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentStage = getStageMessage(progress);
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 진행률 표시 */}
        <View style={styles.progressContainer}>
          <Typography variant="h1" style={styles.percentText}>
            {Math.round(progress)}%
          </Typography>
        </View>

        {/* 진행률 바 */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: progressWidth },
              ]}
            />
          </View>
        </View>

        {/* 단계별 메시지 */}
        <Typography variant="h3" style={styles.stageMessage}>
          {currentStage.message}
        </Typography>
        <Typography variant="body" color={Colors.textSecondary} style={styles.subMessage}>
          {currentStage.subMessage}
        </Typography>

        {/* 취소 버튼 */}
        <Button
          title="취소"
          variant="ghost"
          onPress={handleGoBack}
          style={styles.cancelButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  progressContainer: {
    marginBottom: 32,
    paddingVertical: 8,
    alignItems: 'center',
  },
  percentText: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 68,
    includeFontPadding: false,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  stageMessage: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subMessage: {
    textAlign: 'center',
    lineHeight: 22,
  },
  cancelButton: {
    marginTop: 48,
  },
  errorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  errorTitle: {
    marginBottom: 8,
  },
  errorMessage: {
    textAlign: 'center',
    marginVertical: 16,
    color: Colors.textSecondary,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  retryButton: {
    flex: 1,
  },
  backButton: {
    flex: 1,
  },
});
