import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Typography, Button, Card } from '../../components/ui';
import { ReportTabView, AnalysisLoadingModal } from '../../components/analysis';
import { Colors } from '../../constants';
import { useAnalysisStore } from '../../stores';
import { AnalysisResultExtended } from '../../types';

// 폴링 설정
const POLLING_INTERVAL = 2000; // 2초
const MAX_POLLING_TIME = 60000; // 60초

export default function AnalysisResultScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const { fetchAnalysisResult, clearCurrentResult } = useAnalysisStore();

  const [result, setResult] = useState<AnalysisResultExtended | null>(null);
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
        setResult(analysisResult as AnalysisResultExtended);
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
        setResult(analysisResult as AnalysisResultExtended);
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

  const handleNavigateToSupplementRegister = () => {
    router.push('/supplement/search');
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

  // 분석 결과 카운트 계산
  const mechanismCount = result?.mechanismGroups?.length || 0;
  const foodInteractionCount = result?.foodInteractions?.length || 0;
  const foodSuggestionCount = result?.foodSuggestions?.length || 0;
  const supplementCount = result?.supplementInteractions?.length || 0;
  const tipsCount = result?.lifestyleTips?.length || 0;

  // 결과가 없는 경우 체크
  const hasNoResults = mechanismCount === 0 && foodInteractionCount === 0 &&
    foodSuggestionCount === 0 && supplementCount === 0 && tipsCount === 0;

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
            <Typography variant="h2" style={styles.headerEmoji}>✨</Typography>
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

        {/* 요약 카드 */}
        <Card style={styles.summaryCard} variant="elevated">
          <View style={styles.summaryContent}>
            <Typography variant="h2" style={styles.summaryEmoji}>📊</Typography>
            <View style={styles.summaryTextContainer}>
              <Typography variant="h4">분석 요약</Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                기전 {mechanismCount}개 · 음식 {foodInteractionCount + foodSuggestionCount}개 · 영양제 {supplementCount}개 · 팁 {tipsCount}개
              </Typography>
            </View>
          </View>
        </Card>

        {/* 결과가 없는 경우 */}
        {hasNoResults ? (
          <View style={styles.emptyContainer}>
            <Typography variant="h1" style={styles.emptyEmoji}>🔍</Typography>
            <Typography variant="h3" style={styles.emptyTitle}>
              분석 결과가 없어요
            </Typography>
            <Typography variant="body" color={Colors.textSecondary}>
              등록된 약물이 없거나 분석할 정보가 부족해요
            </Typography>
          </View>
        ) : (
          /* 탭 뷰 */
          <ReportTabView
            mechanismGroups={result?.mechanismGroups || []}
            foodInteractions={result?.foodInteractions || []}
            foodSuggestions={result?.foodSuggestions || []}
            supplementInteractions={result?.supplementInteractions || []}
            lifestyleTips={result?.lifestyleTips || []}
            onNavigateToSupplementRegister={handleNavigateToSupplementRegister}
          />
        )}

        {/* 면책 조항 */}
        <View style={styles.disclaimer}>
          <Typography variant="caption" color={Colors.textTertiary} style={styles.disclaimerText}>
            ⚠️ AI 분석 결과는 참고용이며, 의료적 판단이나 처방을 대체하지 않습니다.
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
    marginBottom: 16,
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
  // 요약 카드
  summaryCard: {
    marginBottom: 16,
    backgroundColor: Colors.brandLightest,
    borderWidth: 1,
    borderColor: Colors.brand,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  summaryEmoji: {
    fontSize: 40,
  },
  summaryTextContainer: {
    flex: 1,
  },
  // 빈 결과
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
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
