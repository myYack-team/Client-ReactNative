import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Typography, Button, Card, SupplementTagBadge } from '../../components/ui';
import { Colors } from '../../constants';
import { supplementService } from '../../services';
import { SupplementDetail, UserSupplementDetail, MedicationTiming, TIMING_LABELS, TIMING_OPTIONS, UpdateUserSupplementRequest } from '../../types';

export default function SupplementDetailScreen() {
  const { id, userSupplementId } = useLocalSearchParams<{ id: string; userSupplementId?: string }>();
  const [supplement, setSupplement] = useState<SupplementDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSupplement, setUserSupplement] = useState<UserSupplementDetail | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editDosage, setEditDosage] = useState('');
  const [editFrequency, setEditFrequency] = useState('');
  const [editTimings, setEditTimings] = useState<MedicationTiming[]>([]);
  const [editMemo, setEditMemo] = useState('');
  const [editReminderTimes, setEditReminderTimes] = useState<Record<string, string>>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTiming, setEditingTiming] = useState<MedicationTiming | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSupplementDetail();
    loadUserSupplementDetail();
  }, [id, userSupplementId]);

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

  const loadUserSupplementDetail = async () => {
    if (!userSupplementId) {
      setUserSupplement(null);
      return;
    }
    try {
      const data = await supplementService.getUserSupplementDetail(parseInt(userSupplementId));
      setUserSupplement(data);
    } catch (error) {
      console.error('Failed to load user supplement detail:', error);
    }
  };

  const handleOpenEditModal = () => {
    if (!userSupplement) return;
    setEditDosage(userSupplement.dosage);
    setEditFrequency(String(userSupplement.frequency));
    setEditTimings(userSupplement.timings);
    setEditMemo(userSupplement.memo || '');

    // 기존 리마인더 시간 초기화
    const defaultTimes: Record<string, string> = {
      MORNING: '08:00',
      AFTERNOON: '12:30',
      EVENING: '18:30',
      AS_NEEDED: '',
    };
    if (userSupplement.reminders && userSupplement.reminders.length > 0) {
      const times: Record<string, string> = { ...defaultTimes };
      userSupplement.reminders.forEach((r) => {
        times[r.timing] = r.time;
      });
      setEditReminderTimes(times);
    } else {
      setEditReminderTimes(defaultTimes);
    }

    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!userSupplementId) return;
    const freq = parseInt(editFrequency);
    if (!editDosage.trim() || isNaN(freq) || freq <= 0 || editTimings.length === 0) {
      Alert.alert('입력 오류', '복용량, 복용 횟수, 복용 시간을 올바르게 입력해주세요.');
      return;
    }
    setIsSaving(true);
    try {
      const reminderTimesArray = editTimings.map((t) => editReminderTimes[t] || null);
      const updateData: UpdateUserSupplementRequest = {
        dosage: editDosage.trim(),
        frequency: freq,
        timings: editTimings,
        reminderTimes: reminderTimesArray,
        memo: editMemo.trim() || undefined,
      };
      await supplementService.updateUserSupplement(parseInt(userSupplementId), updateData);
      await loadUserSupplementDetail();
      setIsEditModalVisible(false);
      Alert.alert('수정 완료', '복용 정보가 수정되었습니다.');
    } catch (error) {
      Alert.alert('오류', '수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '영양제 삭제',
      '내 영양제 목록에서 삭제하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await supplementService.deleteUserSupplement(parseInt(userSupplementId!));
              router.back();
            } catch (error) {
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const toggleTiming = (timing: MedicationTiming) => {
    setEditTimings(prev =>
      prev.includes(timing)
        ? prev.filter(t => t !== timing)
        : [...prev, timing]
    );
  };

  const handleEditTimeEdit = (timing: MedicationTiming) => {
    setEditingTiming(timing);
    setShowTimePicker(true);
  };

  const handleEditTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate && editingTiming) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setEditReminderTimes((prev) => ({
        ...prev,
        [editingTiming]: `${hours}:${minutes}`,
      }));
    }
    setEditingTiming(null);
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

        {/* 내 복용 정보 - userSupplement가 있을 때만 표시 */}
        {userSupplement && (
          <Card style={styles.infoCard}>
            <Typography variant="h4" style={styles.sectionTitle}>
              내 복용 정보
            </Typography>
            <View style={styles.infoRow}>
              <Typography variant="bodySmall" color={Colors.textSecondary}>복용량</Typography>
              <Typography variant="bodySmall">{userSupplement.dosage}</Typography>
            </View>
            <View style={styles.infoRow}>
              <Typography variant="bodySmall" color={Colors.textSecondary}>복용 횟수</Typography>
              <Typography variant="bodySmall">하루 {userSupplement.frequency}회</Typography>
            </View>
            <View style={styles.infoRow}>
              <Typography variant="bodySmall" color={Colors.textSecondary}>복용 시간</Typography>
              <Typography variant="bodySmall">
                {userSupplement.timings.map(t => TIMING_LABELS[t]).join(', ')}
              </Typography>
            </View>
            <View style={styles.infoRow}>
              <Typography variant="bodySmall" color={Colors.textSecondary}>시작일</Typography>
              <Typography variant="bodySmall">
                {new Date(userSupplement.startDate).toLocaleDateString('ko-KR')}
              </Typography>
            </View>
            {userSupplement.memo && (
              <View style={styles.infoRow}>
                <Typography variant="bodySmall" color={Colors.textSecondary}>메모</Typography>
                <Typography variant="bodySmall">{userSupplement.memo}</Typography>
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomButton}>
        {userSupplementId ? (
          <View style={styles.buttonRow}>
            <Button
              title="수정하기"
              variant="primary"
              size="large"
              onPress={handleOpenEditModal}
              style={styles.flexButton}
            />
            <Button
              title="삭제하기"
              variant="danger"
              size="large"
              onPress={handleDelete}
              style={styles.flexButton}
            />
          </View>
        ) : (
          <Button
            title="내 영양제에 추가하기"
            variant="primary"
            size="large"
            onPress={() => {
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
        )}
      </View>

      {/* 수정 모달 */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">복용 정보 수정</Typography>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.fieldLabel}>
                복용량
              </Typography>
              <TextInput
                style={styles.input}
                value={editDosage}
                onChangeText={setEditDosage}
                placeholder="예: 1정"
              />

              <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.fieldLabel}>
                하루 복용 횟수
              </Typography>
              <TextInput
                style={styles.input}
                value={editFrequency}
                onChangeText={setEditFrequency}
                placeholder="예: 2"
                keyboardType="number-pad"
              />

              <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.fieldLabel}>
                복용 시간
              </Typography>
              <View style={styles.timingContainer}>
                {TIMING_OPTIONS.map((timing) => (
                  <TouchableOpacity
                    key={timing}
                    style={[
                      styles.timingChip,
                      editTimings.includes(timing) && styles.timingChipSelected,
                    ]}
                    onPress={() => toggleTiming(timing)}
                  >
                    <Typography
                      variant="bodySmall"
                      color={editTimings.includes(timing) ? '#FFFFFF' : Colors.textSecondary}
                    >
                      {TIMING_LABELS[timing]}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 선택된 시간대별 알림 시간 설정 */}
              {editTimings.length > 0 && (
                <View style={styles.reminderTimesContainer}>
                  <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.reminderTimesLabel}>
                    알림 시간 (터치하여 변경)
                  </Typography>
                  {editTimings.map((timing) => (
                    <TouchableOpacity
                      key={timing}
                      style={styles.reminderTimeRow}
                      onPress={() => handleEditTimeEdit(timing)}
                    >
                      <Typography variant="body">{TIMING_LABELS[timing]}</Typography>
                      <View style={styles.reminderTimeValue}>
                        <Typography variant="body">{editReminderTimes[timing] || '08:00'}</Typography>
                        <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.fieldLabel}>
                메모
              </Typography>
              <TextInput
                style={[styles.input, styles.memoInput]}
                value={editMemo}
                onChangeText={setEditMemo}
                placeholder="메모 입력 (선택)"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="저장"
                variant="primary"
                size="large"
                onPress={handleSaveEdit}
                loading={isSaving}
              />
            </View>

            {/* 시간 선택 피커 */}
            {showTimePicker && (
              <DateTimePicker
                value={
                  editingTiming
                    ? (() => {
                        const [h, m] = (editReminderTimes[editingTiming] || '08:00').split(':');
                        const date = new Date();
                        date.setHours(parseInt(h), parseInt(m));
                        return date;
                      })()
                    : new Date()
                }
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleEditTimeChange}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fieldLabel: {
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  memoInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  timingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timingChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  timingChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  reminderTimesContainer: {
    marginTop: 12,
    gap: 8,
  },
  reminderTimesLabel: {
    marginBottom: 4,
  },
  reminderTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  reminderTimeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
