import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Typography } from '../ui';
import { Colors, Shadows, SYMPTOM_OPTIONS } from '../../constants';
import { SymptomChip } from './SymptomChip';
import type { TemporaryNoteData } from '../../types';

interface InsufficientDataModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TemporaryNoteData) => Promise<void>;
}

const MAX_NOTE_LENGTH = 500;

const SCORE_LABELS: Record<number, string> = {
  0: '매우 나쁨',
  1: '나쁨',
  2: '좋지 않음',
  3: '약간 불편',
  4: '보통 이하',
  5: '보통',
  6: '괜찮음',
  7: '좋음',
  8: '매우 좋음',
  9: '훌륭함',
  10: '최상',
};

const getScoreColor = (score: number): string => {
  if (score <= 3) return '#FF6B6B';
  if (score <= 6) return '#FFB84D';
  return '#4CAF50';
};

export function InsufficientDataModal({ visible, onClose, onSubmit }: InsufficientDataModalProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [conditionScore, setConditionScore] = useState<number>(5);
  const [additionalNote, setAdditionalNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleSymptom = useCallback((symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((id) => id !== symptomId)
        : [...prev, symptomId]
    );
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        conditionScore,
        selectedSymptoms,
        additionalNote: additionalNote.trim(),
      });
      // 성공 후 상태 초기화
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedSymptoms([]);
    setConditionScore(5);
    setAdditionalNote('');
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.closeButton}>
            <Typography variant="h3" color={Colors.textSecondary}>
              X
            </Typography>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Typography variant="h2" style={styles.headerTitle}>
              더 정확한 분석을 위해
            </Typography>
            <Typography variant="body" color={Colors.textSecondary}>
              최근 건강 상태와 증상을 입력해주세요.
            </Typography>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 섹션 1: 컨디션 점수 */}
          <View style={styles.section}>
            <Typography variant="h4" style={styles.sectionTitle}>
              오늘의 컨디션
            </Typography>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreDisplay}>
                <Typography
                  variant="h1"
                  color={getScoreColor(conditionScore)}
                  style={styles.scoreNumber}
                >
                  {conditionScore}
                </Typography>
                <Typography variant="bodySmall" color={Colors.textSecondary}>
                  {SCORE_LABELS[conditionScore]}
                </Typography>
              </View>
              <View style={styles.scoreButtonsContainer}>
                <View style={styles.scoreButtons}>
                  {Array.from({ length: 11 }, (_, i) => i).map((score) => (
                    <TouchableOpacity
                      key={score}
                      style={[
                        styles.scoreButton,
                        conditionScore === score && {
                          backgroundColor: getScoreColor(score),
                          borderColor: getScoreColor(score),
                        },
                      ]}
                      onPress={() => setConditionScore(score)}
                    >
                      <Typography
                        variant="caption"
                        color={conditionScore === score ? Colors.white : Colors.textSecondary}
                        style={styles.scoreButtonText}
                      >
                        {score}
                      </Typography>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.scoreLabelsRow}>
                  <Typography variant="caption" color={Colors.textSecondary}>
                    나쁨
                  </Typography>
                  <Typography variant="caption" color={Colors.textSecondary}>
                    좋음
                  </Typography>
                </View>
              </View>
            </View>
          </View>

          {/* 섹션 2: 증상 선택 */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Typography variant="h4" style={styles.sectionTitle}>
                최근 느낀 증상
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                (복수 선택 가능)
              </Typography>
            </View>
            <View style={styles.symptomGrid}>
              {SYMPTOM_OPTIONS.map((symptom) => (
                <SymptomChip
                  key={symptom.id}
                  symptom={symptom}
                  selected={selectedSymptoms.includes(symptom.id)}
                  onPress={() => handleToggleSymptom(symptom.id)}
                />
              ))}
            </View>
          </View>

          {/* 섹션 3: 추가 메모 */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Typography variant="h4" style={styles.sectionTitle}>
                추가 메모
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                (선택)
              </Typography>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="예) 어제 저녁에 약을 먹은 후 속이 좀 불편했어요"
              placeholderTextColor={Colors.textLight}
              multiline
              maxLength={MAX_NOTE_LENGTH}
              value={additionalNote}
              onChangeText={setAdditionalNote}
              textAlignVertical="top"
            />
            <Typography
              variant="caption"
              color={Colors.textSecondary}
              style={styles.charCount}
            >
              {additionalNote.length}/{MAX_NOTE_LENGTH}
            </Typography>
          </View>

          {/* 섹션 4: 안내 박스 */}
          <View style={styles.infoBox}>
            <Typography variant="bodySmall" color={Colors.brand} style={styles.infoTitle}>
              이 정보는 어떻게 활용되나요?
            </Typography>
            <Typography variant="caption" color={Colors.textSecondary} style={styles.infoText}>
              입력하신 증상과 컨디션 정보는 AI 분석에 반영되어{'\n'}
              더 개인화된 약물 상호작용 리포트를 제공합니다.
            </Typography>
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Typography variant="body" color={Colors.textSecondary}>
              다음에 분석할게요
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Typography variant="h4" color={Colors.white}>
              {isSubmitting ? '저장 중...' : '저장하고 분석 시작'}
            </Typography>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  headerTextContainer: {
    marginTop: 4,
  },
  headerTitle: {
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  // Score section
  scoreContainer: {
    alignItems: 'center',
    gap: 16,
  },
  scoreDisplay: {
    alignItems: 'center',
    gap: 4,
  },
  scoreNumber: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
  },
  scoreButtonsContainer: {
    width: '100%',
  },
  scoreButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  scoreButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreButtonText: {
    fontWeight: '600',
    fontSize: 11,
  },
  scoreLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  // Symptom grid
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  // Text input
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.white,
    lineHeight: 20,
  },
  charCount: {
    textAlign: 'right',
    marginTop: 6,
  },
  // Info box
  infoBox: {
    backgroundColor: Colors.brandLightest,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.brandLight,
  },
  infoTitle: {
    fontWeight: '600',
    marginBottom: 6,
  },
  infoText: {
    lineHeight: 18,
  },
  // Bottom buttons
  bottomButtons: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 10,
  },
  submitButton: {
    backgroundColor: Colors.brand,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadows.small,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});
