import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
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
const LABEL_WIDTH = 160;
const MAX_LABEL_CHARS = 20;

export function ConditionLineChart({ dailyConditions, events = [], selectedIndex = null, onDataPointPress, onEventLabelPress }: ConditionLineChartProps) {
  // 스크롤 위치 추적
  const [scrollX, setScrollX] = useState(0);
  // 포커스된 인덱스 (내부 관리)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  // 차트 내부 ScrollView 접근용 ref
  const chartScrollRef = useRef<any>(null);

  // 이벤트 카드 클릭 시 차트 수평 스크롤
  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= 0 && chartScrollRef.current) {
      const targetX = INITIAL_SPACING + (selectedIndex * POINT_SPACING) - (CHART_WIDTH / 2);
      const clampedX = Math.max(0, targetX);
      setTimeout(() => {
        chartScrollRef.current?.scrollTo?.({ x: clampedX, animated: true });
      }, 100);
      setFocusedIndex(selectedIndex);
    }
  }, [selectedIndex]);

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
                <Text style={styles.eventIcon}>
                  {event.eventIcon}
                </Text>
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

  // 텍스트 truncate 함수 (잘릴 때 "더보기" 표시)
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return { text, isTruncated: false };
    // 여유를 두고 자르고, 뒤에 "더보기" 추가
    return { text: text.substring(0, maxLength - 3) + '...', isTruncated: true };
  };

  // 오버레이 라벨 정보 생성
  const getOverlayLabelInfo = () => {
    if (!focusedData) return { text: '', isTruncated: false, isEvent: false, hasMemo: false, showLabel: false };
    const content = (focusedData as any).content;

    if (focusedEvent) {
      // 이벤트: 이모지 + 제목
      const labelText = `${focusedEvent.eventIcon} ${focusedEvent.title}`;
      const truncated = truncateText(labelText, MAX_LABEL_CHARS);
      return { ...truncated, isEvent: true, hasMemo: false, showLabel: true };
    }
    if (content) {
      // 메모 있음: 메모 내용 간략히 표시
      const memoText = `📝 ${content}`;
      const truncated = truncateText(memoText, MAX_LABEL_CHARS);
      return { ...truncated, isEvent: false, hasMemo: true, showLabel: true };
    }
    // 점수만 있는 날: 태그 표시 안함
    return { text: '', isTruncated: false, isEvent: false, hasMemo: false, showLabel: false };
  };

  const overlayLabelInfo = getOverlayLabelInfo();

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* 외부 오버레이 라벨 (차트 위에 absolute로 배치) - 이벤트/메모가 있을 때만 표시 */}
        {focusedIndex !== null && focusedData && overlayLabelInfo.showLabel && (
          <View
            style={[styles.overlayLabelContainer, { left: overlayLabelX }]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={[
                styles.overlayLabel,
                overlayLabelInfo.isEvent && styles.overlayLabelEvent,
                overlayLabelInfo.hasMemo && styles.overlayLabelMemo,
              ]}
              onPress={() => {
                if (focusedEvent && onEventLabelPress) {
                  onEventLabelPress(focusedData.date);
                }
              }}
              activeOpacity={focusedEvent || overlayLabelInfo.hasMemo ? 0.7 : 1}
            >
              <Typography
                variant="caption"
                color={overlayLabelInfo.isEvent ? Colors.warning : Colors.textPrimary}
                style={overlayLabelInfo.isEvent && styles.overlayLabelEventText}
              >
                {overlayLabelInfo.text}
                {overlayLabelInfo.isTruncated && (
                  <Text style={{ color: Colors.brand, fontWeight: '500' }}>
                    {' 더보기'}
                  </Text>
                )}
              </Typography>
            </TouchableOpacity>
          </View>
        )}

        <LineChart
          data={chartData}
          scrollRef={chartScrollRef}
          focusedDataPointIndex={selectedIndex ?? undefined}
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
          scrollToEnd={selectedIndex === null}
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
          <View style={[
            styles.selectedInfoCard,
            selectedEvent && styles.selectedInfoCardWithEvent,
          ]}>
            <View style={styles.selectedInfoHeader}>
              <Typography variant="bodySmall" color={Colors.textSecondary}>
                {formatDate(selectedData.date)}
              </Typography>
              <Typography variant="h3" color={selectedEvent ? Colors.warning : Colors.brand}>
                {(selectedData as any).conditionScore ?? selectedData.score}점
              </Typography>
            </View>
            {selectedEvent && (
              <View style={styles.selectedEventBadge}>
                <Typography variant="caption" color={Colors.warning} style={styles.eventTitleText}>
                  {selectedEvent.eventIcon} {selectedEvent.title}
                </Typography>
                {selectedEvent.description && (
                  <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.eventDescription}>
                    {selectedEvent.description}
                  </Typography>
                )}
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
    minWidth: 60,
    maxWidth: LABEL_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  overlayLabelEvent: {
    backgroundColor: 'rgba(255, 243, 224, 0.98)',
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  overlayLabelMemo: {
    backgroundColor: 'rgba(232, 245, 233, 0.98)',
    borderWidth: 1,
    borderColor: Colors.brand,
  },
  overlayLabelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayLabelEventText: {
    fontWeight: '600',
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
    overflow: 'visible',
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
    minWidth: 20,
    alignItems: 'center',
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
  selectedInfoCardWithEvent: {
    backgroundColor: '#FFF8E1',
    borderColor: Colors.warning,
    borderWidth: 1.5,
  },
  selectedInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedEventBadge: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.white,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  eventTitleText: {
    fontWeight: '600',
  },
  eventDescription: {
    marginTop: 4,
  },
  memoContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
});
