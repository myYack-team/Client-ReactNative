import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Button, Card, Typography } from '../../components/ui';
import { Colors, DEFAULT_TIMES } from '../../constants';
import { useMedicationStore } from '../../stores';
import { ScannedMedication, DuplicateMedication, TimingWithTime, PrescriptionRegisterRequest, RegisterMedicationInfo, MedicationTiming } from '../../types';
import { medicationService, prescriptionService } from '../../services';
import { getTodayString } from '../../utils/dateUtils';

// 시간 옵션 생성 (00:00 ~ 23:30, 30분 간격)
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

// 확장된 약 정보 타입 (시간 배열 추가)
interface MedicationWithTimes extends ScannedMedication {
  times: string[];
  ingredient?: string;
}

// 드래그 가능한 시간 슬롯 아이템 타입
interface TimeSlotItem {
  key: string;
  time: string;
  index: number;
}

// 드래그 가능한 시간 슬롯 리스트 Props
interface DraggableTimeSlotListProps {
  medIndex: number;
  times: string[];
  onReorder: (newTimes: string[]) => void;
  onUpdateTime: (timeIndex: number, newTime: string) => void;
  onRemoveTime: (timeIndex: number) => void;
}

// 드래그 가능한 시간 슬롯 리스트 컴포넌트
function DraggableTimeSlotList({
  medIndex,
  times,
  onReorder,
  onUpdateTime,
  onRemoveTime,
}: DraggableTimeSlotListProps) {
  const data: TimeSlotItem[] = times.map((time, idx) => ({
    key: `time-${medIndex}-${idx}`,
    time,
    index: idx,
  }));

  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<TimeSlotItem>) => {
      const timeIndex = getIndex() ?? item.index;

      return (
        <ScaleDecorator>
          <View style={[
            styles.timeSlotRow,
            isActive && styles.timeSlotRowActive,
          ]}>
            {/* 드래그 핸들 */}
            <TouchableOpacity
              style={styles.dragHandle}
              onPressIn={drag}
              disabled={isActive}
            >
              <Typography variant="caption" color={isActive ? Colors.primary : Colors.textTertiary}>
                ☰
              </Typography>
            </TouchableOpacity>

            {/* 회차 라벨 */}
            <Typography variant="caption" style={styles.timeSlotLabel}>
              {timeIndex + 1}회차
            </Typography>

            {/* 시간 선택 */}
            {Platform.OS === 'ios' ? (
              <Picker
                selectedValue={item.time}
                style={styles.timePicker}
                itemStyle={styles.timePickerItem}
                onValueChange={(value) => onUpdateTime(timeIndex, value)}
              >
                {TIME_OPTIONS.map((t) => (
                  <Picker.Item key={t} label={t} value={t} />
                ))}
              </Picker>
            ) : (
              <View style={styles.androidTimePickerContainer}>
                <TouchableOpacity
                  style={styles.timeAdjustButton}
                  onPress={() => {
                    const currentIdx = TIME_OPTIONS.indexOf(item.time);
                    const newIdx =
                      currentIdx > 0 ? currentIdx - 1 : TIME_OPTIONS.length - 1;
                    onUpdateTime(timeIndex, TIME_OPTIONS[newIdx]);
                  }}
                >
                  <Typography variant="caption">▲</Typography>
                </TouchableOpacity>
                <Typography variant="body" style={styles.timeText}>{item.time}</Typography>
                <TouchableOpacity
                  style={styles.timeAdjustButton}
                  onPress={() => {
                    const currentIdx = TIME_OPTIONS.indexOf(item.time);
                    const newIdx =
                      currentIdx < TIME_OPTIONS.length - 1 ? currentIdx + 1 : 0;
                    onUpdateTime(timeIndex, TIME_OPTIONS[newIdx]);
                  }}
                >
                  <Typography variant="caption">▼</Typography>
                </TouchableOpacity>
              </View>
            )}

            {/* 삭제 버튼 */}
            <TouchableOpacity
              style={[styles.timeControlButtonSmall, times.length <= 1 && styles.disabledButton]}
              onPress={() => onRemoveTime(timeIndex)}
              disabled={times.length <= 1}
            >
              <Typography
                variant="body"
                color={times.length <= 1 ? Colors.textTertiary : Colors.error}
              >
                −
              </Typography>
            </TouchableOpacity>
          </View>
        </ScaleDecorator>
      );
    },
    [times.length, onUpdateTime, onRemoveTime]
  );

  return (
    <View style={styles.timeSlotList}>
      <DraggableFlatList
        data={data}
        onDragEnd={({ data: newData }) => {
          onReorder(newData.map(item => item.time));
        }}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    </View>
  );
}

export default function ResultScreen() {
  const {
    currentScanResult,
    currentImageUri,
    clearScanResult,
    isLoading,
    invalidateScheduleCache,
    invalidateMonthlySummaryCache,
  } = useMedicationStore();

  // 초기 medications에 times 배열 추가 및 null 값 기본값 설정
  const [medications, setMedications] = useState<MedicationWithTimes[]>(() => {
    if (!currentScanResult?.medications) return [];
    return currentScanResult.medications.map((med) => ({
      ...med,
      dosage: med.dosage ?? 1,           // null이면 기본값 1
      frequency: med.frequency ?? 1,      // null이면 기본값 1
      durationDays: med.durationDays ?? 7, // null이면 기본값 7
      totalCount: med.totalCount ?? 7,    // null이면 기본값 7
      times: DEFAULT_TIMES[med.frequency ?? 1] || DEFAULT_TIMES[1],
    }));
  });

  // 체크박스 상태 (모든 약물이 기본적으로 체크됨)
  const [checkedItems, setCheckedItems] = useState<boolean[]>(() => {
    if (!currentScanResult?.medications) return [];
    return currentScanResult.medications.map(() => true);
  });

  // 중복 약물 정보
  const [duplicates, setDuplicates] = useState<DuplicateMedication[]>([]);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);

  // 중복 확인 모달 상태
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // 중복 약물 체크 API 호출
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!currentScanResult?.medications || currentScanResult.medications.length === 0) return;

      // drugItemSeq가 있는 약물들만 필터링
      const drugItemSeqs = currentScanResult.medications
        .filter((med) => med.drugItemSeq)
        .map((med) => med.drugItemSeq!);

      if (drugItemSeqs.length === 0) return;

      setDuplicatesLoading(true);
      try {
        const result = await medicationService.checkDuplicates(drugItemSeqs);
        setDuplicates(result.duplicates);
      } catch (error) {
        console.error('중복 체크 실패:', error);
      } finally {
        setDuplicatesLoading(false);
      }
    };

    checkDuplicates();
  }, [currentScanResult]);

  // 특정 약물이 중복인지 확인
  const getDuplicateInfo = (drugItemSeq?: string): DuplicateMedication | undefined => {
    if (!drugItemSeq) return undefined;
    return duplicates.find((d) => d.drugItemSeq === drugItemSeq);
  };

  // 체크박스 토글
  const toggleCheck = (index: number) => {
    setCheckedItems((prev) => prev.map((checked, i) => (i === index ? !checked : checked)));
  };

  // 선택된 약물 중 중복인 것들
  const getSelectedDuplicates = (): DuplicateMedication[] => {
    return medications
      .filter((med, index) => checkedItems[index] && med.drugItemSeq)
      .map((med) => getDuplicateInfo(med.drugItemSeq))
      .filter((d): d is DuplicateMedication => d !== undefined);
  };

  const updateMedication = (index: number, field: keyof MedicationWithTimes, value: any) => {
    setMedications((prev) =>
      prev.map((med, i) => {
        if (i !== index) return med;

        // frequency 변경 시 times 배열도 업데이트
        if (field === 'frequency') {
          const newFrequency = value as number;
          const newTimes = DEFAULT_TIMES[newFrequency] || DEFAULT_TIMES[1];
          return { ...med, [field]: value, times: newTimes };
        }

        return { ...med, [field]: value };
      })
    );
  };

  const updateTime = (medIndex: number, timeIndex: number, newTime: string) => {
    setMedications((prev) =>
      prev.map((med, i) => {
        if (i !== medIndex) return med;
        const newTimes = [...med.times];
        newTimes[timeIndex] = newTime;
        return { ...med, times: newTimes };
      })
    );
  };

  const addTimeSlot = (medIndex: number) => {
    setMedications((prev) =>
      prev.map((med, i) => {
        if (i !== medIndex) return med;
        if (med.times.length >= 6) return med; // 최대 6회까지
        const lastTime = med.times[med.times.length - 1] || '12:00';
        // 마지막 시간 + 4시간 또는 기본값
        const [h] = lastTime.split(':').map(Number);
        const newHour = (h + 4) % 24;
        const newTime = `${newHour.toString().padStart(2, '0')}:00`;
        return {
          ...med,
          times: [...med.times, newTime],
          frequency: med.times.length + 1,
        };
      })
    );
  };

  const removeTimeSlot = (medIndex: number, timeIndex: number) => {
    setMedications((prev) =>
      prev.map((med, i) => {
        if (i !== medIndex) return med;
        if (med.times.length <= 1) return med; // 최소 1개 유지
        const newTimes = med.times.filter((_, ti) => ti !== timeIndex);
        return {
          ...med,
          times: newTimes,
          frequency: newTimes.length,
        };
      })
    );
  };

  const removeMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
    setCheckedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addNewMedication = () => {
    const newMed: MedicationWithTimes = {
      name: '',
      dosage: 1,
      frequency: 3,
      timings: ['MORNING', 'AFTERNOON', 'EVENING'],
      durationDays: 7,
      totalCount: 21,
      times: DEFAULT_TIMES[3],
    };
    setMedications((prev) => [...prev, newMed]);
    setCheckedItems((prev) => [...prev, true]);
  };

  const handleSubmit = async () => {
    // 체크된 약물만 필터링
    const selectedMedications = medications.filter((_, index) => checkedItems[index]);

    if (selectedMedications.length === 0) {
      Alert.alert('오류', '등록할 약을 선택해주세요.');
      return;
    }

    // 이름이 비어있는 약이 있는지 확인
    const emptyNameMed = selectedMedications.find((med) => !med.name.trim());
    if (emptyNameMed) {
      Alert.alert('오류', '약 이름을 입력해주세요.');
      return;
    }

    // 선택된 약물 중 중복인 것이 있는지 확인
    const selectedDuplicates = getSelectedDuplicates();
    if (selectedDuplicates.length > 0) {
      // 중복 확인 모달 표시
      setShowDuplicateModal(true);
      return;
    }

    // 중복 없으면 바로 등록
    await registerMedications(selectedMedications);
  };

  // 실제 약물 등록 함수 (통합 API 사용)
  const registerMedications = async (medsToRegister: MedicationWithTimes[]) => {
    try {
      if (!currentImageUri) {
        throw new Error('처방전 이미지가 없습니다.');
      }

      const today = getTodayString(); // 로컬 타임존 기준 오늘 날짜

      // 약물 정보를 통합 API 형식으로 변환
      const medications: RegisterMedicationInfo[] = medsToRegister.map((med) => {
        // times 배열과 timings 배열을 매핑하여 TimingWithTime 배열 생성
        const timingsWithTime: TimingWithTime[] = med.times.map((time, idx) => ({
          timing: med.timings[idx] || med.timings[0] || 'MORNING' as MedicationTiming,
          time: time,
        }));

        return {
          drugItemSeq: med.drugItemSeq,
          customDrugName: med.drugItemSeq ? undefined : med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          timings: timingsWithTime,
          durationDays: med.durationDays,
          totalCount: med.totalCount,
          startDate: today,
        };
      });

      // 통합 등록 요청 생성
      const request: PrescriptionRegisterRequest = {
        prescriptionDate: today,
        patientName: currentScanResult?.patientName || undefined,
        hospitalName: currentScanResult?.hospitalName || undefined,
        diagnosis: currentScanResult?.diagnosis || undefined,
        durationDays: currentScanResult?.durationDays || undefined,
        medications,
      };

      // 한번의 API 호출로 처방전 + 약물 일괄 등록
      const result = await prescriptionService.register(currentImageUri, request);
      console.log('[Register] Success:', result);

      // 캐시 무효화 (등록 후 최신 데이터 반영)
      invalidateScheduleCache();
      invalidateMonthlySummaryCache();

      // 스캔 결과 정리 후 홈으로 이동
      clearScanResult();
      Alert.alert('등록 완료', `${result.totalMedicationCount}개의 약이 성공적으로 등록되었어요!`, [
        {
          text: '확인',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error) {
      console.error('[Register] Error:', error);
      // 에러 시 스캔 결과 유지하여 재시도 가능하게 함
      Alert.alert(
        '등록 실패',
        '약 등록에 실패했어요. 다시 시도해주세요.',
        [
          {
            text: '다시 시도',
            style: 'default',
          },
          {
            text: '취소',
            style: 'cancel',
            onPress: () => {
              clearScanResult();
              router.replace('/(tabs)');
            },
          },
        ]
      );
    }
  };

  // 중복 확인 후 등록 진행
  const handleConfirmDuplicate = async () => {
    setShowDuplicateModal(false);
    const selectedMedications = medications.filter((_, index) => checkedItems[index]);
    await registerMedications(selectedMedications);
  };

  if (!currentScanResult || medications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContent}>
          <Typography variant="body">인식된 약이 없어요</Typography>
          <Button
            title="다시 촬영하기"
            variant="primary"
            onPress={() => router.back()}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex1}>
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {currentScanResult.confidence === 'medium' && (
          <Card style={styles.warningCard}>
            <Typography variant="bodySmall" color={Colors.warning}>
              일부 정보가 명확하지 않아요.{'\n'}정보를 확인하고 수정해주세요.
            </Typography>
          </Card>
        )}

        <Typography variant="h3" style={styles.sectionTitle}>
          인식된 약 정보
        </Typography>

        {medications.map((med, index) => {
          const duplicateInfo = getDuplicateInfo(med.drugItemSeq);
          const isChecked = checkedItems[index];

          return (
          <Card key={index} style={isChecked ? styles.medicationCard : [styles.medicationCard, styles.medicationCardUnchecked]} variant="elevated">
            {/* 체크박스 + 중복 뱃지 영역 */}
            <View style={styles.cardTopRow}>
              {/* 체크박스 */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => toggleCheck(index)}
              >
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked && (
                    <Typography variant="caption" color="#FFFFFF">
                      ✓
                    </Typography>
                  )}
                </View>
              </TouchableOpacity>

              {/* 중복 뱃지 */}
              {duplicateInfo && (
                <View style={styles.duplicateBadge}>
                  <Typography variant="caption" color="#FFFFFF" style={styles.duplicateBadgeText}>
                    복용 중
                  </Typography>
                </View>
              )}
            </View>

            {/* 중복 약물 상세 정보 */}
            {duplicateInfo && (
              <View style={styles.duplicateInfo}>
                <Typography variant="caption" color={Colors.warning}>
                  이미 복용 중인 약물입니다 (남은 수량: {duplicateInfo.remainingCount}개, 남은 일수: {duplicateInfo.daysLeft}일)
                </Typography>
              </View>
            )}

            {/* 상단: 이미지 + 이름 + 효능 */}
            <View style={styles.drugHeader}>
              <View style={styles.drugImageContainer}>
                {med.imageUrl ? (
                  <Image source={{ uri: med.imageUrl }} style={styles.drugImage} />
                ) : (
                  <View style={styles.drugImagePlaceholder}>
                    <Typography variant="caption" color={Colors.textSecondary}>
                      💊
                    </Typography>
                  </View>
                )}
              </View>
              <View style={styles.drugInfo}>
                <TextInput
                  style={styles.drugNameInput}
                  value={med.name}
                  onChangeText={(text) => updateMedication(index, 'name', text)}
                  placeholder="약 이름"
                  placeholderTextColor={Colors.textTertiary}
                />
                {med.ingredient && (
                  <Typography
                    variant="caption"
                    color={Colors.textSecondary}
                    numberOfLines={1}
                    style={styles.ingredientText}
                  >
                    성분 : {med.ingredient}
                  </Typography>
                )}
                {med.efficacy ? (
                  <Typography
                    variant="caption"
                    color={Colors.textSecondary}
                    numberOfLines={2}
                    style={styles.efficacyText}
                  >
                    {med.efficacy}
                  </Typography>
                ) : (
                  <Typography variant="caption" color={Colors.textTertiary}>
                    효능 정보 없음
                  </Typography>
                )}
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeMedication(index)}
              >
                <Typography variant="body" color={Colors.error}>
                  ✕
                </Typography>
              </TouchableOpacity>
            </View>

            {/* 복용량 / 하루 횟수 - 가로 배치 */}
            <View style={styles.compactRow}>
              <View style={styles.compactInputGroup}>
                <Typography variant="caption" color={Colors.textSecondary}>
                  1회 복용량
                </Typography>
                <View style={styles.compactInputWithUnit}>
                  <TextInput
                    style={styles.compactInput}
                    value={String(med.dosage)}
                    onChangeText={(text) => updateMedication(index, 'dosage', parseInt(text) || 1)}
                    keyboardType="numeric"
                  />
                  <Typography variant="caption" color={Colors.textSecondary}>
                    정
                  </Typography>
                </View>
              </View>

              <View style={styles.compactInputGroup}>
                <Typography variant="caption" color={Colors.textSecondary}>
                  하루 횟수
                </Typography>
                <View style={styles.compactInputWithUnit}>
                  <TextInput
                    style={styles.compactInput}
                    value={String(med.frequency)}
                    onChangeText={(text) => {
                      const freq = parseInt(text) || 1;
                      updateMedication(index, 'frequency', Math.min(Math.max(freq, 1), 6));
                    }}
                    keyboardType="numeric"
                  />
                  <Typography variant="caption" color={Colors.textSecondary}>
                    회
                  </Typography>
                </View>
              </View>
            </View>

            {/* 복용 시간 */}
            <View style={styles.timeSection}>
              <View style={styles.timeSectionHeader}>
                <Typography variant="caption" color={Colors.textSecondary}>
                  복용 시간
                </Typography>
                <TouchableOpacity
                  style={[styles.addTimeButton, med.times.length >= 6 && styles.disabledButton]}
                  onPress={() => addTimeSlot(index)}
                  disabled={med.times.length >= 6}
                >
                  <Typography
                    variant="caption"
                    color={med.times.length >= 6 ? Colors.textTertiary : Colors.primary}
                  >
                    + 추가
                  </Typography>
                </TouchableOpacity>
              </View>
              <DraggableTimeSlotList
                medIndex={index}
                times={med.times}
                onReorder={(newTimes) => {
                  setMedications(prev => prev.map((m, i) =>
                    i === index ? { ...m, times: newTimes } : m
                  ));
                }}
                onUpdateTime={(timeIndex, newTime) => updateTime(index, timeIndex, newTime)}
                onRemoveTime={(timeIndex) => removeTimeSlot(index, timeIndex)}
              />
            </View>
          </Card>
          );
        })}

        {/* 약 추가하기 버튼 */}
        <TouchableOpacity style={styles.addMedicationButton} onPress={addNewMedication}>
          <Typography variant="body" color={Colors.primary}>
            + 약 추가하기
          </Typography>
        </TouchableOpacity>

        <Typography variant="caption" color={Colors.textSecondary} style={styles.notice}>
          정보가 맞지 않으면 터치해서 수정해주세요
        </Typography>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="확인하고 등록"
          variant="primary"
          size="large"
          onPress={handleSubmit}
          loading={isLoading}
        />
      </View>

      {/* 중복 확인 모달 */}
      <Modal
        visible={showDuplicateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDuplicateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typography variant="h3" style={styles.modalTitle}>
              중복 약물 확인
            </Typography>
            <Typography variant="body" style={styles.modalMessage}>
              {(() => {
                const dups = getSelectedDuplicates();
                if (dups.length === 0) return '';
                if (dups.length === 1) {
                  return `"${dups[0].drugName}"은(는) 이미 복용 중인 약물입니다.\n그래도 등록하시겠습니까?`;
                }
                return `"${dups[0].drugName}" 외 ${dups.length - 1}개의 약물이 이미 복용 중입니다.\n그래도 등록하시겠습니까?`;
              })()}
            </Typography>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDuplicateModal(false)}
              >
                <Typography variant="body" color={Colors.textSecondary}>
                  취소
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmDuplicate}
              >
                <Typography variant="body" color="#FFFFFF">
                  확인
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  retryButton: {
    marginTop: 16,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderColor: Colors.warning,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  medicationCard: {
    marginBottom: 16,
    padding: 16,
  },
  // 약 헤더 (이미지 + 이름 + 효능)
  drugHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drugImageContainer: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  drugImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  drugImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drugInfo: {
    flex: 1,
  },
  drugNameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    padding: 0,
    marginBottom: 4,
  },
  ingredientText: {
    lineHeight: 16,
    marginBottom: 2,
  },
  efficacyText: {
    lineHeight: 18,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  // 복용량/횟수 - 컴팩트 버전
  compactRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  compactInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactInputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 14,
    backgroundColor: Colors.backgroundSecondary,
    width: 40,
    textAlign: 'center',
  },
  // 복용 시간
  timeSection: {
    marginTop: 4,
  },
  timeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addTimeButton: {
    padding: 4,
  },
  timeSlotList: {
    marginTop: 6,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    backgroundColor: Colors.background,
  },
  timeSlotRowActive: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dragHandle: {
    padding: 8,
  },
  timeSlotLabel: {
    width: 36,
  },
  timeControlButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disabledButton: {
    opacity: 0.4,
  },
  timePicker: {
    flex: 1,
    height: 80,
  },
  timePickerItem: {
    fontSize: 14,
    height: 80,
  },
  // Android용 시간 선택
  androidTimePickerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timeAdjustButton: {
    padding: 4,
  },
  timeText: {
    minWidth: 50,
    textAlign: 'center',
  },
  notice: {
    textAlign: 'center',
    marginTop: 8,
  },
  addMedicationButton: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: Colors.background,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  // 체크박스 관련 스타일
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  medicationCardUnchecked: {
    opacity: 0.5,
    backgroundColor: Colors.backgroundSecondary,
  },
  // 중복 뱃지 스타일
  duplicateBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  duplicateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  duplicateInfo: {
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary,
  },
});
