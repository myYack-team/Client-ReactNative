import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Typography } from '../../components/ui';
import { AnalysisButton, ReportListItem } from '../../components/analysis';
import { Colors } from '../../constants';
import { useAnalysisStore } from '../../stores';

export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const {
    reports,
    isLoading,
    fetchReports,
    isAnalyzing,
  } = useAnalysisStore();

  // 탭 포커스 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      fetchReports().catch((err) => {
        console.error('Failed to load analysis data:', err);
      });
    }, [])
  );

  // 새로고침
  const handleRefresh = async () => {
    await fetchReports();
  };

  // 분석 요청 - 즉시 로딩 페이지로 이동
  const handleAnalysisRequest = () => {
    console.log('[Analysis] Navigating to loading page...');
    // 먼저 로딩 페이지로 이동 (API 호출은 로딩 페이지에서 수행)
    router.push('/analysis/loading');
  };

  // 레포트 상세 이동
  const handleReportPress = (reportId: number) => {
    router.push(`/analysis/${reportId}`);
  };

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
            <Typography variant="h2" style={styles.headerEmoji}>✨</Typography>
            <Typography variant="h2">AI 약물 분석</Typography>
          </View>
          <Typography variant="body" color={Colors.textSecondary}>
            복용 중인 약물을 AI가 분석해드려요
          </Typography>
        </View>

        {/* AI 분석 소개 카드 */}
        <Card style={styles.introCard} variant="elevated">
          <View style={styles.introContent}>
            <View style={styles.introIconContainer}>
              <Typography variant="h1" style={styles.introIcon}>🔬</Typography>
            </View>
            <View style={styles.introTextContainer}>
              <Typography variant="body" style={styles.introTitle}>
                약물 분석이란?
              </Typography>
              <Typography variant="bodySmall" color={Colors.textSecondary}>
                등록된 약물들의 작용 기전을 쉽게 설명해드리고,{'\n'}
                주의해야 할 음식과의 상호작용을 알려드려요.
              </Typography>
            </View>
          </View>
        </Card>

        {/* 분석 요청 버튼 */}
        <AnalysisButton
          onPress={handleAnalysisRequest}
          isLoading={isAnalyzing}
        />

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
            <View style={styles.reportList}>
              {reports.map((report) => (
                <ReportListItem
                  key={report.id}
                  report={report}
                  onPress={() => handleReportPress(report.id)}
                />
              ))}
            </View>
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
  headerEmoji: {
    fontSize: 28,
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
    fontSize: 28,
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
});
