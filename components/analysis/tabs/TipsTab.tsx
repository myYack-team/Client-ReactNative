import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../../ui';
import { LifestyleTipCard } from '../LifestyleTipCard';
import { Colors } from '../../../constants';
import { AnalysisResult } from '../../../types';

interface TipsTabProps {
  result: AnalysisResult;
}

export function TipsTab({ result }: TipsTabProps) {
  const hasLifestyleTips = result.lifestyleTips && result.lifestyleTips.length > 0;

  if (!hasLifestyleTips) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="h1" style={styles.emptyEmoji}>
          &#x1F4A1;
        </Typography>
        <Typography variant="h3" style={styles.emptyTitle}>
          생활 팁이 없어요
        </Typography>
        <Typography variant="body" color={Colors.textSecondary} style={styles.emptyDescription}>
          분석 결과에 생활 습관 팁이 없습니다
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 생활 습관 팁 섹션 */}
      <View style={styles.section}>
        <Typography variant="h3" style={styles.sectionTitle}>
          생활 습관 팁
        </Typography>
        <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.sectionDescription}>
          복용 중인 약물과 관련된 생활 속 팁이에요
        </Typography>
        <View style={styles.cardList}>
          {result.lifestyleTips!.map((tip, index) => (
            <LifestyleTipCard key={index} tip={tip} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
  },
  cardList: {
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyDescription: {
    textAlign: 'center',
  },
});
