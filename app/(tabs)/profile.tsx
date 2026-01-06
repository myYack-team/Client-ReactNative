import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, Typography, Button } from '../../components/ui';
import { Colors } from '../../constants';
import { useResponsive } from '../../hooks';
import { useAuthStore } from '../../stores';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
}

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Typography variant="body" style={styles.menuIcon}>{icon}</Typography>
        <Typography variant="body">{label}</Typography>
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
      <Typography variant="h3" style={styles.sectionTitle}>{title}</Typography>
      {children}
    </Card>
  );
}

export default function ProfileScreen() {
  const { contentStyle } = useResponsive();
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, contentStyle]}
      >
        {/* 프로필 카드 */}
        <Card style={styles.profileCard} variant="elevated">
          <View style={styles.profileContent}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Typography variant="h2">👤</Typography>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Typography variant="h2">{user?.name || '사용자'}</Typography>
              <View style={styles.kakaoTag}>
                <Typography variant="caption" color={Colors.textSecondary}>
                  카카오 로그인
                </Typography>
              </View>
            </View>
          </View>
        </Card>

        {/* 복약 관리 */}
        <MenuSection title="복약 관리">
          <MenuItem
            icon="📋"
            label="내 복약 목록"
            onPress={() => router.push('/(tabs)/medications')}
          />
          <MenuItem
            icon="🔔"
            label="알림 설정"
            onPress={() => router.push('/profile/reminders')}
          />
        </MenuSection>

        {/* 계정 */}
        <MenuSection title="계정">
          <MenuItem
            icon="👤"
            label="프로필 수정"
            onPress={() => router.push('/profile/edit')}
          />
          <MenuItem
            icon="🔒"
            label="개인정보 보호"
            onPress={() => router.push('/profile/privacy')}
          />
        </MenuSection>

        {/* 앱 설정 */}
        <MenuSection title="앱 설정">
          <MenuItem
            icon="🔤"
            label="글자 크기"
            onPress={() => router.push('/profile/font-size')}
          />
          <MenuItem
            icon="ℹ️"
            label="앱 정보"
            onPress={() => router.push('/profile/about')}
          />
        </MenuSection>

        {/* 로그아웃 버튼 */}
        <Button
          title="로그아웃"
          variant="outline"
          size="large"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
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
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  profileInfo: {
    flex: 1,
  },
  kakaoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#FEE500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  menuSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  logoutButton: {
    marginTop: 8,
  },
});
