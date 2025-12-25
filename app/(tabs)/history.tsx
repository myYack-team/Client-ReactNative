import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Card, Typography } from '../../components/ui';
import { Colors, API_BASE_URL } from '../../constants';
import { prescriptionService } from '../../services';
import { Prescription, PrescriptionDetail } from '../../types';

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
}

const PrescriptionCard = memo(({ prescription, onPress }: PrescriptionCardProps) => (
  <TouchableOpacity
    style={styles.prescriptionCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Image
      source={{ uri: getImageUrl(prescription.imageUrl) }}
      style={styles.thumbnailImage}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={200}
      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
    />
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
  </TouchableOpacity>
));

export default function PrescriptionScreen() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionDetail | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  const openDetail = async (prescription: Prescription) => {
    try {
      const detail = await prescriptionService.getDetail(prescription.id);
      setSelectedPrescription(detail);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Failed to load prescription detail:', error);
      Alert.alert('오류', '처방전 정보를 불러올 수 없습니다.');
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
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Typography variant="h2">처방 기록</Typography>
          <Typography variant="body" color={Colors.textSecondary}>
            스캔한 처방전을 모아볼 수 있어요
          </Typography>
        </View>

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
                onPress={() => openDetail(prescription)}
              />
            ))}
          </View>
        )}
      </ScrollView>

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
              <Image
                source={{ uri: getImageUrl(selectedPrescription.imageUrl) }}
                style={styles.detailImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />

              <View style={styles.detailInfo}>
                <View style={styles.infoRow}>
                  <Typography variant="body" color={Colors.textSecondary}>
                    처방일
                  </Typography>
                  <Typography variant="body">
                    {formatDate(selectedPrescription.prescriptionDate)}
                  </Typography>
                </View>

                {selectedPrescription.hospitalName && (
                  <View style={styles.infoRow}>
                    <Typography variant="body" color={Colors.textSecondary}>
                      병원명
                    </Typography>
                    <Typography variant="body">
                      {selectedPrescription.hospitalName}
                    </Typography>
                  </View>
                )}

                {selectedPrescription.notes && (
                  <View style={styles.infoRow}>
                    <Typography variant="body" color={Colors.textSecondary}>
                      메모
                    </Typography>
                    <Typography variant="body">{selectedPrescription.notes}</Typography>
                  </View>
                )}
              </View>

              {selectedPrescription.medications.length > 0 && (
                <View style={styles.medicationsSection}>
                  <Typography variant="h3" style={styles.sectionTitle}>
                    연결된 약품 ({selectedPrescription.medications.length})
                  </Typography>
                  {selectedPrescription.medications.map((med) => (
                    <Card key={med.id} style={styles.medicationCard}>
                      <Typography variant="body">{med.drugName}</Typography>
                      <Typography variant="caption" color={Colors.textSecondary}>
                        {med.dosage}정 · 하루 {med.frequency}회 · {med.durationDays}일분
                      </Typography>
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
    marginBottom: 24,
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
  thumbnailImage: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    backgroundColor: Colors.backgroundSecondary,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  medicationsSection: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  medicationCard: {
    marginBottom: 8,
    padding: 12,
  },
});
