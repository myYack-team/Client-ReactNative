import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { Typography, Button } from '../../../components/ui';
import { Colors } from '../../../constants';
import { qnaService } from '../../../services';

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 2000;

export default function CreateQnAScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = title.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await qnaService.createQuestion({
        title: title.trim(),
        content: content.trim(),
      });
      Alert.alert('완료', '문의가 등록되었습니다.', [
        {
          text: '확인',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Failed to create question:', error);
      Alert.alert('오류', '문의 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          keyboardShouldPersistTaps="handled"
        >
          {/* 제목 입력 */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Typography variant="body" style={styles.label}>
                제목
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                {title.length}/{TITLE_MAX_LENGTH}
              </Typography>
            </View>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={(text) => setTitle(text.slice(0, TITLE_MAX_LENGTH))}
              placeholder="문의 제목을 입력하세요"
              placeholderTextColor={Colors.textSecondary}
              maxLength={TITLE_MAX_LENGTH}
              returnKeyType="next"
            />
          </View>

          {/* 내용 입력 */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Typography variant="body" style={styles.label}>
                내용
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                {content.length}/{CONTENT_MAX_LENGTH}
              </Typography>
            </View>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={(text) => setContent(text.slice(0, CONTENT_MAX_LENGTH))}
              placeholder="문의 내용을 자세히 입력해주세요"
              placeholderTextColor={Colors.textSecondary}
              multiline
              textAlignVertical="top"
              maxLength={CONTENT_MAX_LENGTH}
            />
          </View>

          {/* 안내 문구 */}
          <View style={styles.infoBox}>
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.infoText}>
              * 문의 내용에 개인정보(전화번호, 이메일 등)를 포함하지 않도록 주의해주세요.
            </Typography>
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.infoText}>
              * 영업일 기준 1-3일 내에 답변드리겠습니다.
            </Typography>
          </View>
        </ScrollView>

        {/* 제출 버튼 */}
        <View style={styles.footer}>
          <Button
            title="문의 등록"
            onPress={handleSubmit}
            disabled={!isFormValid}
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </View>
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
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
  },
  titleInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contentInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    minHeight: 200,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoBox: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    lineHeight: 20,
    marginBottom: 4,
  },
  footer: {
    padding: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  submitButton: {
    height: 52,
  },
});
