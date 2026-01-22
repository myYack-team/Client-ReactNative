import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Typography } from '../ui';
import { Colors } from '../../constants';
import { DailyCondition, TimelineEvent } from '../../types';

interface ConditionLineChartProps {
  dailyConditions: DailyCondition[];
  events?: TimelineEvent[];
  selectedIndex?: number | null;
  onDataPointPress?: (index: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;

export function ConditionLineChart({ dailyConditions, events = [], selectedIndex = null, onDataPointPress }: ConditionLineChartProps) {
  if (!dailyConditions || dailyConditions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="caption" color={Colors.textTertiary}>
          컨디션 데이터가 없습니다
        </Typography>
      </View>
    );
  }

  // 최대 7일치만 표시
  const displayData = dailyConditions.slice(-7);

  // Y축 범위 계산 (데이터 기반 동적 범위)
  // 서버 데이터는 conditionScore, 타입 정의는 score 둘 다 지원
  const { minY, maxY, yAxisOffset } = useMemo(() => {
    const scores = displayData.map(d => (d as any).conditionScore ?? d.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);

    // 최소/최대 차이가 작으면 범위 확장
    const range = max - min;
    let adjustedMin = min;
    let adjustedMax = max;

    if (range < 2) {
      adjustedMin = Math.max(0, min - 1);
      adjustedMax = Math.min(10, max + 1);
    } else {
      adjustedMin = Math.max(0, min - 0.5);
      adjustedMax = Math.min(10, max + 0.5);
    }

    return {
      minY: Math.floor(adjustedMin),
      maxY: Math.ceil(adjustedMax),
      yAxisOffset: Math.floor(adjustedMin),
    };
  }, [displayData]);

  // 날짜 포맷팅 (MM/DD)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 이벤트 찾기
  const findEvent = (dateString: string) => {
    return events?.find((e) => e.date === dateString);
  };

  // 차트 데이터 생성
  const chartData = useMemo(() => {
    return displayData.map((item, index) => {
      const event = findEvent(item.date);
      const score = (item as any).conditionScore ?? item.score;

      return {
        value: score,
        label: formatDate(item.date),
        labelTextStyle: styles.xAxisLabel,
        // 이벤트가 있는 날은 다른 색상
        dataPointColor: event ? Colors.warning : Colors.brand,
        // 커스텀 데이터 포인트 렌더링
        customDataPoint: () => (
          <View style={styles.dataPointContainer}>
            <View
              style={[
                styles.dataPoint,
                { backgroundColor: event ? Colors.warning : Colors.brand },
              ]}
            />
            {event && (
              <View style={styles.eventMarker}>
                <Typography variant="caption" style={styles.eventIcon}>
                  {event.eventIcon}
                </Typography>
              </View>
            )}
          </View>
        ),
      };
    });
  }, [displayData, events]);

  // Y축 라벨 섹션 개수
  const noOfSections = Math.max(maxY - minY, 2);

  // 선택된 데이터 포인트 정보
  const selectedData = selectedIndex !== null && selectedIndex >= 0 && selectedIndex < displayData.length
    ? displayData[selectedIndex]
    : null;
  const selectedEvent = selectedData ? findEvent(selectedData.date) : null;

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={CHART_WIDTH}
        height={160}
        // 곡선 설정
        curved
        curvature={0.2}
        // 색상 설정
        color={Colors.brand}
        thickness={2}
        // 데이터 포인트
        dataPointsHeight={10}
        dataPointsWidth={10}
        dataPointsColor={Colors.brand}
        // 영역 채우기 (그라데이션 효과)
        areaChart
        startFillColor={Colors.brand}
        endFillColor={Colors.brandLightest}
        startOpacity={0.3}
        endOpacity={0.05}
        // Y축 설정
        yAxisOffset={yAxisOffset}
        maxValue={maxY - yAxisOffset}
        noOfSections={noOfSections}
        yAxisColor="transparent"
        yAxisTextStyle={styles.yAxisLabel}
        yAxisLabelWidth={24}
        formatYLabel={(label) => String(Math.round(Number(label) + yAxisOffset))}
        // X축 설정
        xAxisColor={Colors.divider}
        xAxisLabelTextStyle={styles.xAxisLabel}
        // 그리드
        rulesColor={Colors.divider}
        rulesType="solid"
        // 값 표시
        showValuesAsDataPointsText
        textColor={Colors.brand}
        textFontSize={11}
        textShiftY={-10}
        textShiftX={0}
        // 간격
        spacing={(CHART_WIDTH - 40) / Math.max(displayData.length - 1, 1)}
        initialSpacing={15}
        endSpacing={15}
        // 애니메이션
        isAnimated
        animationDuration={800}
        // 포인터 (터치 시)
        pointerConfig={{
          pointerStripUptoDataPoint: true,
          pointerStripColor: Colors.brand,
          pointerStripWidth: 1,
          pointerColor: Colors.brand,
          radius: 6,
          pointerLabelWidth: 80,
          pointerLabelHeight: 40,
          pointerLabelComponent: (items: any) => {
            const item = items[0];
            const index = chartData.findIndex(d => d.value === item.value);
            const event = index >= 0 ? findEvent(displayData[index]?.date) : null;

            return (
              <View style={styles.pointerLabel}>
                <Typography variant="caption" color={Colors.white}>
                  {item.value}점
                </Typography>
                {event && (
                  <Typography variant="caption" color={Colors.white} style={styles.pointerEventText}>
                    {event.title}
                  </Typography>
                )}
              </View>
            );
          },
        }}
        onPress={(item: any, index: number) => {
          onDataPointPress?.(index);
        }}
      />

      {/* 선택된 데이터 포인트 정보 카드 */}
      {selectedData && (
        <View style={styles.selectedInfoCard}>
          <View style={styles.selectedInfoHeader}>
            <Typography variant="bodySmall" color={Colors.textSecondary}>
              {formatDate(selectedData.date)}
            </Typography>
            <Typography variant="h3" color={Colors.brand}>
              {(selectedData as any).conditionScore ?? selectedData.score}점
            </Typography>
          </View>
          {selectedEvent && (
            <View style={styles.selectedEventBadge}>
              <Typography variant="caption">
                {selectedEvent.eventIcon} {selectedEvent.title}
              </Typography>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  yAxisLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
  },
  xAxisLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    width: 40,
    textAlign: 'center',
  },
  dataPointContainer: {
    alignItems: 'center',
  },
  dataPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  eventMarker: {
    position: 'absolute',
    top: 14,
  },
  eventIcon: {
    fontSize: 12,
  },
  pointerLabel: {
    backgroundColor: Colors.brand,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  pointerEventText: {
    fontSize: 9,
    marginTop: 2,
  },
  selectedInfoCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.brandLightest,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.brand,
  },
  selectedInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedEventBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: Colors.white,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
});
