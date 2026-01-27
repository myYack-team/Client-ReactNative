import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Typography, Card, Button, ExpandableText, DrugTypeBadge } from '../../components/ui';
import { Colors, DEFAULT_TIMES } from '../../constants';
import { drugService } from '../../services/drug';
import { medicationService } from '../../services';
import { DrugInfo } from '../../types';
import { useMedicationStore } from '../../stores';
import { formatDateToLocal } from '../../utils/dateUtils';

export default function MedicationRegisterScreen() {
  const { itemSeq } = useLocalSearchParams<{ itemSeq: string }>();
  const { addMedication: addMedicationToStore } = useMedicationStore();

  const [drug, setDrug] = useState<DrugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 복용 설정
  const [dosage, setDosage] = useState(1);
  const [frequency, setFrequency] = useState(3);
  const [durationDays, setDurationDays] = useState(7);
  const [totalCount, setTotalCount] = useState(21);
  const [reminderTimes, setReminderTimes] = useState<string[]>(DEFAULT_TIMES[3]);
  const [startDate, setStartDate] = useState(new Date());
  const [memo, setMemo] = useState('');

  // 시간 선택 모달
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);

  useEffect(() => {
    loadDrugInfo();
  }, [itemSeq]);

  useEffect(() => {
    // 복용 횟수 변경 시 총 개수 자동 계산
    setTotalCount(dosage * frequency * durationDays);
  }, [dosage, frequency, durationDays]);

  useEffect(() => {
    // 복용 횟수 변경 시 알림 시간 개수 조정
    const newTimes = DEFAULT_TIMES[frequency] || DEFAULT_TIMES[3];
    setReminderTimes(newTimes);
  }, [frequency]);

  const loadDrugInfo = async () => {
    if (!itemSeq) return;

    try {
      const result = await drugService.getDrugByItemSeq(itemSeq);
      setDrug(result);
    } catch (error) {
      console.error('약 정보 로드 실패:', error);
      Alert.alert('오류', '약 정보를 불러오지 못했어요.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeEdit = (index: number) => {
    setEditingTimeIndex(index);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate && editingTimeIndex !== null) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${hours}:${minutes}`;
      setReminderTimes((prev) => {
        const updated = [...prev];
        updated[editingTimeIndex] = newTime;
        return updated;
      });
    }
    setEditingTimeIndex(null);
  };

  const handleSubmit = async () => {
    if (!drug) return;

    if (reminderTimes.length === 0) {
      Alert.alert('오류', '알림 시간을 설정해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Store action 사용으로 변경 - 자동으로 캐시 무효화 및 홈 탭 데이터 갱신
      await addMedicationToStore({
        drugItemSeq: drug.itemSeq,
        dosage,
        frequency,
        durationDays,
        totalCount,
        startDate: formatDateToLocal(startDate), // 로컬 타임존 기준 날짜 문자열
        memo: memo || undefined,
        reminderTimes,
      });

      const drugDisplayName = drug.displayName || drug.itemName;
      Alert.alert('등록 완료', `${drugDisplayName}이(가) 등록되었어요.`, [
        { text: '확인', onPress: () => router.replace('/(tabs)/medications') },
      ]);
    } catch (error) {
      console.error('약 등록 실패:', error);
      Alert.alert('오류', '약 등록에 실패했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!drug) {
    return (
      <View style={styles.loadingContainer}>
        <Typography variant="body" color={Colors.textSecondary}>
          약 정보를 찾을 수 없어요
        </Typography>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* 약 정보 카드 */}
          <Card style={styles.drugCard}>
            <View style={styles.drugHeader}>
              {drug.imageUrl ? (
                <Image source={{ uri: drug.imageUrl }} style={styles.drugImage} />
              ) : (
                <View style={styles.drugImagePlaceholder}>
                  <Ionicons name="medical" size={32} color={Colors.textSecondary} />
                </View>
              )}
              <View style={styles.drugInfo}>
                <View style={styles.drugTitleRow}>
                  <Typography variant="h3" style={styles.drugName} numberOfLines={2}>
                    {drug.displayName || drug.itemName}
                  </Typography>
                  {drug.drugType && <DrugTypeBadge type={drug.drugType} />}
                </View>
                {drug.ingredientKr && (
                  <Typography variant="caption" color={Colors.textTertiary}>
                    {drug.ingredientKr}
                  </Typography>
                )}
                <Typography variant="caption" color={Colors.textSecondary}>
                  {drug.entpName}
                </Typography>
              </View>
            </View>
            {drug.efficacy && (
              <View style={styles.efficacyContainer}>
                <Typography variant="caption" color={Colors.textTertiary}>
                  효능/효과
                </Typography>
                <ExpandableText text={drug.efficacy} numberOfLines={3} />
              </View>
            )}
          </Card>

          {/* 복용량 설정 */}
          <View style={styles.section}>
            <Typography variant="h4" style={styles.sectionTitle}>
              복용 설정
            </Typography>

            {/* 1회 복용량 */}
            <View style={styles.settingRow}>
              <Typography variant="body">1회 복용량</Typography>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setDosage(Math.max(1, dosage - 1))}
                >
                  <Ionicons name="remove" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <Typography variant="body" style={styles.counterValue}>
                  {dosage}정
                </Typography>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setDosage(dosage + 1)}
                >
                  <Ionicons name="add" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 1일 복용 횟수 */}
            <View style={styles.settingRow}>
              <Typography variant="body">1일 복용 횟수</Typography>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setFrequency(Math.max(1, frequency - 1))}
                >
                  <Ionicons name="remove" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <Typography variant="body" style={styles.counterValue}>
                  {frequency}회
                </Typography>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setFrequency(Math.min(6, frequency + 1))}
                >
                  <Ionicons name="add" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 복용 기간 */}
            <View style={styles.settingRow}>
              <Typography variant="body">복용 기간</Typography>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setDurationDays(Math.max(1, durationDays - 1))}
                >
                  <Ionicons name="remove" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <Typography variant="body" style={styles.counterValue}>
                  {durationDays}일
                </Typography>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setDurationDays(durationDays + 1)}
                >
                  <Ionicons name="add" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 총 개수 */}
            <View style={styles.totalRow}>
              <Typography variant="body" color={Colors.textSecondary}>
                총 개수
              </Typography>
              <Typography variant="body" color={Colors.primary} style={styles.totalValue}>
                {totalCount}정
              </Typography>
            </View>
          </View>

          {/* 알림 시간 설정 */}
          <View style={styles.section}>
            <Typography variant="h4" style={styles.sectionTitle}>
              알림 시간
            </Typography>
            <View style={styles.timesContainer}>
              {reminderTimes.map((time, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.timeButton}
                  onPress={() => handleTimeEdit(index)}
                >
                  <Typography variant="body">{time}</Typography>
                  <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 메모 */}
          <View style={styles.section}>
            <Typography variant="h4" style={styles.sectionTitle}>
              메모 (선택)
            </Typography>
            <TextInput
              style={styles.memoInput}
              placeholder="복용 관련 메모를 입력하세요"
              placeholderTextColor={Colors.textSecondary}
              value={memo}
              onChangeText={setMemo}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        {/* 등록 버튼 */}
        <View style={styles.footer}>
          <Button
            title="등록하기"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>

        {/* 시간 선택 피커 */}
        {showTimePicker && (
          <DateTimePicker
            value={
              editingTimeIndex !== null
                ? (() => {
                    const [h, m] = reminderTimes[editingTimeIndex].split(':');
                    const date = new Date();
                    date.setHours(parseInt(h), parseInt(m));
                    return date;
                  })()
                : new Date()
            }
            mode="time"
            is24Hour={true}
            display="spinner"
            onChange={handleTimeChange}
          />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  drugCard: {
    padding: 16,
    marginBottom: 20,
  },
  drugHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  drugImage: {
    width: 100,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
  },
  drugImagePlaceholder: {
    width: 100,
    height: 70,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  drugInfo: {
    flex: 1,
  },
  drugTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  drugName: {
    flex: 1,
  },
  efficacyContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    minWidth: 40,
    textAlign: 'center',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  totalValue: {
    fontWeight: '700',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  memoInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
