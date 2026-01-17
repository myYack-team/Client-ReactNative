import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Typography, TermsModal, TermsType } from '../../components/ui';
import { Colors } from '../../constants';
import { useAuthStore } from '../../stores/authStore';
import * as SecureStore from 'expo-secure-store';

// 동의 항목 타입
interface ConsentItem {
  id: string;
  title: string;
  required: boolean;
  description: string;
  detailUrl?: string;
}

// 동의 항목 정의 (AI 동의는 별도 화면에서 처리)
const CONSENT_ITEMS: ConsentItem[] = [
  {
    id: 'terms',
    title: '이용약관 동의',
    required: true,
    description: '마이약 서비스 이용약관에 동의합니다.',
    detailUrl: 'terms',
  },
  {
    id: 'privacy',
    title: '개인정보 처리방침 동의',
    required: true,
    description: '개인정보 수집 및 이용에 동의합니다.',
    detailUrl: 'privacy',
  },
];

// 체크박스 컴포넌트
interface CheckboxItemProps {
  item: ConsentItem;
  checked: boolean;
  onToggle: () => void;
  onViewDetail?: () => void;
}

function CheckboxItem({ item, checked, onToggle, onViewDetail }: CheckboxItemProps) {
  return (
    <View style={styles.consentItem}>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Typography style={styles.checkmark}>✓</Typography>}
        </View>
        <View style={styles.consentTextContainer}>
          <View style={styles.titleRow}>
            <Typography variant="body" style={styles.consentTitle}>
              [{item.title}]
            </Typography>
            <Typography variant="caption" color={Colors.error}>
              (필수)
            </Typography>
          </View>
        </View>
      </TouchableOpacity>
      <Typography
        variant="bodySmall"
        color={Colors.textSecondary}
        style={styles.consentDescription}
      >
        {item.description}
      </Typography>
      {item.detailUrl && (
        <TouchableOpacity onPress={onViewDetail} style={styles.viewDetailButton}>
          <Typography variant="caption" color={Colors.secondary}>
            전문 보기 →
          </Typography>
        </TouchableOpacity>
      )}
    </View>
  );
}

// 동의 상태 저장 키
const CONSENT_STORAGE_KEY = 'user_consent_completed';

export default function ConsentScreen() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [modalType, setModalType] = useState<TermsType | null>(null);
  const { user } = useAuthStore();

  // 개별 항목 토글
  const toggleItem = (itemId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // 모두 동의 상태 확인
  const isAllChecked = CONSENT_ITEMS.every((item) => checkedItems[item.id]);

  // 모두 동의 토글
  const toggleAll = () => {
    if (isAllChecked) {
      setCheckedItems({});
    } else {
      const allChecked: Record<string, boolean> = {};
      CONSENT_ITEMS.forEach((item) => {
        allChecked[item.id] = true;
      });
      setCheckedItems(allChecked);
    }
  };

  // 필수 항목 모두 동의했는지 확인
  const isFormValid = CONSENT_ITEMS.filter((item) => item.required).every(
    (item) => checkedItems[item.id]
  );

  // 전문 보기 (모달로 변경)
  const handleViewDetail = (type?: string) => {
    if (type === 'terms' || type === 'privacy') {
      setModalType(type);
    }
  };

  // 동의 완료 처리
  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      // 동의 완료 상태를 로컬에 저장
      await SecureStore.setItemAsync(CONSENT_STORAGE_KEY, 'true');

      // 신규 사용자면 프로필 설정으로, 기존 사용자면 메인으로
      const needsOnboarding = useAuthStore.getState().needsOnboarding;
      if (needsOnboarding) {
        router.replace('/profile-setup');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('동의 저장 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typography variant="h1" style={styles.title}>
            서비스 이용 동의
          </Typography>
          <Typography variant="body" color={Colors.textSecondary}>
            마이약 서비스 이용을 위해 아래 약관에 동의해주세요.
          </Typography>
        </View>

        {/* 모두 동의 */}
        <TouchableOpacity
          style={[styles.allAgreeRow, isAllChecked && styles.allAgreeRowChecked]}
          onPress={toggleAll}
          activeOpacity={0.7}
        >
          <View style={[styles.checkboxLarge, isAllChecked && styles.checkboxChecked]}>
            {isAllChecked && <Typography style={styles.checkmark}>✓</Typography>}
          </View>
          <Typography variant="h3" style={styles.allAgreeText}>
            모두 동의합니다
          </Typography>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* 개별 동의 항목 */}
        {CONSENT_ITEMS.map((item) => (
          <CheckboxItem
            key={item.id}
            item={item}
            checked={checkedItems[item.id] || false}
            onToggle={() => toggleItem(item.id)}
            onViewDetail={() => handleViewDetail(item.detailUrl)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="동의하고 시작하기"
          onPress={handleSubmit}
          disabled={!isFormValid}
          loading={isLoading}
          style={styles.submitButton}
        />
      </View>

      {/* 약관 상세 모달 */}
      {modalType && (
        <TermsModal
          visible={modalType !== null}
          onClose={() => setModalType(null)}
          type={modalType}
        />
      )}
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
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  allAgreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    marginBottom: 16,
  },
  allAgreeRowChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLightest,
  },
  allAgreeText: {
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  consentItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  checkboxLarge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  consentTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  consentTitle: {
    fontWeight: '600',
  },
  consentDescription: {
    marginTop: 8,
    marginLeft: 36,
    lineHeight: 20,
  },
  viewDetailButton: {
    marginTop: 8,
    marginLeft: 36,
    alignSelf: 'flex-start',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    height: 56,
  },
});
