import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Typography } from '../ui';
import { Colors } from '../../constants';
import { DailyCondition, TimelineEvent } from '../../types';

interface ConditionLineChartProps {
  dailyConditions: DailyCondition[];
  events?: TimelineEvent[];
}

const CHART_HEIGHT = 160;
const CHART_PADDING = 40;
const DOT_SIZE = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ConditionLineChart({ dailyConditions, events = [] }: ConditionLineChartProps) {
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
  const chartWidth = SCREEN_WIDTH - 80;
  const dataPointWidth = chartWidth / Math.max(displayData.length - 1, 1);

  // Y축 값 계산 (0-10)
  const getYPosition = (score: number) => {
    const availableHeight = CHART_HEIGHT - CHART_PADDING * 2;
    return CHART_PADDING + availableHeight * (1 - score / 10);
  };

  // X축 위치 계산
  const getXPosition = (index: number) => {
    if (displayData.length === 1) return chartWidth / 2;
    return index * dataPointWidth;
  };

  // 날짜 포맷팅 (MM/DD)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 이벤트 찾기
  const findEvent = (dateString: string) => {
    return events?.find((e) => e.date === dateString);
  };

  return (
    <View style={styles.container}>
      {/* Y축 레이블 */}
      <View style={styles.yAxis}>
        <Typography variant="caption" color={Colors.textTertiary}>10</Typography>
        <Typography variant="caption" color={Colors.textTertiary}>5</Typography>
        <Typography variant="caption" color={Colors.textTertiary}>0</Typography>
      </View>

      {/* 차트 영역 */}
      <View style={[styles.chartArea, { width: chartWidth }]}>
        {/* 그리드 라인 */}
        <View style={[styles.gridLine, { top: getYPosition(10) }]} />
        <View style={[styles.gridLine, { top: getYPosition(5) }]} />
        <View style={[styles.gridLine, { top: getYPosition(0) }]} />

        {/* 연결선 */}
        {displayData.map((item, index) => {
          if (index === 0) return null;
          const prevItem = displayData[index - 1];

          const x1 = getXPosition(index - 1);
          const y1 = getYPosition(prevItem.score);
          const x2 = getXPosition(index);
          const y2 = getYPosition(item.score);

          // 선의 길이와 각도 계산
          const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

          return (
            <View
              key={`line-${index}`}
              style={[
                styles.line,
                {
                  width: length,
                  left: x1,
                  top: y1,
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: 'left center',
                },
              ]}
            />
          );
        })}

        {/* 데이터 포인트 */}
        {displayData.map((item, index) => {
          const x = getXPosition(index);
          const y = getYPosition(item.score);
          const event = findEvent(item.date);

          return (
            <View key={`point-${index}`}>
              {/* 점 */}
              <View
                style={[
                  styles.dot,
                  {
                    left: x - DOT_SIZE / 2,
                    top: y - DOT_SIZE / 2,
                    backgroundColor: event ? Colors.warning : Colors.brand,
                  },
                ]}
              />

              {/* 점수 표시 */}
              <View
                style={[
                  styles.scoreLabel,
                  {
                    left: x - 12,
                    top: y - 24,
                  },
                ]}
              >
                <Typography variant="caption" color={Colors.brand} style={styles.scoreLabelText}>
                  {item.score}
                </Typography>
              </View>

              {/* 이벤트 마커 */}
              {event && (
                <View
                  style={[
                    styles.eventMarker,
                    {
                      left: x - 8,
                      top: y + DOT_SIZE / 2 + 4,
                    },
                  ]}
                >
                  <Typography variant="caption" style={styles.eventIcon}>
                    {event.icon}
                  </Typography>
                </View>
              )}
            </View>
          );
        })}

        {/* X축 레이블 */}
        <View style={styles.xAxis}>
          {displayData.map((item, index) => (
            <View
              key={`label-${index}`}
              style={[
                styles.xAxisLabel,
                {
                  left: getXPosition(index) - 20,
                },
              ]}
            >
              <Typography variant="caption" color={Colors.textTertiary}>
                {formatDate(item.date)}
              </Typography>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  yAxis: {
    width: 24,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    paddingVertical: CHART_PADDING - 8,
  },
  chartArea: {
    height: CHART_HEIGHT,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.divider,
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: Colors.brand,
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  scoreLabel: {
    position: 'absolute',
    width: 24,
    alignItems: 'center',
  },
  scoreLabelText: {
    fontWeight: '600',
    fontSize: 11,
  },
  eventMarker: {
    position: 'absolute',
  },
  eventIcon: {
    fontSize: 12,
  },
  xAxis: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CHART_PADDING,
    flexDirection: 'row',
  },
  xAxisLabel: {
    position: 'absolute',
    width: 40,
    alignItems: 'center',
    bottom: 0,
  },
});
