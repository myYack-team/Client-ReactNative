import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, Typography, DeleteConfirmModal, Toast } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';
import { MedicationListItem, Reminder } from '../../types';

export default function MedicationsScreen() {
  const { medications, fetchMedications, deleteMedication, isLoading, error, needsRefresh, clearNeedsRefresh } = useMedicationStore();

  // 선택 모드 상태
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 삭제 확인 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 탭이 실제로 포커스될 때 조건부 데이터 로드
  // - 데이터가 없거나 needsRefresh 플래그가 true일 때만 로드
  useFocusEffect(
    useCallback(() => {
      if (medications.length === 0 || needsRefresh) {
        fetchMedications().then(() => {
          clearNeedsRefresh();
        }).catch((err) => {
          console.error('Failed to fetch medications:', err);
        });
      }
    }, [needsRefresh])
  );

  // 선택 모드 종료 시 상태 초기화
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  // Long Press로 선택 모드 진입
  const handleLongPress = (id: number) => {
    if (!isSelectMode) {
      setIsSelectMode(true);
      setSelectedIds(new Set([id]));
    }
  };

  // 아이템 선택/해제 토글
  const toggleSelect = (id: number) => {
    if (!isSelectMode) return;

    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);

    // 선택된 항목이 없으면 선택 모드 종료
    if (newSelected.size === 0) {
      setIsSelectMode(false);
    }
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === medications.length) {
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } else {
      setSelectedIds(new Set(medications.map(m => m.id)));
    }
  };

  // 삭제 실행
  const handleDeleteConfirm = async () => {
    const idsToDelete = Array.from(selectedIds);
    const deleteCount = idsToDelete.length;

    try {
      // 순차적으로 삭제
      for (const id of idsToDelete) {
        await deleteMedication(id);
      }

      // 토스트 표시
      setToastMessage(`${deleteCount}개 삭제됨`);
      setShowToast(true);

      // 선택 모드 종료
      exitSelectMode();
    } catch (err) {
      console.error('Failed to delete medications:', err);
    }
  };

  // 선택된 첫 번째 약 이름 가져오기
  const getFirstSelectedName = (): string | undefined => {
    const firstId = Array.from(selectedIds)[0];
    const firstMed = medications.find(m => m.id === firstId);
    return firstMed ? getDrugDisplayName(firstMed) : undefined;
  };

  // 약 이름 가져오기 (displayName 우선)
  const getDrugDisplayName = (medication: MedicationListItem): string => {
    return medication.displayName || medication.drugName;
  };

  // 알림 시간 태그 렌더링
  const renderReminderTimeTags = (reminders?: Reminder[]) => {
    if (!reminders || reminders.length === 0) {
      return (
        <Typography variant="caption" color={Colors.textSecondary}>
          알림 설정 없음
        </Typography>
      );
    }
    return (
      <View style={styles.reminderTagsContainer}>
        {reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderTimeTag}>
            <Typography variant="caption" color={Colors.primary}>
              {reminder.time.substring(0, 5)}
            </Typography>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchMedications}
            colors={[Colors.primary]}
          />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {isSelectMode ? (
              <TouchableOpacity onPress={exitSelectMode}>
                <Typography variant="body" color={Colors.primary}>취소</Typography>
              </TouchableOpacity>
            ) : (
              <>
                <Typography variant="h2">약 목록</Typography>
                <Typography variant="body" color={Colors.textSecondary}>
                  등록된 약 {medications.length}개
                </Typography>
              </>
            )}
          </View>
          {isSelectMode && (
            <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
              <Typography variant="body" color={Colors.error} style={styles.deleteButton}>
                삭제
              </Typography>
            </TouchableOpacity>
          )}
        </View>

        {/* 전체 선택 체크박스 (선택 모드일 때만) */}
        {isSelectMode && medications.length > 0 && (
          <TouchableOpacity style={styles.selectAllContainer} onPress={toggleSelectAll}>
            <View style={[styles.checkbox, selectedIds.size === medications.length && styles.checkboxChecked]}>
              {selectedIds.size === medications.length && (
                <Typography variant="caption" color={Colors.white}>✓</Typography>
              )}
            </View>
            <Typography variant="body">
              전체 선택
            </Typography>
            <Typography variant="body" color={Colors.textSecondary} style={styles.selectCount}>
              {selectedIds.size}/{medications.length}개
            </Typography>
          </TouchableOpacity>
        )}

        {error && (
          <Card style={styles.errorCard} variant="elevated">
            <Typography variant="body" color={Colors.error}>
              오류: {error}
            </Typography>
          </Card>
        )}

        {medications.length === 0 && !error ? (
          <Card style={styles.emptyCard} variant="elevated">
            <Typography variant="body" style={styles.emptyText}>
              등록된 약이 없어요
            </Typography>
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.emptySubtext}>
              처방전 사진을 찍어 약을 추가해보세요
            </Typography>
          </Card>
        ) : (
          medications.map((medication) => (
            <Pressable
              key={medication.id}
              onPress={() => {
                if (isSelectMode) {
                  toggleSelect(medication.id);
                } else {
                  router.push(`/medication/${medication.id}`);
                }
              }}
              onLongPress={() => handleLongPress(medication.id)}
              delayLongPress={500}
            >
              <Card
                style={[
                  styles.medicationCard,
                  isSelectMode && selectedIds.has(medication.id) && styles.selectedCard
                ]}
                variant="elevated"
              >
                <View style={styles.medicationRow}>
                  {/* 선택 모드일 때 체크박스 표시 */}
                  {isSelectMode && (
                    <View style={[styles.checkbox, selectedIds.has(medication.id) && styles.checkboxChecked]}>
                      {selectedIds.has(medication.id) && (
                        <Typography variant="caption" color={Colors.white}>✓</Typography>
                      )}
                    </View>
                  )}

                  {/* 약물 이미지 썸네일 */}
                  {medication.imageUrl ? (
                    <Image source={{ uri: medication.imageUrl }} style={styles.medThumbnail} resizeMode="cover" />
                  ) : (
                    <View style={[styles.medThumbnail, styles.medThumbnailPlaceholder]}>
                      <Typography variant="body" color={Colors.textSecondary}>💊</Typography>
                    </View>
                  )}
                  <View style={styles.medicationContent}>
                    <View style={styles.medicationHeader}>
                      <Typography variant="body" style={styles.drugName} numberOfLines={1}>
                        {getDrugDisplayName(medication)}
                      </Typography>
                      <Typography variant="caption" color={Colors.textSecondary}>
                        1회 {medication.dosage}정 / 하루 {medication.frequency}회{medication.ingredientKr ? ` · ${medication.ingredientKr}` : ''}
                      </Typography>
                    </View>

                    <View style={styles.medicationInfo}>
                      <View style={styles.infoItem}>
                        <Typography variant="caption" color={Colors.textSecondary}>
                          알림 시간
                        </Typography>
                        {renderReminderTimeTags(medication.reminders)}
                      </View>

                      <View style={styles.infoItem}>
                        <Typography variant="caption" color={Colors.textSecondary}>
                          남은 약
                        </Typography>
                        <Typography
                          variant="caption"
                          color={
                            medication.daysLeft <= 3
                              ? Colors.warning
                              : Colors.textPrimary
                          }
                        >
                          {medication.remainingCount}개 ({medication.daysLeft}일분)
                          {medication.daysLeft <= 3 && ' ⚠️'}
                        </Typography>
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}

        {!isSelectMode && (
          <Button
            title="+ 약/영양제 추가하기"
            variant="secondary"
            size="large"
            onPress={() => router.push('/medication/add')}
            style={styles.addButton}
          />
        )}
      </ScrollView>

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        itemCount={selectedIds.size}
        itemType="medication"
        firstItemName={getFirstSelectedName()}
      />

      {/* 삭제 완료 토스트 */}
      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  deleteButton: {
    fontWeight: '600',
    fontSize: 16,
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 12,
    gap: 12,
  },
  selectCount: {
    marginLeft: 'auto',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
  },
  medicationCard: {
    marginBottom: 12,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  medicationRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  medThumbnail: {
    width: 60,
    height: 48,
    borderRadius: 8,
  },
  medThumbnailPlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationContent: {
    flex: 1,
  },
  medicationHeader: {
    marginBottom: 8,
  },
  medicationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  drugName: {
    fontWeight: '600',
    fontSize: 17,
  },
  reminderTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  reminderTimeTag: {
    backgroundColor: Colors.primaryLightest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  addButton: {
    marginTop: 24,
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#FFF0F0',
  },
});
