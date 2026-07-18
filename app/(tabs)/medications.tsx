import React, { useCallback, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Typography, DeleteConfirmModal, Toast, SupplementTagBadge, TabHeader } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { useResponsive } from '../../hooks';
import { useMedicationStore, useSupplementStore } from '../../stores';
import { MedicationListItemUnified, Reminder } from '../../types';
import { mergeAndSortItems } from '../../utils';

// FAB 버튼 탭바 위 간격
const FAB_BOTTOM_OFFSET = 24;

export default function MedicationsScreen() {
  const { contentStyle } = useResponsive();
  const insets = useSafeAreaInsets();

  // 약물 Store
  const {
    medications,
    fetchMedications,
    deleteMedicationsBatch,
    isLoading: isMedLoading,
    needsRefresh: medNeedsRefresh,
    clearNeedsRefresh: clearMedRefresh,
  } = useMedicationStore();

  // 영양제 Store
  const {
    userSupplements,
    fetchUserSupplements,
    deleteUserSupplementsBatch,
    isLoading: isSuppLoading,
    needsRefresh: suppNeedsRefresh,
    clearNeedsRefresh: clearSuppRefresh,
  } = useSupplementStore();

  // 통합 목록
  const allItems = useMemo(
    () => mergeAndSortItems(medications, userSupplements),
    [medications, userSupplements]
  );

  const isLoading = isMedLoading || isSuppLoading;

  // 선택 모드 상태
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 삭제 확인 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 탭 포커스 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const promises: Promise<void>[] = [];

        // getState()로 최신 상태를 읽어 stale closure 방지
        const medState = useMedicationStore.getState();
        const suppState = useSupplementStore.getState();

        if (medState.medications.length === 0 || medNeedsRefresh) {
          promises.push(medState.fetchMedications().then(() => medState.clearNeedsRefresh()));
        }
        if (suppState.userSupplements.length === 0 || suppNeedsRefresh) {
          promises.push(suppState.fetchUserSupplements().then(() => suppState.clearNeedsRefresh()));
        }

        await Promise.all(promises);
      };

      loadData().catch((err) => {
        console.error('Failed to load data:', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getState()로 최신 상태를 직접 읽으므로 store 변수는 의존성 불필요
    }, [medNeedsRefresh, suppNeedsRefresh])
  );

  // 새로고침
  const handleRefresh = async () => {
    await Promise.all([fetchMedications(), fetchUserSupplements()]);
  };

  // 선택 모드 종료 시 상태 초기화
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  // Long Press로 선택 모드 진입
  const handleLongPress = (item: MedicationListItemUnified) => {
    if (!isSelectMode) {
      setIsSelectMode(true);
      setSelectedIds(new Set([`${item.type}-${item.id}`]));
    }
  };

  // 아이템 선택/해제 토글
  const toggleSelect = (item: MedicationListItemUnified) => {
    if (!isSelectMode) return;

    const key = `${item.type}-${item.id}`;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedIds(newSelected);

    // 선택된 항목이 없으면 선택 모드 종료
    if (newSelected.size === 0) {
      setIsSelectMode(false);
    }
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === allItems.length) {
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } else {
      setSelectedIds(new Set(allItems.map(item => `${item.type}-${item.id}`)));
    }
  };

  // 삭제 실행
  const handleDeleteConfirm = async () => {
    const selectedItems = allItems.filter(item =>
      selectedIds.has(`${item.type}-${item.id}`)
    );

    // 약물과 영양제 분리
    const medIds = selectedItems
      .filter(item => item.type === 'medication')
      .map(item => item.id);
    const suppIds = selectedItems
      .filter(item => item.type === 'supplement')
      .map(item => item.id);

    try {
      const promises: Promise<{ deletedCount: number } | void>[] = [];
      if (medIds.length > 0) {
        promises.push(deleteMedicationsBatch(medIds));
      }
      if (suppIds.length > 0) {
        promises.push(deleteUserSupplementsBatch(suppIds));
      }

      const results = await Promise.all(promises);
      const totalDeleted = results.reduce(
        (sum, r) => sum + ((r as { deletedCount: number })?.deletedCount || 0),
        0
      );

      // 토스트 표시
      setToastMessage(`${totalDeleted}개 삭제됨`);
      setShowToast(true);

      // 선택 모드 종료
      exitSelectMode();
    } catch (err) {
      console.error('Failed to delete items:', err);
      setToastMessage('삭제에 실패했어요. 다시 시도해주세요.');
      setShowToast(true);
    }
  };

  // 선택된 첫 번째 아이템 이름 가져오기
  const getFirstSelectedName = (): string | undefined => {
    const firstKey = Array.from(selectedIds)[0];
    const firstItem = allItems.find(item => `${item.type}-${item.id}` === firstKey);
    return firstItem ? (firstItem.displayName || firstItem.name) : undefined;
  };

  // 아이템 클릭 처리
  const handleItemPress = (item: MedicationListItemUnified) => {
    if (isSelectMode) {
      toggleSelect(item);
    } else {
      if (item.type === 'medication') {
        router.push(`/medication/${item.id}`);
      } else if (item.supplementId) {
        router.push({
          pathname: `/supplement/${item.supplementId}`,
          params: { userSupplementId: String(item.id) },
        });
      }
    }
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

  // 아이템 렌더링 (구분선 스타일 - 박스 없음)
  const renderItem = (item: MedicationListItemUnified, index: number) => {
    const key = `${item.type}-${item.id}`;
    const isSelected = selectedIds.has(key);
    const isLast = index === allItems.length - 1;

    return (
      <View key={key}>
        <Pressable
          onPress={() => handleItemPress(item)}
          onLongPress={() => handleLongPress(item)}
          delayLongPress={500}
          style={[
            styles.medicationItem,
            isSelectMode && isSelected && styles.selectedItem
          ]}
        >
          <View style={styles.medicationRow}>
            {/* 선택 모드일 때 체크박스 표시 */}
            {isSelectMode && (
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected && (
                  <Typography variant="caption" color={Colors.white}>✓</Typography>
                )}
              </View>
            )}

            {/* 아이콘/이미지 */}
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.medThumbnail} resizeMode="cover" />
            ) : (
              <View style={[styles.medThumbnail, styles.medThumbnailPlaceholder]}>
                <Typography variant="body" color={Colors.textSecondary}>
                  {item.type === 'supplement' ? '🍀' : '💊'}
                </Typography>
              </View>
            )}

            <View style={styles.medicationContent}>
              {/* 약 이름 */}
              <View style={styles.nameRow}>
                <Typography variant="body" style={styles.drugName} numberOfLines={1}>
                  {item.displayName || item.name}
                </Typography>
                {/* 영양제 태그 뱃지 */}
                {item.type === 'supplement' && item.supplementTag && (
                  <SupplementTagBadge tag={item.supplementTag} size="small" />
                )}
              </View>

              <View style={styles.medicationInfo}>
                {/* 알림 시간 */}
                <View style={styles.infoItem}>
                  <Typography variant="caption" color={Colors.textSecondary}>
                    알림 시간
                  </Typography>
                  {renderReminderTimeTags(item.reminders)}
                </View>

                {/* 남은 약 (약물만) */}
                {item.type === 'medication' && (
                  <View style={styles.infoItem}>
                    <Typography variant="caption" color={Colors.textSecondary}>
                      남은 약
                    </Typography>
                    <Typography
                      variant="caption"
                      color={
                        (item.daysLeft || 0) <= 3
                          ? Colors.warning
                          : Colors.textPrimary
                      }
                    >
                      {item.remainingCount}개 ({item.daysLeft}일분)
                      {(item.daysLeft || 0) <= 3 && ' ⚠️'}
                    </Typography>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Pressable>

        {/* 구분선 (마지막 아이템이 아닌 경우만) */}
        {!isLast && <View style={styles.divider} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <TabHeader
        title="약 목록"
        subtitle={`등록된 약 ${allItems.length}개`}
        leftContent={
          isSelectMode ? (
            <TouchableOpacity onPress={exitSelectMode}>
              <Typography variant="body" color={Colors.white}>취소</Typography>
            </TouchableOpacity>
          ) : undefined
        }
        rightContent={
          isSelectMode ? (
            <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
              <Typography variant="body" color="#FFB4AB" style={styles.deleteButton}>
                삭제
              </Typography>
            </TouchableOpacity>
          ) : undefined
        }
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, contentStyle, { paddingBottom: 100 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* 전체 선택 체크박스 (선택 모드일 때만) */}
        {isSelectMode && allItems.length > 0 && (
          <TouchableOpacity style={styles.selectAllContainer} onPress={toggleSelectAll}>
            <View style={[styles.checkbox, selectedIds.size === allItems.length && styles.checkboxChecked]}>
              {selectedIds.size === allItems.length && (
                <Typography variant="caption" color={Colors.white}>✓</Typography>
              )}
            </View>
            <Typography variant="body">
              전체 선택
            </Typography>
            <Typography variant="body" color={Colors.textSecondary} style={styles.selectCount}>
              {selectedIds.size}/{allItems.length}개
            </Typography>
          </TouchableOpacity>
        )}

        {allItems.length === 0 ? (
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <Card style={styles.emptyCard} variant="elevated">
              <Typography variant="body" style={styles.emptyText}>
                등록된 약이 없어요
              </Typography>
              <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.emptySubtext}>
                처방전 사진을 찍어 약을 추가해보세요
              </Typography>
            </Card>
          )
        ) : (
          allItems.map((item, index) => renderItem(item, index))
        )}
      </ScrollView>

      {/* FAB - 선택 모드가 아닐 때만 표시, 탭바 바로 위 위치 */}
      {!isSelectMode && (
        <TouchableOpacity
          style={[styles.fab, { bottom: FAB_BOTTOM_OFFSET }]}
          onPress={() => router.push('/medication/add')}
          activeOpacity={0.8}
        >
          <Typography variant="body" color={Colors.white} style={styles.fabText}>
            + 약 추가
          </Typography>
        </TouchableOpacity>
      )}

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  // 아이템 스타일 (박스 없음)
  medicationItem: {
    paddingVertical: 16,
  },
  selectedItem: {
    backgroundColor: Colors.primaryLightest,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  medicationRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  medThumbnail: {
    width: 78,
    height: 62,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  medicationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
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
  // 구분선 스타일
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  // FAB 스타일
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontWeight: '600',
  },
});
