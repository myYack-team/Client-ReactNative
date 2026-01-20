import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../../ui';
import { Colors } from '../../../constants';
import { PatternAnalysis } from '../../../types';
import { ConditionLineChart } from '../ConditionLineChart';
import { PatternCard } from '../PatternCard';
import { InsightCard } from '../InsightCard';

interface TrendTabProps {
  patternAnalysis?: PatternAnalysis;
}

export function TrendTab({ patternAnalysis }: TrendTabProps) {
  // 데이터 없음
  if (!patternAnalysis) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="h2" style={styles.emptyIcon}>📈</Typography>
        <Typography variant="body" color={Colors.textSecondary} style={styles.emptyText}>
          추세 분석 데이터가 없습니다.
        </Typography>
        <Typography variant="caption" color={Colors.textTertiary} style={styles.emptySubText}>
          건강 메모를 기록하면 추세 분석을 제공합니다.
        </Typography>
      </View>
    );
  }

  const {
    adherenceAnalysis,
    patterns,
    insights,
    summary,
    dailyConditions,
    events,
  } = patternAnalysis;

  return (
    <View style={styles.container}>
      {/* 요약 섹션 */}
      {summary && (
        <View style={styles.summarySection}>
          {/* 전반적 평가 */}
          {summary.overallAssessment && (
            <Typography variant="h4" style={styles.headline}>
              {summary.overallAssessment}
            </Typography>
          )}

          {/* 긍정적 포인트 */}
          {summary.positivePoint && (
            <View style={styles.pointItem}>
              <Typography variant="body" color={Colors.primary}>✓</Typography>
              <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.pointText}>
                {summary.positivePoint}
              </Typography>
            </View>
          )}

          {/* 개선 포인트 */}
          {summary.improvementPoint && (
            <View style={[styles.pointItem, { marginTop: 8 }]}>
              <Typography variant="body" color={Colors.warning}>!</Typography>
              <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.pointText}>
                {summary.improvementPoint}
              </Typography>
            </View>
          )}

          {/* 격려 메시지 */}
          {summary.encouragement && (
            <View style={styles.encouragementContainer}>
              <Typography variant="caption" color={Colors.brand} style={styles.encouragementText}>
                💪 {summary.encouragement}
              </Typography>
            </View>
          )}
        </View>
      )}

      {/* 컨디션 라인 차트 */}
      {dailyConditions && dailyConditions.length > 0 && (
        <View style={styles.section}>
          <Typography variant="h4" style={styles.sectionTitle}>
            컨디션 추이
          </Typography>
          <ConditionLineChart
            dailyConditions={dailyConditions}
            events={events}
          />
        </View>
      )}

      {/* 복약 순응도 분석 */}
      {adherenceAnalysis && (
        <View style={styles.section}>
          <Typography variant="h4" style={styles.sectionTitle}>
            복약 순응도
          </Typography>
          <View style={styles.adherenceCard}>
            <View style={styles.adherenceRateContainer}>
              <Typography variant="h1" color={Colors.brand} style={styles.adherenceRate}>
                {Math.round(adherenceAnalysis.overallRate)}%
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                전체 복약률
              </Typography>
            </View>

            <View style={styles.adherenceDetails}>
              {/* 요일 패턴 */}
              {adherenceAnalysis.weekdayPattern && (
                <View style={styles.adherenceItem}>
                  <Typography variant="caption" color={Colors.textTertiary}>
                    요일별
                  </Typography>
                  <Typography variant="bodySmall">
                    {adherenceAnalysis.weekdayPattern.bestDay}요일이 가장 좋아요
                  </Typography>
                </View>
              )}

              {/* 시간대 패턴 */}
              {adherenceAnalysis.timingPattern && (
                <View style={styles.adherenceItem}>
                  <Typography variant="caption" color={Colors.textTertiary}>
                    시간대별
                  </Typography>
                  <Typography variant="bodySmall">
                    {adherenceAnalysis.timingPattern.bestTiming}에 가장 잘 챙겨요
                  </Typography>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 패턴 카드 */}
      {patterns && patterns.length > 0 && (
        <View style={styles.section}>
          <Typography variant="h4" style={styles.sectionTitle}>
            발견된 패턴
          </Typography>
          <View style={styles.cardList}>
            {patterns.map((pattern, index) => (
              <PatternCard key={`pattern-${index}`} pattern={pattern} />
            ))}
          </View>
        </View>
      )}

      {/* 인사이트 카드 */}
      {insights && insights.length > 0 && (
        <View style={styles.section}>
          <Typography variant="h4" style={styles.sectionTitle}>
            맞춤 제안
          </Typography>
          <View style={styles.cardList}>
            {insights.map((insight, index) => (
              <InsightCard key={`insight-${index}`} insight={insight} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: 'center',
  },
  summarySection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.brandLightest,
    borderRadius: 12,
  },
  headline: {
    marginBottom: 12,
    color: Colors.brand,
    lineHeight: 24,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  encouragementContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.brand + '30',
  },
  encouragementText: {
    fontStyle: 'italic',
    lineHeight: 18,
  },
  pointText: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  adherenceCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adherenceRateContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  adherenceRate: {
    fontSize: 48,
    fontWeight: '700',
  },
  adherenceDetails: {
    gap: 12,
  },
  adherenceItem: {
    gap: 2,
  },
  cardList: {
    gap: 12,
  },
});
