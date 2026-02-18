import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Card, Typography } from '../ui';
import { Colors } from '../../constants';
import { ReportSummary } from '../../types';

interface ReportListItemProps {
  report: ReportSummary;
  onPress: () => void;
}

export function ReportListItem({ report, onPress }: ReportListItemProps) {
  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <Image
              source={require('../../assets/icons_iamge_processed/AI_Report.png')}
              style={styles.chartIcon}
              accessibilityLabel="Analysis report icon"
              resizeMode="contain"
            />
          </View>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Typography variant="body" style={styles.title}>
                {formatDate(report.analysisDate)} 분석
              </Typography>
              {report.isPreview && (
                <View style={styles.previewBadge}>
                  <Typography variant="caption" color={Colors.brand} style={styles.previewBadgeText}>
                    테스트
                  </Typography>
                </View>
              )}
            </View>
            <Typography variant="caption" color={Colors.textSecondary}>
              효과 {report.mechanismGroupCount}개 · 주의 음식 {report.foodInteractionCount}개
            </Typography>
          </View>
          <Typography variant="body" color={Colors.textSecondary}>
            보기 →
          </Typography>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brandLightest,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chartIcon: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontWeight: '500',
  },
  previewBadge: {
    backgroundColor: Colors.brandLightest,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.brand,
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
