import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  Pressable,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Card, Typography, DeleteConfirmModal, Toast } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { Colors, API_BASE_URL } from '../../constants';
import { useResponsive } from '../../hooks';
import { prescriptionService } from '../../services';
import {
  Prescription,
  PrescriptionDetail,
  PRESCRIPTION_STATUS_LABELS,
  PRESCRIPTION_STATUS_COLORS,
} from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

// 이미지 URL 생성 함수 (컴포넌트 외부로 이동)
const getImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${imageUrl}`;
};

// 날짜 포맷 함수 (컴포넌트 외부로 이동)
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

// 처방전 카드 컴포넌트 (메모이제이션)
interface PrescriptionCardProps {
  prescription: Prescription;
  onPress: () => void;
  onLongPress: () => void;
  isSelectMode: boolean;
  isSelected: boolean;
  isLoading?: boolean;
}

const PrescriptionCard = memo(({ prescription, onPress, onLongPress, isSelectMode, isSelected, isLoading }: PrescriptionCardProps) => {
  const status = prescription.status || 'IN_PROGRESS';
  const statusColors = PRESCRIPTION_STATUS_COLORS[status];
  const statusLabel = PRESCRIPTION_STATUS_LABELS[status];

  return (
    <Pressable
      style={[
        styles.prescriptionCard,
        isSelectMode && isSelected && styles.selectedCard,
        isLoading && styles.loadingCard,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      disabled={isLoading}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getImageUrl(prescription.imageUrl) }}
          style={styles.thumbnailImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        />
        {/* 로딩 오버레이 */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.white} />
          </View>
        )}
        {/* 선택 모드일 때 체크박스 */}
        {isSelectMode && (
          <View style={[styles.selectCheckbox, isSelected && styles.selectCheckboxChecked]}>
            {isSelected && (
              <Typography variant="caption" color={Colors.white}>✓</Typography>
            )}
          </View>
        )}
        {/* 복용 상태 뱃지 */}
        {!isSelectMode && !isLoading && (
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Typography
              variant="caption"
              style={{ fontSize: 10, fontWeight: '600' }}
              color={statusColors.text}
            >
              {statusLabel}
            </Typography>
          </View>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Typography variant="bodySmall" numberOfLines={1}>
          {formatDate(prescription.prescriptionDate)}
        </Typography>
        {prescription.hospitalName && (
          <Typography
            variant="caption"
            color={Colors.textSecondary}
            numberOfLines={1}
          >
            {prescription.hospitalName}
          </Typography>
        )}
        <Typography variant="caption" color={Colors.primary}>
          약 {prescription.medicationCount}개
        </Typography>
      </View>
    </Pressable>
  );
});

// 캐시 최대 개수
const MAX_CACHE_SIZE = 5;

export default function PrescriptionScreen() {
  const { contentStyle } = useResponsive();
  const insets = useSafeAreaInsets();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionDetail | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 선택 모드 상태
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 삭제 확인 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 처방전 상세 캐시 (최대 5개, LRU 방식)
  const detailCacheRef = useRef<Map<number, PrescriptionDetail>>(new Map());

  // 상세 조회 로딩 상태 (로딩 중인 처방전 ID 추적)
  const [loadingPrescriptionId, setLoadingPrescriptionId] = useState<number | null>(null);

  // 화면 포커스 상태 추적 (API 취소용)
  const isFocusedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 화면 포커스/블러 시 상태 업데이트
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;

      return () => {
        isFocusedRef.current = false;
        // 화면 벗어날 때 진행 중인 API 요청 취소
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        setLoadingPrescriptionId(null);
      };
    }, [])
  );

  const loadPrescriptions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const data = await prescriptionService.getList();
      setPrescriptions(data.prescriptions);
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsInitialLoad(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // 최초 로드 시에만 또는 데이터가 없을 때만 로드
      if (isInitialLoad || prescriptions.length === 0) {
        loadPrescriptions();
      }
    }, [isInitialLoad, prescriptions.length, loadPrescriptions])
  );

  const handleRefresh = useCallback(() => {
    loadPrescriptions(true);
  }, [loadPrescriptions]);

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
    if (selectedIds.size === prescriptions.length) {
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } else {
      setSelectedIds(new Set(prescriptions.map(p => p.id)));
    }
  };

  // 다중 삭제 실행
  const handleBulkDeleteConfirm = async () => {
    const idsToDelete = Array.from(selectedIds);

    try {
      // 일괄 삭제 API 호출
      const result = await prescriptionService.deleteBatch(idsToDelete);

      // 캐시에서 삭제된 항목 제거
      for (const id of idsToDelete) {
        detailCacheRef.current.delete(id);
      }

      // 토스트 표시
      setToastMessage(`${result.deletedCount}개 삭제됨`);
      setShowToast(true);

      // 선택 모드 종료
      exitSelectMode();

      // 목록 새로고침
      loadPrescriptions();
    } catch (error) {
      console.error('Failed to delete prescriptions:', error);
      Alert.alert('오류', '처방전 삭제에 실패했습니다.');
    }
  };

  // 선택된 첫 번째 처방전 이름 가져오기
  const getFirstSelectedName = (): string | undefined => {
    const firstId = Array.from(selectedIds)[0];
    const firstPres = prescriptions.find(p => p.id === firstId);
    return firstPres ? formatDate(firstPres.prescriptionDate) : undefined;
  };

  const openDetail = async (prescription: Prescription) => {
    // 이미 로딩 중이면 중복 호출 방지
    if (loadingPrescriptionId !== null) {
      return;
    }

    const cache = detailCacheRef.current;

    // 캐시에서 먼저 확인
    if (cache.has(prescription.id)) {
      const cached = cache.get(prescription.id)!;
      // LRU: 캐시 히트 시 순서 갱신 (삭제 후 재삽입)
      cache.delete(prescription.id);
      cache.set(prescription.id, cached);
      setSelectedPrescription(cached);
      setIsModalVisible(true);
      return;
    }

    // 캐시에 없으면 API 호출
    setLoadingPrescriptionId(prescription.id);

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const detail = await prescriptionService.getDetail(prescription.id);

      // 화면이 포커스 상태가 아니면 모달 열지 않음
      if (!isFocusedRef.current) {
        return;
      }

      // 캐시 크기 제한 (LRU: 가장 오래된 항목 제거)
      if (cache.size >= MAX_CACHE_SIZE) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) {
          cache.delete(oldestKey);
        }
      }

      // 새 데이터 캐시에 추가
      cache.set(prescription.id, detail);

      setSelectedPrescription(detail);
      setIsModalVisible(true);
    } catch (error: any) {
      // AbortError는 무시 (의도적 취소)
      if (error?.name === 'AbortError' || error?.message === 'Aborted') {
        return;
      }
      console.error('Failed to load prescription detail:', error);
      if (isFocusedRef.current) {
        Alert.alert('오류', '처방전 정보를 불러올 수 없습니다.');
      }
    } finally {
      setLoadingPrescriptionId(null);
      abortControllerRef.current = null;
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedPrescription(null);
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      '처방전 삭제',
      '이 처방전을 삭제하시겠습니까?\n연결된 약품과의 연결이 해제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await prescriptionService.delete(id);
              // 삭제된 처방전 캐시에서 제거
              detailCacheRef.current.delete(id);
              closeModal();
              loadPrescriptions();
            } catch (error) {
              console.error('Failed to delete prescription:', error);
              Alert.alert('오류', '처방전 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, contentStyle, { paddingBottom: 40 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
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
                <View style={styles.headerTitleRow}>
                  <RNImage
                    source={require('../../assets/icons_iamge_processed/03_Clipboard.png')}
                    style={styles.headerIcon}
                    accessibilityLabel="Clipboard icon"
                    resizeMode="contain"
                  />
                  <Typography variant="h2">처방 기록</Typography>
                </View>
                <Typography variant="body" color={Colors.textSecondary}>
                  스캔한 처방전을 모아볼 수 있어요
                </Typography>
              </>
            )}
          </View>
          {isSelectMode ? (
            <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
              <Typography variant="body" color={Colors.error} style={styles.deleteButton}>
                삭제
              </Typography>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* 전체 선택 체크박스 (선택 모드일 때만) */}
        {isSelectMode && prescriptions.length > 0 && (
          <TouchableOpacity style={styles.selectAllContainer} onPress={toggleSelectAll}>
            <View style={[styles.checkbox, selectedIds.size === prescriptions.length && styles.checkboxChecked]}>
              {selectedIds.size === prescriptions.length && (
                <Typography variant="caption" color={Colors.white}>✓</Typography>
              )}
            </View>
            <Typography variant="body">
              전체 선택
            </Typography>
            <Typography variant="body" color={Colors.textSecondary} style={styles.selectCount}>
              {selectedIds.size}/{prescriptions.length}개
            </Typography>
          </TouchableOpacity>
        )}

        {prescriptions.length === 0 ? (
          <Card style={styles.emptyCard} variant="elevated">
            <Typography variant="h3" style={styles.emptyEmoji}>
              📋
            </Typography>
            <Typography variant="body" style={styles.emptyText}>
              저장된 처방전이 없어요
            </Typography>
            <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.emptySubtext}>
              약 추가하기 버튼을 눌러{'\n'}처방전을 스캔해보세요
            </Typography>
          </Card>
        ) : (
          <View style={styles.grid}>
            {prescriptions.map((prescription) => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
                onPress={() => {
                  if (isSelectMode) {
                    toggleSelect(prescription.id);
                  } else {
                    openDetail(prescription);
                  }
                }}
                onLongPress={() => handleLongPress(prescription.id)}
                isSelectMode={isSelectMode}
                isSelected={selectedIds.has(prescription.id)}
                isLoading={loadingPrescriptionId === prescription.id}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleBulkDeleteConfirm}
        itemCount={selectedIds.size}
        itemType="prescription"
        firstItemName={getFirstSelectedName()}
      />

      {/* 삭제 완료 토스트 */}
      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
      />

      {/* 처방전 상세 모달 */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Typography variant="body" color={Colors.primary}>
                닫기
              </Typography>
            </TouchableOpacity>
            <Typography variant="h3">처방전 상세</Typography>
            <TouchableOpacity
              onPress={() => selectedPrescription && handleDelete(selectedPrescription.id)}
            >
              <Typography variant="body" color={Colors.error}>
                삭제
              </Typography>
            </TouchableOpacity>
          </View>

          {selectedPrescription && (
            <ScrollView style={styles.modalContent}>
              {/* 처방전 이미지 */}
              <Image
                source={{ uri: getImageUrl(selectedPrescription.imageUrl) }}
                style={styles.detailImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />

              {/* 처방전 정보 */}
              <View style={styles.detailInfo}>
                {/* 복용 상태 뱃지 */}
                {selectedPrescription.status && (
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.detailStatusBadge,
                        { backgroundColor: PRESCRIPTION_STATUS_COLORS[selectedPrescription.status].bg },
                      ]}
                    >
                      <Typography
                        variant="bodySmall"
                        style={{ fontWeight: '600' }}
                        color={PRESCRIPTION_STATUS_COLORS[selectedPrescription.status].text}
                      >
                        {PRESCRIPTION_STATUS_LABELS[selectedPrescription.status]}
                      </Typography>
                    </View>
                  </View>
                )}

                {/* 처방일 */}
                <View style={styles.infoRow}>
                  <Typography variant="body" style={styles.infoLabel}>
                    처방일
                  </Typography>
                  <Typography variant="body">
                    {formatDate(selectedPrescription.prescriptionDate)}
                  </Typography>
                </View>

                {/* 환자명 */}
                {selectedPrescription.patientName && (
                  <View style={styles.infoRow}>
                    <Typography variant="body" style={styles.infoLabel}>
                      환자명
                    </Typography>
                    <Typography variant="body">
                      {selectedPrescription.patientName}
                    </Typography>
                  </View>
                )}

                {/* 병원명 */}
                {selectedPrescription.hospitalName && (
                  <View style={styles.infoRow}>
                    <Typography variant="body" style={styles.infoLabel}>
                      병원
                    </Typography>
                    <Typography variant="body">
                      {selectedPrescription.hospitalName}
                    </Typography>
                  </View>
                )}

                {/* 처방의사 */}
                {selectedPrescription.doctorName && (
                  <View style={styles.infoRow}>
                    <Typography variant="body" style={styles.infoLabel}>
                      처방의사
                    </Typography>
                    <Typography variant="body">
                      {selectedPrescription.doctorName}
                    </Typography>
                  </View>
                )}

                {/* 진단명 */}
                {selectedPrescription.diagnosis && (
                  <View style={styles.infoRow}>
                    <Typography variant="body" style={styles.infoLabel}>
                      진단명
                    </Typography>
                    <Typography variant="body" style={styles.infoValue}>
                      {selectedPrescription.diagnosis}
                    </Typography>
                  </View>
                )}

                {/* 복용기간 */}
                {selectedPrescription.durationDays && (
                  <View style={styles.infoRow}>
                    <Typography variant="body" style={styles.infoLabel}>
                      복용기간
                    </Typography>
                    <Typography variant="body">
                      {selectedPrescription.durationDays}일
                    </Typography>
                  </View>
                )}

                {/* 메모 */}
                {selectedPrescription.notes && (
                  <View style={styles.infoRow}>
                    <Typography variant="body" style={styles.infoLabel}>
                      메모
                    </Typography>
                    <Typography variant="body" style={styles.infoValue}>
                      {selectedPrescription.notes}
                    </Typography>
                  </View>
                )}
              </View>

              {/* 연결된 약품 목록 */}
              {selectedPrescription.medications.length > 0 && (
                <View style={styles.medicationsSection}>
                  <Typography variant="h3" style={styles.sectionTitle}>
                    연결된 약품 ({selectedPrescription.medications.length})
                  </Typography>
                  {selectedPrescription.medications.map((med) => (
                    <Card key={med.id} style={styles.medicationCard} variant="outlined">
                      <View style={styles.medCardHeader}>
                        {med.imageUrl ? (
                          <Image
                            source={{ uri: med.imageUrl }}
                            style={styles.medImage}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <View style={styles.medImagePlaceholder}>
                            <Typography variant="caption" color={Colors.textSecondary}>
                              💊
                            </Typography>
                          </View>
                        )}
                        <View style={styles.medInfo}>
                          <Typography variant="body" style={{ fontWeight: '600' }} numberOfLines={2}>
                            {med.displayName || med.drugName}
                          </Typography>
                          <Typography variant="caption" color={Colors.textSecondary}>
                            {med.dosage} · 하루 {med.frequency}회
                            {med.durationDays ? ` · ${med.durationDays}일분` : ''}
                          </Typography>
                        </View>
                      </View>
                      {/* 잔여량 및 알림 정보 */}
                      <View style={styles.medDetails}>
                        {med.remainingCount !== undefined && (
                          <View style={styles.medDetailItem}>
                            <Typography variant="caption" color={Colors.textSecondary}>
                              남은 약
                            </Typography>
                            <Typography variant="bodySmall" color={Colors.primary}>
                              {med.remainingCount}개
                            </Typography>
                          </View>
                        )}
                        {med.daysLeft !== undefined && med.daysLeft > 0 && (
                          <View style={styles.medDetailItem}>
                            <Typography variant="caption" color={Colors.textSecondary}>
                              남은 일수
                            </Typography>
                            <Typography variant="bodySmall" color={Colors.primary}>
                              {med.daysLeft}일
                            </Typography>
                          </View>
                        )}
                        {med.reminders && med.reminders.length > 0 && (
                          <View style={styles.medDetailItem}>
                            <Typography variant="caption" color={Colors.textSecondary}>
                              알림
                            </Typography>
                            <Typography variant="bodySmall" color={Colors.primary}>
                              {med.reminders.filter((r) => r.enabled).map((r) => r.time).join(', ')}
                            </Typography>
                          </View>
                        )}
                      </View>
                    </Card>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 28,
    height: 28,
  },
  deleteButton: {
    fontWeight: '600',
    fontSize: 16,
  },
  settingsButton: {
    padding: 4,
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
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  prescriptionCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  loadingCard: {
    opacity: 0.7,
  },
  imageContainer: {
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    backgroundColor: Colors.backgroundSecondary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectCheckbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCheckboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardInfo: {
    padding: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modalContent: {
    flex: 1,
  },
  detailImage: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.black,
  },
  detailInfo: {
    padding: 20,
    backgroundColor: Colors.white,
  },
  statusRow: {
    marginBottom: 12,
  },
  detailStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  infoLabel: {
    fontWeight: '600',
    color: Colors.textSecondary,
    minWidth: 80,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
  },
  medicationsSection: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  medicationCard: {
    marginBottom: 12,
    padding: 16,
  },
  medCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  medImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medInfo: {
    flex: 1,
    marginLeft: 12,
  },
  medDetails: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 16,
  },
  medDetailItem: {
    alignItems: 'center',
  },
});
