import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Typography, Button, Card, SupplementTagBadge } from '../../../components/ui';
import { Colors } from '../../../constants';
import { supplementService } from '../../../services';
import {
  SupplementDetail,
  MedicationTiming,
  TIMING_LABELS,
  TIMING_OPTIONS,
} from '../../../types';
import { getTodayString } from '../../../utils/dateUtils';

// 전달받는 영양제 데이터 타입 (중복 호출 방지용)
interface CachedSupplementData {
  id: number;
  name: string;
  tag: string;
  tagLabel?: string;
  description?: string;
}

export default function AddUserSupplementScreen() {
  const { id, supplementData } = useLocalSearchParams<{ id: string; supplementData?: string }>();
  const [supplement, setSupplement] = useState<SupplementDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 폼 상태
  const [dosage, setDosage] = useState('1정');
  const [frequency, setFrequency] = useState(1);
  const [selectedTimings, setSelectedTimings] = useState<MedicationTiming[]>(['MORNING']);
  const [startDate, setStartDate] = useState(getTodayString()); // 로컬 타임존 기준 오늘 날짜
  const [memo, setMemo] = useState('');

  useEffect(() => {
    loadSupplementDetail();
  }, [id, supplementData]);

  const loadSupplementDetail = async () => {
    if (!id) return;

    // 1. 전달받은 캐시 데이터가 있으면 우선 사용
    if (supplementData) {
      try {
        const cached: CachedSupplementData = JSON.parse(supplementData);
        // 캐시 데이터로 최소한의 정보 설정 (API 호출 없이)
        setSupplement({
          id: cached.id,
          name: cached.name,
          tag: cached.tag as SupplementDetail['tag'],
          tagLabel: cached.tagLabel || '',
          description: cached.description,
          // 아래 필드들은 add 화면에서 사용하지 않으므로 기본값 설정
          createdByName: '',
          selectionCount: 0,
          createdAt: '',
          createdById: 0,
        });
        setIsLoading(false);
        return;
      } catch (e) {
        console.warn('Failed to parse cached supplement data:', e);
      }
    }

    // 2. 캐시 데이터가 없으면 API 호출 (fallback)
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

  const toggleTiming = (timing: MedicationTiming) => {
    if (selectedTimings.includes(timing)) {
      if (selectedTimings.length > 1) {
        const newTimings = selectedTimings.filter((t) => t !== timing);
        setSelectedTimings(newTimings);
        setFrequency(newTimings.length);
      }
    } else {
      const newTimings = [...selectedTimings, timing];
      setSelectedTimings(newTimings);
      setFrequency(newTimings.length);
    }
  };

  const handleSave = async () => {
    if (!supplement || selectedTimings.length === 0) {
      Alert.alert('알림', '복용 시간을 최소 1개 선택해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      await supplementService.addUserSupplement({
        supplementId: supplement.id,
        dosage,
        frequency,
        timings: selectedTimings,
        startDate,
        memo: memo.trim() || undefined,
      });

      Alert.alert('추가 완료', '영양제가 내 목록에 추가되었습니다.', [
        {
          text: '확인',
          onPress: () => router.replace('/(tabs)/medications'),
        },
      ]);
    } catch (error) {
      console.error('Failed to add user supplement:', error);
      Alert.alert('오류', '영양제 추가에 실패했습니다.');
    } finally {
      setIsSaving(false);
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
          <Typography variant="body" color={Colors.textSecondary}>
            영양제 정보를 불러올 수 없습니다.
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 영양제 정보 */}
          <Card style={styles.supplementCard}>
            <SupplementTagBadge tag={supplement.tag} />
            <Typography variant="h3" style={styles.supplementName}>
              {supplement.name}
            </Typography>
          </Card>

          {/* 1회 복용량 */}
          <View style={styles.inputSection}>
            <Typography variant="h4" style={styles.label}>
              1회 복용량
            </Typography>
            <TextInput
              style={styles.textInput}
              placeholder="예: 1정, 2캡슐"
              placeholderTextColor={Colors.textSecondary}
              value={dosage}
              onChangeText={setDosage}
            />
          </View>

          {/* 복용 시간 */}
          <View style={styles.inputSection}>
            <Typography variant="h4" style={styles.label}>
              복용 시간 (여러 개 선택 가능)
            </Typography>
            <View style={styles.timingGrid}>
              {TIMING_OPTIONS.map((timing) => (
                <TouchableOpacity
                  key={timing}
                  style={[
                    styles.timingButton,
                    selectedTimings.includes(timing) && styles.timingButtonSelected,
                  ]}
                  onPress={() => toggleTiming(timing)}
                >
                  <Typography
                    variant="bodySmall"
                    color={selectedTimings.includes(timing) ? Colors.white : Colors.text}
                  >
                    {TIMING_LABELS[timing]}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 복용 횟수 (선택된 시간대 수에 연동) */}
          <View style={styles.inputSection}>
            <Typography variant="h4" style={styles.label}>
              하루 복용 횟수
            </Typography>
            <View style={styles.frequencyContainer}>
              <Typography variant="h3" style={styles.frequencyValue}>
                {selectedTimings.length}회
              </Typography>
            </View>
          </View>

          {/* 메모 */}
          <View style={styles.inputSection}>
            <Typography variant="h4" style={styles.label}>
              메모 (선택)
            </Typography>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="복용 관련 메모를 입력하세요"
              placeholderTextColor={Colors.textSecondary}
              value={memo}
              onChangeText={setMemo}
              multiline
              numberOfLines={3}
            />
          </View>

          <Button
            title="내 영양제에 추가"
            variant="primary"
            size="large"
            onPress={handleSave}
            loading={isSaving}
            style={styles.submitButton}
          />
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
  flex: {
    flex: 1,
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  supplementCard: {
    marginBottom: 24,
  },
  supplementName: {
    marginTop: 8,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timingButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timingButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  frequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  frequencyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyValue: {
    minWidth: 60,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 8,
  },
});
