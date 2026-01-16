import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Typography, Button } from '../../components/ui';
import { AnalysisLoadingModal, ReportTabView } from '../../components/analysis';
import { Colors } from '../../constants';
import { useAnalysisStore } from '../../stores';
import { AnalysisResult } from '../../types';

// 폴링 설정
const POLLING_INTERVAL = 2000; // 2초
const MAX_POLLING_TIME = 60000; // 60초

export default function AnalysisResultScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const { fetchAnalysisResult, clearCurrentResult } = useAnalysisStore();

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!reportId) {
      setError('분석 ID가 없습니다.');
      setIsLoading(false);
      return;
    }

    const pollResult = async () => {
      try {
        const analysisResult = await fetchAnalysisResult(parseInt(reportId));
        setResult(analysisResult);
        setIsLoading(false);

        // 폴링 중지
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch (err) {
        // 아직 분석 중인 경우 (PENDING/PROCESSING)는 계속 폴링
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed >= MAX_POLLING_TIME) {
          setError('분석 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
          setIsLoading(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
        // 그 외의 경우는 계속 폴링 (분석이 아직 완료되지 않았을 수 있음)
      }
    };

    // 초기 호출
    pollResult();

    // 폴링 시작
    pollingRef.current = setInterval(pollResult, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      clearCurrentResult();
    };
  }, [reportId]);

  const handleGoBack = () => {
    router.back();
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    startTimeRef.current = Date.now();

    const pollResult = async () => {
      try {
        const analysisResult = await fetchAnalysisResult(parseInt(reportId!));
        setResult(analysisResult);
        setIsLoading(false);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      } catch {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed >= MAX_POLLING_TIME) {
          setError('분석 시간이 초과되었습니다.');
          setIsLoading(false);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
        }
      }
    };

    pollResult();
    pollingRef.current = setInterval(pollResult, POLLING_INTERVAL);
  };

  // 로딩 모달 표시 (화면 위에 오버레이)
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AnalysisLoadingModal visible={isLoading} />
      </SafeAreaView>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Typography variant="h1" style={styles.errorEmoji}>😢</Typography>
          <Typography variant="h3" style={styles.errorTitle}>
            분석에 실패했어요
          </Typography>
          <Typography variant="body" color={Colors.textSecondary} style={styles.errorMessage}>
            {error}
          </Typography>
          <View style={styles.errorButtons}>
            <Button
              title="다시 시도"
              variant="primary"
              onPress={handleRetry}
              style={styles.retryButton}
            />
            <Button
              title="돌아가기"
              variant="secondary"
              onPress={handleGoBack}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 결과 화면
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Typography variant="h2" style={styles.headerEmoji}>&#x2728;</Typography>
            <Typography variant="h2">분석 완료</Typography>
          </View>
          <Typography variant="body" color={Colors.textSecondary}>
            {result?.analysisDate ? new Date(result.analysisDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }) : ''} 기준
          </Typography>
        </View>

        {/* 탭 뷰로 콘텐츠 표시 */}
        {result && <ReportTabView result={result} />}

        {/* 면책 조항 */}
        <View style={styles.disclaimer}>
          <Typography variant="caption" color={Colors.textTertiary} style={styles.disclaimerText}>
            AI 분석 결과는 참고용이며, 의료적 판단이나 처방을 대체하지 않습니다.
            복용에 관한 결정은 반드시 의사나 약사와 상담하세요.
          </Typography>
        </View>

        {/* 완료 버튼 */}
        <Button
          title="확인"
          variant="primary"
          size="large"
          onPress={handleGoBack}
          style={styles.completeButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // 에러 화면
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 24,
  },
  errorTitle: {
    marginBottom: 12,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 32,
  },
  errorButtons: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    marginBottom: 0,
  },
  // 결과 화면
  header: {
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerEmoji: {
    fontSize: 28,
  },
  disclaimer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  disclaimerText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  completeButton: {
    marginTop: 24,
  },
});
