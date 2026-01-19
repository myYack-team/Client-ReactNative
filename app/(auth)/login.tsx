import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import { Button, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/auth';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { isLoading, error, clearError } = useAuthStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 에러 표시
  useEffect(() => {
    if (error) {
      Alert.alert('로그인 실패', error);
      clearError();
    }
  }, [error]);

  const handleKakaoLogin = async () => {
    try {
      setIsAuthenticating(true);
      console.log('[Login] 카카오 네이티브 로그인 시작');

      // 1. 카카오 네이티브 SDK로 로그인 → 카카오 액세스 토큰 획득
      const kakaoToken = await KakaoLogin.login();
      console.log('[Login] 카카오 토큰 획득:', kakaoToken.accessToken ? '성공' : '실패');

      if (!kakaoToken.accessToken) {
        throw new Error('카카오 토큰을 받지 못했습니다.');
      }

      // 2. 카카오 액세스 토큰을 서버로 전송 → JWT 토큰 발급
      console.log('[Login] 서버로 카카오 토큰 전송');
      const result = await authService.loginWithKakao(kakaoToken.accessToken);
      console.log('[Login] 서버 로그인 성공, isNewUser:', result.isNewUser);

      // 3. 토큰 저장 (authStore의 loginWithKakao 대신 직접 처리)
      const { useAuthStore: store } = require('../../stores/authStore');
      await store.getState().handleOAuthCallback(
        result.accessToken,
        result.refreshToken,
        result.isNewUser
      );

      // 4. 서버에서 받은 동의 상태로 화면 이동 결정
      const needsConsent = !result.termsAgreed || !result.privacyAgreed;

      if (needsConsent) {
        // 동의하지 않은 사용자는 동의 화면으로
        router.replace('/(auth)/consent');
      } else if (result.isNewUser) {
        // 동의 완료 + 신규 가입자는 프로필 설정으로
        router.replace('/profile-setup');
      } else {
        // 동의 완료 + 기존 사용자는 홈으로
        router.replace('/(tabs)');
      }

    } catch (err: any) {
      console.error('[Login] 카카오 로그인 에러:', err);

      // 사용자가 취소한 경우
      if (err.message?.includes('cancelled') || err.message?.includes('cancel')) {
        console.log('[Login] 사용자가 로그인 취소');
        return;
      }

      Alert.alert('로그인 실패', '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const showLoading = isLoading || isAuthenticating;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Typography variant="body" color={Colors.textSecondary} style={styles.tagline}>
            AI와 함께하는 약/영양제 관리
          </Typography>
        </View>

        <View style={styles.buttonSection}>
          {showLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Typography variant="body" color={Colors.textSecondary} style={styles.loadingText}>
                로그인 중...
              </Typography>
            </View>
          ) : (
            <>
              <Button
                title="카카오로 시작하기"
                variant="kakao"
                onPress={handleKakaoLogin}
              />

              <Typography
                variant="caption"
                color={Colors.textSecondary}
                style={styles.terms}
              >
                로그인하면 이용약관에 동의하는 것으로 간주합니다
              </Typography>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 24,
  },
  tagline: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
  },
  buttonSection: {
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
  },
  terms: {
    textAlign: 'center',
    marginTop: 16,
  },
});
