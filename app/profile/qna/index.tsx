import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Typography, Card } from '../../../components/ui';
import { Colors } from '../../../constants';
import { qnaService } from '../../../services';
import { QnAQuestion, QNA_STATUS_COLORS } from '../../../types';

// 상태 배지 컴포넌트
function StatusBadge({ status, label }: { status: string; label: string }) {
  const colors = QNA_STATUS_COLORS[status as keyof typeof QNA_STATUS_COLORS] || {
    bg: '#F3F4F6',
    text: '#6B7280',
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
      <Typography variant="caption" style={{ color: colors.text, fontWeight: '600' }}>
        {label}
      </Typography>
    </View>
  );
}

// 문의 아이템 컴포넌트
function QuestionItem({ item, onPress }: { item: QnAQuestion; onPress: () => void }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.questionCard} variant="elevated">
        <View style={styles.questionHeader}>
          <StatusBadge status={item.status} label={item.statusLabel} />
          {item.hasAdminReply && (
            <View style={styles.adminReplyBadge}>
              <Typography variant="caption" color={Colors.primary}>
                관리자 답변
              </Typography>
            </View>
          )}
        </View>
        <Typography variant="body" style={styles.questionTitle} numberOfLines={2}>
          {item.title}
        </Typography>
        <View style={styles.questionFooter}>
          <Typography variant="caption" color={Colors.textSecondary}>
            {formatDate(item.createdAt)}
          </Typography>
          {item.replyCount > 0 && (
            <Typography variant="caption" color={Colors.textSecondary}>
              답글 {item.replyCount}
            </Typography>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// 빈 상태 컴포넌트
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Typography variant="h2" style={styles.emptyIcon}>
        ?
      </Typography>
      <Typography variant="h3" style={styles.emptyTitle}>
        문의 내역이 없습니다
      </Typography>
      <Typography variant="body" color={Colors.textSecondary} style={styles.emptyDescription}>
        궁금한 점이 있으시면{'\n'}새 문의를 작성해주세요
      </Typography>
    </View>
  );
}

export default function QnAListScreen() {
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<QnAQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchQuestions = useCallback(async (pageNum: number = 0, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (pageNum === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await qnaService.getMyQuestions(pageNum, 20);

      if (pageNum === 0) {
        setQuestions(response.questions);
      } else {
        setQuestions((prev) => [...prev, ...response.questions]);
      }
      setPage(pageNum);
      setHasNext(response.hasNext);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleRefresh = () => {
    fetchQuestions(0, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasNext) {
      fetchQuestions(page + 1);
    }
  };

  const handleQuestionPress = (id: number) => {
    router.push(`/profile/qna/${id}`);
  };

  const handleCreatePress = () => {
    router.push('/profile/qna/create');
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={questions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <QuestionItem item={item} onPress={() => handleQuestionPress(item.id)} />
        )}
        contentContainerStyle={[
          styles.listContent,
          questions.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
      />

      {/* FAB - 새 문의 작성 */}
      <TouchableOpacity style={[styles.fab, { bottom: 24 + insets.bottom }]} onPress={handleCreatePress} activeOpacity={0.8}>
        <Typography variant="h2" style={styles.fabIcon}>
          +
        </Typography>
      </TouchableOpacity>
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
  },
  questionCard: {
    marginBottom: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminReplyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: Colors.primaryLightest,
  },
  questionTitle: {
    fontWeight: '500',
    marginBottom: 8,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    color: Colors.textSecondary,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    color: Colors.white,
    fontSize: 28,
    lineHeight: 32,
  },
});
