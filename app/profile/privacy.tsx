import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, Typography, Toast } from '../../components/ui';
import { Colors } from '../../constants';
import { useAuthStore } from '../../stores';
import { userService } from '../../services';

interface MenuItemProps {
  label: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuItem({ label, description, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemContent}>
        <Typography
          variant="body"
          color={danger ? Colors.error : Colors.textPrimary}
        >
          {label}
        </Typography>
        {description && (
          <Typography variant="caption" color={Colors.textSecondary}>
            {description}
          </Typography>
        )}
      </View>
      <Typography variant="body" color={Colors.textSecondary}>{'>'}</Typography>
    </TouchableOpacity>
  );
}

interface MenuSectionProps {
  title: string;
  children: React.ReactNode;
}

function MenuSection({ title, children }: MenuSectionProps) {
  return (
    <Card style={styles.menuSection} variant="elevated">
      <Typography variant="caption" color={Colors.textSecondary} style={styles.sectionTitle}>
        {title}
      </Typography>
      {children}
    </Card>
  );
}

export default function PrivacyScreen() {
  const { logout } = useAuthStore();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const showComingSoon = (feature: string) => {
    setToastMessage(`${feature} 기능은 준비 중입니다.`);
    setShowToast(true);
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // 링크 열기 실패 시 무시
    });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '정말 탈퇴하시겠습니까?\n\n모든 복약 기록, 알림 설정 등 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userService.deleteMe();
      Alert.alert('완료', '회원 탈퇴가 완료되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to delete account:', error);
      Alert.alert('오류', '회원 탈퇴에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* 데이터 관리 */}
        <MenuSection title="데이터 관리">
          <MenuItem
            label="내 데이터 내보내기"
            description="복약 기록을 파일로 저장합니다"
            onPress={() => showComingSoon('데이터 내보내기')}
          />
        </MenuSection>

        {/* 계정 */}
        <MenuSection title="계정">
          <MenuItem
            label={isDeleting ? '탈퇴 처리 중...' : '회원 탈퇴'}
            description="모든 데이터가 삭제됩니다"
            onPress={handleDeleteAccount}
            danger
          />
        </MenuSection>

        {/* 약관 및 정책 */}
        <MenuSection title="약관 및 정책">
          <MenuItem
            label="개인정보 처리방침"
            onPress={() => handleOpenLink('https://myyak.app/privacy')}
          />
          <View style={styles.divider} />
          <MenuItem
            label="이용약관"
            onPress={() => handleOpenLink('https://myyak.app/terms')}
          />
        </MenuSection>
      </View>

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
  content: {
    flex: 1,
    padding: 20,
  },
  menuSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
