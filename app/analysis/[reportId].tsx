import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Typography, Button } from '../../components/ui';
import { ReportTabView } from '../../components/analysis';
import { Colors } from '../../constants';
import { useAnalysisStore } from '../../stores';
import { AnalysisResultExtended } from '../../types';
import { analysisService } from '../../services';

export default function ReportDetailScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const { deleteReport } = useAnalysisStore();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);

  const [result, setResult] = useState<AnalysisResultExtended | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    if (!reportId) {
      setError('레포트 ID가 없습니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await analysisService.getAnalysisResult(parseInt(reportId));
      setResult(data as AnalysisResultExtended);

      if (data) {
        const mCount = data.mechanismGroups?.length || 0;
        const fCount = (data.foodInteractions?.length || 0) + (data.foodSuggestions?.length || 0);
        const tCount = data.lifestyleTips?.length || 0;
        const trend = !!data.patternAnalysis;
        const dateStr = data.analysisDate
          ? new Date(data.analysisDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
          : '';
        const summaryStr = `기전 ${mCount}개 · 음식 ${fCount}개 · 팁 ${tCount}개${trend ? ' · 추세 분석' : ''}`;

        navigation.setOptions({
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <Typography variant="bodySmall" style={styles.headerTitleDate}>{dateStr}</Typography>
              <Typography variant="caption" color={Colors.textSecondary} numberOfLines={1}>{summaryStr}</Typography>
            </View>
          ),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '레포트를 불러오는데 실패했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const handleDelete = () => {
    Alert.alert(
      '레포트 삭제',
      '이 분석 레포트를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReport(parseInt(reportId!));
              router.back();
            } catch (err) {
              Alert.alert('오류', '레포트 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  // 로딩 화면
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Typography variant="body" color={Colors.textSecondary}>
            불러오는 중...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Typography variant="h1" style={styles.errorEmoji}>😢</Typography>
          <Typography variant="h3" style={styles.errorTitle}>
            레포트를 불러올 수 없어요
          </Typography>
          <Typography variant="body" color={Colors.textSecondary} style={styles.errorMessage}>
            {error}
          </Typography>
          <Button
            title="다시 시도"
            variant="primary"
            onPress={loadReport}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadReport}
            colors={[Colors.brand]}
          />
        }
      >
        {/* 탭 뷰 */}
        <ReportTabView
          mechanismGroups={result?.mechanismGroups || []}
          foodInteractions={result?.foodInteractions || []}
          foodSuggestions={result?.foodSuggestions || []}
          lifestyleTips={result?.lifestyleTips || []}
          patternAnalysis={result?.patternAnalysis}
          scrollViewRef={scrollViewRef}
        />

        {/* 면책 조항 */}
        <View style={styles.disclaimer}>
          <Typography variant="caption" color={Colors.textTertiary} style={styles.disclaimerLabel}>
            안내
          </Typography>
          <Typography variant="caption" color={Colors.textTertiary} style={styles.disclaimerText}>
            AI 분석 결과는 참고용이며, 의료적 판단이나 처방을 대체하지 않습니다.
            복용에 관한 결정은 반드시 의사나 약사와 상담하세요.
          </Typography>
        </View>

        {/* 삭제 버튼 */}
        <Button
          title="이 레포트 삭제"
          variant="secondary"
          onPress={handleDelete}
          style={styles.deleteButton}
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
  // 로딩
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 에러
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
  // 헤더 타이틀
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitleDate: {
    fontWeight: '600',
  },
  // 면책 조항
  disclaimer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disclaimerLabel: {
    fontWeight: '700',
    marginBottom: 4,
  },
  disclaimerText: {
    textAlign: 'left',
    lineHeight: 18,
  },
  deleteButton: {
    marginTop: 24,
  },
});
