import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Typography, Card, Button } from '../../../components/ui';
import { Colors } from '../../../constants';
import { qnaService } from '../../../services';
import { QnAQuestionDetail, QnAReply, QNA_STATUS_COLORS } from '../../../types';

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

// 답글 아이템 컴포넌트
function ReplyItem({ reply }: { reply: QnAReply }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View style={[styles.replyItem, reply.isAdmin && styles.adminReplyItem]}>
      <View style={styles.replyHeader}>
        <Typography
          variant="bodySmall"
          style={[styles.replyAuthor, reply.isAdmin && styles.adminReplyAuthor]}
        >
          {reply.isAdmin ? reply.adminName || '관리자' : '나'}
        </Typography>
        <Typography variant="caption" color={Colors.textSecondary}>
          {formatDate(reply.createdAt)}
        </Typography>
      </View>
      <Typography variant="body" style={styles.replyContent}>
        {reply.content}
      </Typography>
    </View>
  );
}

export default function QnADetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [question, setQuestion] = useState<QnAQuestionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchQuestion = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const data = await qnaService.getQuestionDetail(Number(id));
      setQuestion(data);
    } catch (error) {
      console.error('Failed to fetch question:', error);
      Alert.alert('오류', '문의를 불러오는데 실패했습니다.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !id) return;

    try {
      setIsSubmitting(true);
      await qnaService.addReply(Number(id), { content: replyContent.trim() });
      setReplyContent('');
      // 답글 등록 후 상세 정보 다시 조회
      const updated = await qnaService.getQuestionDetail(Number(id));
      setQuestion(updated);
    } catch (error) {
      console.error('Failed to add reply:', error);
      Alert.alert('오류', '답글 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '문의 삭제',
      '이 문의를 삭제하시겠습니까?\n삭제된 문의는 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await qnaService.deleteQuestion(Number(id));
              Alert.alert('완료', '문의가 삭제되었습니다.');
              router.back();
            } catch (error) {
              console.error('Failed to delete question:', error);
              Alert.alert('오류', '문의 삭제에 실패했습니다.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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

  if (!question) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Typography variant="body" color={Colors.textSecondary}>
            문의를 찾을 수 없습니다.
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  const canAddReply = question.status !== 'CLOSED';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 질문 카드 */}
          <Card style={styles.questionCard} variant="elevated">
            <View style={styles.questionHeader}>
              <StatusBadge status={question.status} label={question.statusLabel} />
              <TouchableOpacity
                onPress={handleDelete}
                disabled={isDeleting}
                style={styles.deleteButton}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Typography variant="body" color={Colors.error}>
                    삭제
                  </Typography>
                )}
              </TouchableOpacity>
            </View>
            <Typography variant="h3" style={styles.questionTitle}>
              {question.title}
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary} style={styles.questionDate}>
              {formatDate(question.createdAt)}
            </Typography>
            <View style={styles.divider} />
            <Typography variant="body" style={styles.questionContent}>
              {question.content}
            </Typography>
          </Card>

          {/* 답글 목록 */}
          {question.replies.length > 0 && (
            <View style={styles.repliesSection}>
              <Typography variant="h3" style={styles.repliesTitle}>
                답글 ({question.replies.length})
              </Typography>
              {question.replies.map((reply) => (
                <ReplyItem key={reply.id} reply={reply} />
              ))}
            </View>
          )}
        </ScrollView>

        {/* 답글 입력창 */}
        {canAddReply && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={replyContent}
              onChangeText={setReplyContent}
              placeholder="추가 문의사항을 입력하세요"
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!replyContent.trim() || isSubmitting) && styles.sendButtonDisabled,
              ]}
              onPress={handleSubmitReply}
              disabled={!replyContent.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Typography variant="body" style={styles.sendButtonText}>
                  전송
                </Typography>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButton: {
    padding: 8,
  },
  questionTitle: {
    marginBottom: 8,
  },
  questionDate: {
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  questionContent: {
    lineHeight: 22,
  },
  repliesSection: {
    marginTop: 8,
  },
  repliesTitle: {
    marginBottom: 12,
  },
  replyItem: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  adminReplyItem: {
    backgroundColor: Colors.primaryLightest,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyAuthor: {
    fontWeight: '600',
    color: Colors.text,
  },
  adminReplyAuthor: {
    color: Colors.primary,
  },
  replyContent: {
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
  },
  sendButton: {
    width: 60,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  sendButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});
