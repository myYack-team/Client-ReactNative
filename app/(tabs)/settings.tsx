import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { FontSizeMode } from '../../constants/fonts';
import { useAuthStore, useSettingsStore } from '../../stores';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { fontSizeMode, setFontSizeMode } = useSettingsStore();

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

  const fontSizeOptions: { label: string; value: FontSizeMode }[] = [
    { label: '작게', value: 'small' },
    { label: '보통', value: 'medium' },
    { label: '크게', value: 'large' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Typography variant="h2">설정 ⚙️</Typography>
        </View>

        <Card style={styles.profileCard} variant="elevated">
          <Typography variant="h3" style={styles.sectionTitle}>
            계정 정보
          </Typography>
          <View style={styles.profileInfo}>
            <Typography variant="body">{user?.name || '사용자'}</Typography>
            <Typography variant="caption" color={Colors.textSecondary}>
              카카오 로그인
            </Typography>
          </View>
        </Card>

        <Card style={styles.settingsCard} variant="elevated">
          <Typography variant="h3" style={styles.sectionTitle}>
            화면 설정
          </Typography>

          <View style={styles.settingItem}>
            <Typography variant="body">글자 크기</Typography>
            <View style={styles.fontSizeOptions}>
              {fontSizeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.fontSizeButton,
                    fontSizeMode === option.value && styles.fontSizeButtonActive,
                  ]}
                  onPress={() => setFontSizeMode(option.value)}
                >
                  <Typography
                    variant="bodySmall"
                    color={
                      fontSizeMode === option.value
                        ? Colors.white
                        : Colors.textPrimary
                    }
                  >
                    {option.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        <Card style={styles.infoCard} variant="elevated">
          <Typography variant="h3" style={styles.sectionTitle}>
            앱 정보
          </Typography>
          <View style={styles.infoItem}>
            <Typography variant="body">버전</Typography>
            <Typography variant="body" color={Colors.textSecondary}>
              1.0.0
            </Typography>
          </View>
        </Card>

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
  header: {
    marginBottom: 24,
  },
  profileCard: {
    marginBottom: 16,
  },
  settingsCard: {
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  profileInfo: {
    paddingVertical: 8,
  },
  settingItem: {
    paddingVertical: 12,
  },
  fontSizeOptions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  fontSizeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  fontSizeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  logoutButton: {
    marginTop: 24,
  },
});
