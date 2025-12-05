import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Button, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useAuthStore } from '../../stores';
import { authService } from '../../services';

export default function LoginScreen() {
  const { loginWithKakao, isLoading, error, clearError } = useAuthStore();

  const handleKakaoLogin = async () => {
    try {
      clearError();
      const loginUrl = await authService.getKakaoLoginUrl();

      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl,
        Linking.createURL('auth/callback')
      );

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          await loginWithKakao(code);
          router.replace('/(tabs)');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Typography variant="h1" style={styles.logo}>
            마이약
          </Typography>
          <Typography variant="body" color={Colors.textSecondary} style={styles.tagline}>
            사진 한 장으로{'\n'}약 관리 끝
          </Typography>
        </View>

        <View style={styles.buttonSection}>
          {error && (
            <Typography variant="bodySmall" color={Colors.error} style={styles.error}>
              {error}
            </Typography>
          )}

          <Button
            title="카카오로 시작하기"
            variant="kakao"
            onPress={handleKakaoLogin}
            loading={isLoading}
          />

          <Typography
            variant="caption"
            color={Colors.textSecondary}
            style={styles.terms}
          >
            로그인하면 이용약관에 동의하는 것으로 간주합니다
          </Typography>
        </View>
      </View>
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
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    color: Colors.primary,
    marginBottom: 16,
  },
  tagline: {
    textAlign: 'center',
    lineHeight: 28,
  },
  buttonSection: {
    paddingBottom: 40,
  },
  error: {
    textAlign: 'center',
    marginBottom: 16,
  },
  terms: {
    textAlign: 'center',
    marginTop: 16,
  },
});
