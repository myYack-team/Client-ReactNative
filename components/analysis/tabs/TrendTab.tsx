import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, LayoutChangeEvent, Dimensions } from 'react-native';
import { Typography } from '../../ui';
import { Colors, Radius } from '../../../constants';
import { PatternAnalysis, SYMPTOM_SEVERITY_COLORS, SymptomSeverity } from '../../../types';
import { ConditionLineChart } from '../ConditionLineChart';
import { PatternCard } from '../PatternCard';

interface TrendTabProps {
  patternAnalysis?: PatternAnalysis;
  scrollViewRef?: React.RefObject<ScrollView>;  // 부모 ScrollView ref
}

export function TrendTab({ patternAnalysis, scrollViewRef }: TrendTabProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [highlightedEventDate, setHighlightedEventDate] = useState<string | null>(null);
  const eventSectionRef = useRef<View>(null);
  const [eventSectionY, setEventSectionY] = useState<number>(0);
  const graphSectionY = useRef<number>(0);
  const graphSectionHeight = useRef<number>(0);

  // Helper function to find graph index by date
  const findIndexByDate = (date?: string): number => {
    if (!date || !patternAnalysis?.dailyConditions || patternAnalysis.dailyConditions.length === 0) return -1;
    return patternAnalysis.dailyConditions.findIndex(d => d.date === date);
  };

  // 이벤트 라벨 클릭 시 해당 이벤트로 스크롤
  const handleEventLabelPress = (eventDate: string) => {
    setHighlightedEventDate(eventDate);
    // 스크롤 to 주요 이벤트 섹션
    if (scrollViewRef?.current && eventSectionY > 0) {
      scrollViewRef.current.scrollTo({ y: eventSectionY - 20, animated: true });
    }
    // 3초 후 하이라이트 제거
    setTimeout(() => setHighlightedEventDate(null), 3000);
  };

  // 그래프 섹션 위치 측정
  const onGraphSectionLayout = (event: LayoutChangeEvent) => {
    graphSectionY.current = event.nativeEvent.layout.y;
    graphSectionHeight.current = event.nativeEvent.layout.height;
  };

  // 그래프를 화면 중앙으로 스크롤 (새 선택 시에만 호출)
  const scrollToGraphCenter = () => {
    if (scrollViewRef?.current && graphSectionHeight.current > 0) {
      const screenHeight = Dimensions.get('window').height;
      const scrollY = graphSectionY.current - (screenHeight / 2) + (graphSectionHeight.current / 2);
      scrollViewRef.current.scrollTo({ y: Math.max(0, scrollY), animated: true });
    }
  };

  // 이벤트 섹션 위치 측정
  const onEventSectionLayout = (event: LayoutChangeEvent) => {
    setEventSectionY(event.nativeEvent.layout.y);
  };
  // 데이터 없음
  if (!patternAnalysis) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="h2" style={styles.emptyIcon}>📈</Typography>
        <Typography variant="body" color={Colors.textSecondary} style={styles.emptyText}>
          리포트 데이터가 없습니다.
        </Typography>
        <Typography variant="caption" color={Colors.textTertiary} style={styles.emptySubText}>
          건강 메모를 기록하면 리포트를 제공합니다.
        </Typography>
      </View>
    );
  }

  const {
    adherenceAnalysis,
    patterns,
    summary,
    dailyConditions,
    events,
    symptomClusters,
  } = patternAnalysis;

  // suggestion이 있는 클러스터만 필터링
  const clustersWithSuggestions = symptomClusters?.filter(c => c.suggestion) ?? [];

  return (
    <View style={styles.container}>
      {/* 시뮬레이션 데이터 기반 분석 배너 */}
      {patternAnalysis?.isPreview && (
        <View style={styles.previewBanner}>
          <Typography variant="bodySmall" color={Colors.brand}>
            📊 시뮬레이션 데이터 기반 분석입니다
          </Typography>
        </View>
      )}

      {/* 컨디션 라인 차트 */}
      {dailyConditions && dailyConditions.length > 0 && (
        <View style={styles.section} onLayout={onGraphSectionLayout}>
          <Typography variant="h4" style={styles.sectionTitle}>
            복약-컨디션 그래프
          </Typography>
          <ConditionLineChart
            dailyConditions={dailyConditions}
            events={events}
            selectedIndex={selectedIndex}
            onDataPointPress={(index) => {
              // 같은 포인트 재탭 시 토글
              setSelectedIndex(prev => prev === index ? null : index);
            }}
            onEventLabelPress={handleEventLabelPress}
          />
        </View>
      )}


      {/* 주요 이벤트 */}
      {events && events.length > 0 && (
        <View style={styles.section} ref={eventSectionRef} onLayout={onEventSectionLayout}>
          <Typography variant="h4" style={styles.sectionTitle}>
            주요 이벤트
          </Typography>
          <View style={styles.eventList}>
            {events.map((event, index) => {
              const eventIndex = findIndexByDate(event.date);
              const isSelected = selectedIndex === eventIndex;
              const isHighlighted = highlightedEventDate === event.date;

              return (
                <View key={`event-${index}`}>
                  <TouchableOpacity
                    style={[
                      styles.eventItem,
                      isSelected && styles.eventItemSelected,
                      isHighlighted && styles.eventItemHighlighted,
                    ]}
                    onPress={() => {
                      if (eventIndex >= 0) {
                        const isDeselecting = selectedIndex === eventIndex;
                        setSelectedIndex(prev => prev === eventIndex ? null : eventIndex);
                        if (!isDeselecting) {
                          scrollToGraphCenter();
                        }
                      }
                    }}
                  >
                    <Typography variant="caption" color={Colors.textTertiary} style={styles.eventDate}>
                      {event.date}
                    </Typography>
                    <View style={[styles.eventColorBar, isSelected && styles.eventColorBarSelected]} />
                    <Typography variant="bodySmall" style={styles.eventTitle}>
                      {event.title}
                    </Typography>
                  </TouchableOpacity>
                  {index < events.length - 1 && <View style={styles.eventDivider} />}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* AI 분석 */}
      {clustersWithSuggestions.length > 0 && (
        <View style={styles.section}>
          <Typography variant="h4" style={styles.sectionTitle}>
            AI 분석
          </Typography>
          <View style={styles.aiAnalysisList}>
            {clustersWithSuggestions.map((cluster, index) => (
              <View
                key={`ai-cluster-${index}`}
                style={[
                  styles.aiAnalysisCard,
                  { borderLeftColor: (SYMPTOM_SEVERITY_COLORS[cluster.severity as SymptomSeverity] ?? SYMPTOM_SEVERITY_COLORS.LOW).text },
                ]}
              >
                <View style={styles.aiAnalysisHeader}>
                  <Typography variant="bodySmall" color={Colors.textPrimary} style={styles.aiClusterName}>
                    {cluster.clusterName}
                  </Typography>
                  <View style={[
                    styles.severityBadge,
                    { backgroundColor: (SYMPTOM_SEVERITY_COLORS[cluster.severity as SymptomSeverity] ?? SYMPTOM_SEVERITY_COLORS.LOW).bg },
                  ]}>
                    <Typography
                      variant="caption"
                      color={(SYMPTOM_SEVERITY_COLORS[cluster.severity as SymptomSeverity] ?? SYMPTOM_SEVERITY_COLORS.LOW).text}
                      style={styles.severityText}
                    >
                      {cluster.severity === 'HIGH' ? '높음' : cluster.severity === 'MEDIUM' ? '보통' : '낮음'}
                    </Typography>
                  </View>
                </View>
                <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.aiSuggestionText}>
                  {cluster.suggestion}
                </Typography>
              </View>
            ))}
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

      {/* 복약 달성률 분석 */}
      {adherenceAnalysis && (
        <View style={styles.section}>
          <Typography variant="h4" style={styles.sectionTitle}>
            복약 달성률
          </Typography>
          <View style={styles.adherenceCard}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.round(adherenceAnalysis.overallRate)}%` }]} />
              </View>
              <Typography variant="h3" color={Colors.brand}>
                {Math.round(adherenceAnalysis.overallRate)}%
              </Typography>
            </View>

            {/* Combined Patterns */}
            <View style={styles.patternGrid}>
              {/* 요일 패턴 */}
              {adherenceAnalysis.weekdayPattern && (
                <View style={styles.patternItem}>
                  <Typography variant="body" color={Colors.primary}>✓</Typography>
                  <Typography variant="bodySmall" style={{ flex: 1 }}>
                    {adherenceAnalysis.weekdayPattern.bestDay}이 가장 좋아요
                  </Typography>
                  {adherenceAnalysis.weekdayPattern.worstDay && (
                    <>
                      <Typography variant="body" color={Colors.warning}>!</Typography>
                      <Typography variant="bodySmall" style={{ flex: 1 }}>
                        {adherenceAnalysis.weekdayPattern.worstDay}을 조심하세요
                      </Typography>
                    </>
                  )}
                </View>
              )}

              {/* 시간대 패턴 */}
              {adherenceAnalysis.timingPattern && (
                <View style={styles.patternItem}>
                  <Typography variant="body" color={Colors.primary}>✓</Typography>
                  <Typography variant="bodySmall" style={{ flex: 1 }}>
                    {adherenceAnalysis.timingPattern.bestTiming}에 가장 잘 챙겨요
                  </Typography>
                  {adherenceAnalysis.timingPattern.worstTiming && (
                    <>
                      <Typography variant="body" color={Colors.warning}>!</Typography>
                      <Typography variant="bodySmall" style={{ flex: 1 }}>
                        {adherenceAnalysis.timingPattern.worstTiming} 복약 놓침 주의
                      </Typography>
                    </>
                  )}
                </View>
              )}
            </View>
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
  previewBanner: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    marginBottom: 16,
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  adherenceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brand,
    borderRadius: 6,
  },
  patternGrid: {
    gap: 8,
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  eventDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 24,
  },
  eventItemSelected: {
    backgroundColor: Colors.brandLightest,
  },
  eventItemHighlighted: {
    backgroundColor: Colors.brandLightest,
  },
  eventDate: {
    width: 80,
    fontSize: 12,
  },
  eventColorBar: {
    width: 3,
    height: 24,
    backgroundColor: Colors.brand,
    borderRadius: 2,
    marginHorizontal: 10,
  },
  eventColorBarSelected: {
    backgroundColor: Colors.brand,
  },
  eventTitle: {
    flex: 1,
  },
  cardList: {
    gap: 12,
  },
  aiAnalysisList: {
    gap: 10,
  },
  aiAnalysisCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiClusterName: {
    fontWeight: '600',
    flex: 1,
  },
  severityBadge: {
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  severityText: {
    fontWeight: '600',
    fontSize: 11,
  },
  aiSuggestionText: {
    lineHeight: 20,
  },
});
