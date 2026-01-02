import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Button, Card, SupplementTagBadge } from '../../components/ui';
import { Colors } from '../../constants';
import { supplementService } from '../../services';
import { SupplementDetail } from '../../types';

export default function SupplementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [supplement, setSupplement] = useState<SupplementDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSupplementDetail();
  }, [id]);

  const loadSupplementDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await supplementService.getSupplementDetail(parseInt(id));
      setSupplement(data);
    } catch (error) {
      console.error('Failed to load supplement detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!supplement) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textSecondary} />
          <Typography variant="body" color={Colors.textSecondary}>
            영양제 정보를 불러올 수 없습니다.
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 헤더 정보 */}
        <Card style={styles.headerCard} variant="elevated">
          <SupplementTagBadge tag={supplement.tag} size="medium" />
          <Typography variant="h2" style={styles.name}>
            {supplement.name}
          </Typography>

          {supplement.description && (
            <Typography variant="body" color={Colors.textSecondary} style={styles.description}>
              {supplement.description}
            </Typography>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
              <Typography variant="bodySmall" color={Colors.textSecondary}>
                {supplement.createdByName}님 등록
              </Typography>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={20} color={Colors.textSecondary} />
              <Typography variant="bodySmall" color={Colors.textSecondary}>
                {supplement.selectionCount}명 복용 중
              </Typography>
            </View>
          </View>
        </Card>

        {/* 인기도 표시 */}
        {supplement.selectionCount > 0 && (
          <Card style={styles.popularityCard}>
            <View style={styles.popularityHeader}>
              <Ionicons name="trending-up" size={24} color={Colors.primary} />
              <Typography variant="h4" color={Colors.primary}>
                인기 영양제
              </Typography>
            </View>
            <Typography variant="bodySmall" color={Colors.textSecondary}>
              {supplement.selectionCount}명의 사용자가 이 영양제를 복용하고 있어요
            </Typography>
          </Card>
        )}

        {/* 등록 정보 */}
        <Card style={styles.infoCard}>
          <Typography variant="h4" style={styles.sectionTitle}>
            등록 정보
          </Typography>
          <View style={styles.infoRow}>
            <Typography variant="bodySmall" color={Colors.textSecondary}>
              등록일
            </Typography>
            <Typography variant="bodySmall">
              {new Date(supplement.createdAt).toLocaleDateString('ko-KR')}
            </Typography>
          </View>
          <View style={styles.infoRow}>
            <Typography variant="bodySmall" color={Colors.textSecondary}>
              등록자
            </Typography>
            <Typography variant="bodySmall">
              {supplement.createdByName}
            </Typography>
          </View>
        </Card>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomButton}>
        <Button
          title="내 영양제에 추가하기"
          variant="primary"
          size="large"
          onPress={() => {
            // 이미 로드된 데이터를 params로 전달하여 중복 API 호출 방지
            router.push({
              pathname: `/supplement/add/${supplement.id}`,
              params: {
                supplementData: JSON.stringify({
                  id: supplement.id,
                  name: supplement.name,
                  tag: supplement.tag,
                  tagLabel: supplement.tagLabel,
                  description: supplement.description,
                }),
              },
            });
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  headerCard: {
    marginBottom: 16,
  },
  name: {
    marginTop: 12,
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  popularityCard: {
    marginBottom: 16,
    backgroundColor: '#E3F2FD',
  },
  popularityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
