import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Typography, AiConsentModal } from '../../components/ui';
import {
  AnalysisButton,
  ReportListItem,
  AnalysisProgressCard,
  AnalysisCompletedCard,
} from '../../components/analysis';
import { Colors } from '../../constants';
import { useAnalysisStore } from '../../stores';
import { userService, analysisService } from '../../services';
import { QuotaInfo } from '../../types';

export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const {
    reports,
    isLoading,
    fetchReports,
    isAnalyzing,
    pendingAnalysis,
    completedResult,
    clearCompletedResult,
  } = useAnalysisStore();

  // AI 동의 상태
  const [hasAiConsent, setHasAiConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isCheckingConsent, setIsCheckingConsent] = useState(true);

  // 쿼터 정보
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // AI 동의 확인
  useEffect(() => {
    const checkAiConsent = async () => {
      try {
        const status = await userService.getAiConsentStatus();
        setHasAiConsent(status.aiDataAgreed);
      } catch (error) {
        console.error('AI 동의 상태 확인 실패:', error);
      } finally {
        setIsCheckingConsent(false);
      }
    };

    checkAiConsent();
  }, []);

  // 탭 포커스 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      fetchReports().catch((err) => {
        console.error('Failed to load analysis data:', err);
      });

      // 쿼터 정보 조회
      analysisService.getQuota().then((quota) => {
        setQuotaInfo(quota);
      }).catch((err) => {
        console.error('Failed to load quota info:', err);
      });
    }, [])
  );

  // 새로고침
  const handleRefresh = async () => {
    await fetchReports();
    // 쿼터 정보도 새로고침
    try {
      const quota = await analysisService.getQuota();
      setQuotaInfo(quota);
    } catch (err) {
      console.error('Failed to refresh quota info:', err);
    }
  };

  // AI 동의 처리
  const handleConsent = async () => {
    try {
      await userService.updateAiConsent(true);
      setHasAiConsent(true);
      setShowConsentModal(false);
    } catch (error) {
      console.error('AI 동의 처리 실패:', error);
      Alert.alert('오류', 'AI 동의 처리에 실패했어요.');
    }
  };

  // 분석 요청 - AI 동의 확인 후 로딩 페이지로 이동
  const handleAnalysisRequest = () => {
    // AI 동의 확인
    if (!hasAiConsent) {
      setShowConsentModal(true);
      return;
    }

    console.log('[Analysis] Navigating to loading page...');
    router.push('/analysis/loading');
  };

  // 분석 완료 후 상세 보기
  const handleViewDetails = () => {
    if (completedResult) {
      const reportId = completedResult.reportId;
      clearCompletedResult();
      router.push(`/analysis/${reportId}`);
    }
  };

  // 분석 완료 카드 닫기
  const handleDismissCompleted = () => {
    clearCompletedResult();
    fetchReports();
  };

  // 분석 중인지 확인 (pendingAnalysis가 loading 또는 polling 상태)
  const isAnalyzingInBackground =
    pendingAnalysis &&
    (pendingAnalysis.status === 'loading' || pendingAnalysis.status === 'polling');

  // 레포트 상세 이동
  const handleReportPress = (reportId: number) => {
    router.push(`/analysis/${reportId}`);
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE);
  const paginatedReports = reports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[Colors.brand]}
          />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Image
              source={require('../../assets/icons_iamge_processed/04_AI.png')}
              style={styles.headerIcon}
              accessibilityLabel="AI icon"
              resizeMode="contain"
            />
            <Typography variant="h2">AI 약물 분석</Typography>
          </View>
          <Typography variant="body" color={Colors.textSecondary}>
            복용 중인 약물을 AI가 분석해드려요
          </Typography>
        </View>

        {/* AI 분석 소개 카드 */}
        <Card style={styles.introCard} variant="elevated">
          <View style={styles.introContent}>
            <View style={styles.introTextContainer}>
              <Typography variant="body" style={styles.introTitle}>
                약물 분석이란?
              </Typography>
              <Typography variant="bodySmall" color={Colors.textSecondary}>
                등록된 약물들의 작용 기전을 쉽게 설명해드리고,{'\n'}
                주의해야 할 음식과의 상호작용을 알려드려요.{'\n'}
                마이약을 오래 사용할수록 더 정확한 리포트를 받을 수 있어요.
              </Typography>
            </View>
          </View>
        </Card>

        {/* 분석 진행 중 인라인 카드 */}
        {isAnalyzingInBackground && <AnalysisProgressCard />}

        {/* 분석 완료 인라인 카드 */}
        {completedResult && (
          <AnalysisCompletedCard
            result={completedResult}
            onViewDetails={handleViewDetails}
            onDismiss={handleDismissCompleted}
          />
        )}

        {/* 분석 요청 버튼 - 분석 중이거나 완료 결과가 있으면 숨김 */}
        {!isAnalyzingInBackground && !completedResult && (
          <AnalysisButton
            onPress={handleAnalysisRequest}
            isLoading={isAnalyzing}
            weeklyRemainingCount={quotaInfo?.weeklyRemainingCount}
            weeklyLimit={quotaInfo?.weeklyLimit}
          />
        )}

        {/* 분석 기록 섹션 */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            분석 기록
          </Typography>

          {reports.length === 0 ? (
            <Card style={styles.emptyCard} variant="elevated">
              <Typography variant="body" style={styles.emptyText}>
                아직 분석 기록이 없어요
              </Typography>
              <Typography variant="bodySmall" color={Colors.textSecondary}>
                위 버튼을 눌러 첫 분석을 시작해보세요
              </Typography>
            </Card>
          ) : (
            <>
              <View style={styles.reportList}>
                {paginatedReports.map((report) => (
                  <ReportListItem
                    key={report.id}
                    report={report}
                    onPress={() => handleReportPress(report.id)}
                  />
                ))}
              </View>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <View style={styles.pagination}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <TouchableOpacity
                      key={page}
                      style={[
                        styles.pageButton,
                        currentPage === page && styles.pageButtonActive,
                      ]}
                      onPress={() => setCurrentPage(page)}
                    >
                      <Typography
                        variant="bodySmall"
                        color={currentPage === page ? Colors.white : Colors.textSecondary}
                      >
                        {page}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* 면책 조항 */}
        <View style={styles.disclaimer}>
          <Typography variant="caption" color={Colors.textTertiary} style={styles.disclaimerText}>
            ⚠️ AI 분석 결과는 참고용이며, 의료적 판단이나 처방을 대체하지 않습니다.
            복용에 관한 결정은 반드시 의사나 약사와 상담하세요.
          </Typography>
        </View>

        {/* 개발용 미리보기 버튼 */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => router.push('/analysis/preview')}
          >
            <Typography variant="caption" color={Colors.textSecondary}>
              🔧 목업 미리보기 (개발용)
            </Typography>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* AI 동의 모달 */}
      <AiConsentModal
        visible={showConsentModal}
        onAgree={handleConsent}
        onCancel={() => setShowConsentModal(false)}
      />
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
  header: {
    marginBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerIcon: {
    width: 28,
    height: 28,
  },
  introCard: {
    marginBottom: 20,
    backgroundColor: Colors.brandLightest,
    borderWidth: 1,
    borderColor: Colors.brand,
  },
  introContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  introIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introIcon: {
    width: 36,
    height: 36,
  },
  introTextContainer: {
    flex: 1,
  },
  introTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginBottom: 8,
  },
  reportList: {
    gap: 12,
  },
  disclaimer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  disclaimerText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  previewButton: {
    marginTop: 24,
    alignItems: 'center',
    padding: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButtonActive: {
    backgroundColor: Colors.brand,
  },
});
