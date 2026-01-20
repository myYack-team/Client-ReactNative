import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Typography, Button, Card } from '../../components/ui';
import { ConditionSlider } from '../../components/health-note';
import { Colors } from '../../constants';
import { healthNoteService } from '../../services';
import { HealthNote } from '../../types';

const MAX_CONTENT_LENGTH = 500;

export default function HealthNoteScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();

  const [conditionScore, setConditionScore] = useState(10);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingNote, setExistingNote] = useState<HealthNote | null>(null);

  // 날짜 포맷팅 (YYYY-MM-DD -> YYYY년 MM월 DD일 (요일))
  const formatDateKorean = (dateString: string) => {
    const dateObj = new Date(dateString);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const dayOfWeek = dayNames[dateObj.getDay()];
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  };

  // 기존 메모 로드
  const loadExistingNote = useCallback(async () => {
    if (!date) return;

    setIsLoading(true);
    try {
      const note = await healthNoteService.getByDate(date);
      if (note) {
        setExistingNote(note);
        setConditionScore(note.conditionScore);
        setContent(note.content || '');
      } else {
        // 새 메모인 경우 기본값
        setExistingNote(null);
        setConditionScore(10);
        setContent('');
      }
    } catch (error) {
      console.error('Failed to load health note:', error);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      loadExistingNote();
    }, [loadExistingNote])
  );

  // 저장
  const handleSave = async () => {
    if (!date) return;

    setIsSaving(true);
    try {
      if (existingNote) {
        // 수정
        await healthNoteService.update(date, {
          conditionScore,
          content: content.trim() || undefined,
        });
      } else {
        // 생성
        await healthNoteService.create({
          noteDate: date,
          conditionScore,
          content: content.trim() || undefined,
        });
      }

      Alert.alert('저장 완료', '건강 메모가 저장되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Failed to save health note:', error);
      Alert.alert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  // 삭제
  const handleDelete = () => {
    if (!existingNote || !date) return;

    Alert.alert(
      '삭제 확인',
      '이 건강 메모를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await healthNoteService.delete(date);
              router.back();
            } catch (error) {
              console.error('Failed to delete health note:', error);
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Typography variant="body" color={Colors.textSecondary}>
            불러오는 중...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 날짜 헤더 */}
          <Card style={styles.dateCard} variant="elevated">
            <Typography variant="h3" style={styles.dateText}>
              {date ? formatDateKorean(date) : ''}
            </Typography>
          </Card>

          {/* 컨디션 점수 */}
          <View style={styles.section}>
            <Typography variant="h4" style={styles.sectionTitle}>
              오늘의 컨디션
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary} style={styles.sectionSubtitle}>
              0점(최악)부터 10점(최고)까지 선택해주세요
            </Typography>
            <Card style={styles.sliderCard} variant="elevated">
              <ConditionSlider
                value={conditionScore}
                onChange={setConditionScore}
              />
            </Card>
          </View>

          {/* 메모 */}
          <View style={styles.section}>
            <View style={styles.memoHeader}>
              <Typography variant="h4" style={styles.sectionTitle}>
                메모 (선택)
              </Typography>
              <Typography variant="caption" color={Colors.textTertiary}>
                {content.length}/{MAX_CONTENT_LENGTH}
              </Typography>
            </View>
            <Card style={styles.memoCard} variant="elevated">
              <TextInput
                style={styles.memoInput}
                placeholder="오늘의 몸 상태나 특이사항을 기록해보세요..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={6}
                maxLength={MAX_CONTENT_LENGTH}
                value={content}
                onChangeText={setContent}
                textAlignVertical="top"
              />
            </Card>
          </View>

          {/* 버튼 */}
          <View style={styles.buttonContainer}>
            <Button
              title={isSaving ? '저장 중...' : '저장하기'}
              variant="primary"
              size="large"
              onPress={handleSave}
              disabled={isSaving}
              style={styles.saveButton}
            />

            {existingNote && (
              <Button
                title="삭제하기"
                variant="secondary"
                size="large"
                onPress={handleDelete}
                style={styles.deleteButton}
              />
            )}
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCard: {
    marginBottom: 24,
    backgroundColor: Colors.brandLightest,
    borderWidth: 1,
    borderColor: Colors.brand,
    alignItems: 'center',
  },
  dateText: {
    color: Colors.brand,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionSubtitle: {
    marginBottom: 12,
  },
  sliderCard: {
    padding: 20,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memoCard: {
    padding: 0,
  },
  memoInput: {
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 150,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 8,
    gap: 12,
  },
  saveButton: {},
  deleteButton: {},
});
