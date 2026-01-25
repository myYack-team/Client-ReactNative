import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Typography } from '../ui';
import { Colors } from '../../constants';
import { DailyCondition, TimelineEvent } from '../../types';

interface ConditionLineChartProps {
  dailyConditions: DailyCondition[];
  events?: TimelineEvent[];
  selectedIndex?: number | null;
  onDataPointPress?: (index: number) => void;
  onEventLabelPress?: (eventDate: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;
const POINT_SPACING = 50;
const INITIAL_SPACING = 15;
const Y_AXIS_LABEL_WIDTH = 24;
const LABEL_WIDTH = 120;

export function ConditionLineChart({ dailyConditions, events = [], selectedIndex = null, onDataPointPress, onEventLabelPress }: ConditionLineChartProps) {
  // 스크롤 위치 추적
  const [scrollX, setScrollX] = useState(0);
  // 포커스된 인덱스 (내부 관리)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  if (!dailyConditions || dailyConditions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="caption" color={Colors.textTertiary}>
          컨디션 데이터가 없습니다
        </Typography>
      </View>
    );
  }

  const displayData = dailyConditions;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const findEvent = (dateString: string) => {
    return events?.find((e) => e.date === dateString);
  };

  const chartData = useMemo(() => {
    return displayData.map((item, index) => {
      const event = findEvent(item.date);
      const score = (item as any).conditionScore ?? item.score;

      return {
        value: score,
        label: formatDate(item.date),
        labelTextStyle: styles.xAxisLabel,
        dataPointColor: event ? Colors.warning : Colors.brand,
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

  const selectedData = selectedIndex !== null && selectedIndex >= 0 && selectedIndex < displayData.length
    ? displayData[selectedIndex]
    : null;
  const selectedEvent = selectedData ? findEvent(selectedData.date) : null;

  // 외부 오버레이 라벨의 X 좌표 계산
  const overlayLabelX = useMemo(() => {
    if (focusedIndex === null) return 0;
    // X = yAxisLabelWidth + initialSpacing + (index * spacing) - scrollX - (labelWidth / 2)
    const baseX = Y_AXIS_LABEL_WIDTH + INITIAL_SPACING + (focusedIndex * POINT_SPACING) - scrollX;
    // 라벨 중앙 정렬 및 화면 경계 제한
    const centeredX = baseX - LABEL_WIDTH / 2;
    return Math.max(8, Math.min(centeredX, CHART_WIDTH - LABEL_WIDTH + 8));
  }, [focusedIndex, scrollX]);

  // 포커스된 데이터 정보
  const focusedData = focusedIndex !== null && focusedIndex >= 0 && focusedIndex < displayData.length
    ? displayData[focusedIndex]
    : null;
  const focusedEvent = focusedData ? findEvent(focusedData.date) : null;

  // 오버레이 라벨 텍스트 생성
  const getOverlayLabelText = () => {
    if (!focusedData) return '';
    const dateStr = formatDate(focusedData.date);
    const score = (focusedData as any).conditionScore ?? focusedData.score;
    if (focusedEvent) {
      return `${dateStr} ${focusedEvent.eventIcon} ${focusedEvent.title}`;
    }
    if ((focusedData as any).content) {
      return `${dateStr} 📝 메모`;
    }
    return `${dateStr} ${score}점`;
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* 외부 오버레이 라벨 (차트 위에 absolute로 배치) */}
        {focusedIndex !== null && focusedData && (
          <View
            style={[styles.overlayLabelContainer, { left: overlayLabelX }]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={styles.overlayLabel}
              onPress={() => {
                if (focusedEvent && onEventLabelPress) {
                  onEventLabelPress(focusedData.date);
                }
              }}
              activeOpacity={focusedEvent ? 0.7 : 1}
            >
              <Typography variant="caption" color={Colors.textPrimary} numberOfLines={1}>
                {getOverlayLabelText()}
              </Typography>
            </TouchableOpacity>
          </View>
        )}

        <LineChart
          data={chartData}
          width={CHART_WIDTH}
          height={160}
          curved
          curvature={0.2}
          color={Colors.brand}
          thickness={2}
          dataPointsHeight={10}
          dataPointsWidth={10}
          dataPointsColor={Colors.brand}
          areaChart
          startFillColor={Colors.brand}
          endFillColor={Colors.brandLightest}
          startOpacity={0.3}
          endOpacity={0.05}
          yAxisOffset={0}
          maxValue={10}
          noOfSections={5}
          yAxisColor="transparent"
          yAxisTextStyle={styles.yAxisLabel}
          yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
          xAxisColor={Colors.divider}
          xAxisLabelTextStyle={styles.xAxisLabel}
          rulesColor={Colors.divider}
          rulesType="solid"
          showValuesAsDataPointsText
          textColor={Colors.brand}
          textFontSize={11}
          textShiftY={-10}
          textShiftX={0}
          spacing={POINT_SPACING}
          initialSpacing={INITIAL_SPACING}
          endSpacing={15}
          scrollToEnd={true}
          showScrollIndicator={true}
          scrollAnimation={true}
          isAnimated
          animationDuration={800}
          focusEnabled={true}
          onFocus={(item: any, index: number) => {
            setFocusedIndex(index);
            onDataPointPress?.(index);
          }}
          onScroll={(event: any) => {
            setScrollX(event.nativeEvent.contentOffset.x);
          }}
          scrollEventThrottle={16}
          showStripOnFocus={true}
          stripHeight={160}
          stripWidth={1}
          stripColor={Colors.textTertiary}
          stripOpacity={0.5}
          unFocusOnPressOut={false}
          focusedDataPointRadius={8}
          focusedDataPointColor={Colors.brand}
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
            {(selectedData as any).content && (
              <View style={styles.memoContent}>
                <Typography variant="bodySmall" color={Colors.textSecondary}>
                  {(selectedData as any).content}
                </Typography>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    paddingTop: 40,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  overlayLabelContainer: {
    position: 'absolute',
    top: 8,
    zIndex: 100,
  },
  overlayLabel: {
    backgroundColor: 'rgba(240, 240, 240, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 80,
    maxWidth: LABEL_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  memoContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
});
