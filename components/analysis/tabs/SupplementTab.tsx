import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '../../ui';
import { SupplementInteractionCard } from '../SupplementInteractionCard';
import { Colors } from '../../../constants';
import { AnalysisResult } from '../../../types';

interface SupplementTabProps {
  result: AnalysisResult;
}

export function SupplementTab({ result }: SupplementTabProps) {
  const hasSupplementInteractions = result.supplementInteractions && result.supplementInteractions.length > 0;

  if (!hasSupplementInteractions) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="h1" style={styles.emptyEmoji}>
          &#x1F48A;
        </Typography>
        <Typography variant="h3" style={styles.emptyTitle}>
          영양제 정보가 없어요
        </Typography>
        <Typography variant="body" color={Colors.textSecondary} style={styles.emptyDescription}>
          등록된 영양제가 없거나{'\n'}분석할 상호작용 정보가 없습니다
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 내 영양제 체크 섹션 */}
      <View style={styles.section}>
        <Typography variant="h3" style={styles.sectionTitle}>
          내 영양제 체크
        </Typography>
        <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.sectionDescription}>
          복용 중인 영양제와 약물 간의 상호작용을 확인해보세요
        </Typography>
        <View style={styles.cardList}>
          {result.supplementInteractions!.map((interaction, index) => (
            <SupplementInteractionCard key={index} interaction={interaction} />
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
