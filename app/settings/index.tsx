import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useResponsive } from '../../hooks';
import { useAuthStore } from '../../stores';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showDivider?: boolean;
  labelColor?: string;
}

function MenuItem({ icon, label, onPress, showDivider = true, labelColor }: MenuItemProps) {
  return (
    <>
      <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
        <View style={styles.menuItemLeft}>
          <Ionicons name={icon} size={20} color={Colors.textSecondary} />
          <Typography variant="body" color={labelColor ?? Colors.textPrimary}>{label}</Typography>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
      </TouchableOpacity>
      {showDivider && <View style={styles.rowDivider} />}
    </>
  );
}

interface MenuSectionProps {
  title?: string;
  children: React.ReactNode;
}

function MenuSection({ title, children }: MenuSectionProps) {
  return (
    <View style={styles.menuSection}>
      {title && (
        <Typography variant="caption" color={Colors.textTertiary} style={styles.sectionTitle}>
          {title}
        </Typography>
      )}
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { contentStyle } = useResponsive();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, contentStyle, { paddingBottom: 40 + insets.bottom }]}
      >
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
              <Ionicons name="person" size={28} color={Colors.textLight} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Typography variant="h3">{user?.name || '사용자'}</Typography>
            <View style={styles.loginBadge}>
              <View style={styles.kakaoDot} />
              <Typography variant="caption" color={Colors.textSecondary}>
                카카오 계정 연결됨
              </Typography>
            </View>
          </View>
        </View>

        {/* 복약 관리 */}
        <MenuSection title="복약 관리">
          <MenuItem
            icon="list-outline"
            label="내 복약 목록"
            onPress={() => router.push('/(tabs)/medications')}
          />
          <MenuItem
            icon="notifications-outline"
            label="알림 설정"
            onPress={() => router.push('/profile/reminders')}
            showDivider={false}
          />
        </MenuSection>

        {/* 계정 */}
        <MenuSection title="계정">
          <MenuItem
            icon="person-outline"
            label="프로필 수정"
            onPress={() => router.push('/profile/edit')}
          />
          <MenuItem
            icon="lock-closed-outline"
            label="개인정보 보호"
            onPress={() => router.push('/profile/privacy')}
            showDivider={false}
          />
        </MenuSection>

        {/* 앱 설정 */}
        <MenuSection title="앱 설정">
          <MenuItem
            icon="text-outline"
            label="글자 크기"
            onPress={() => router.push('/profile/font-size')}
          />
          <MenuItem
            icon="sparkles-outline"
            label="AI 데이터 분석 동의"
            onPress={() => router.push('/profile/ai-consent')}
          />
          <MenuItem
            icon="information-circle-outline"
            label="앱 정보"
            onPress={() => router.push('/profile/about')}
            showDivider={false}
          />
        </MenuSection>

        {/* 고객 지원 */}
        <MenuSection title="고객 지원">
          <MenuItem
            icon="chatbubble-ellipses-outline"
            label="문의하기"
            onPress={() => router.push('/profile/qna')}
            showDivider={false}
          />
        </MenuSection>

        {/* 로그아웃 */}
        <MenuSection>
          <MenuItem
            icon="log-out-outline"
            label="로그아웃"
            labelColor={Colors.textSecondary}
            onPress={handleLogout}
            showDivider={false}
          />
        </MenuSection>
      </ScrollView>
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
    paddingBottom: 40,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileImagePlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  loginBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kakaoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.kakao,
  },
  menuSection: {
    backgroundColor: Colors.surface,
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 52,
  },
});
