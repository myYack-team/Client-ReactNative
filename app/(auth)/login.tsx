import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AuthSession from 'expo-auth-session';
import { Button, Typography } from '../../components/ui';
import { Colors, API_BASE_URL } from '../../constants';
import { useAuthStore } from '../../stores/authStore';

const { width } = Dimensions.get('window');

// WebBrowser 세션 완료 처리 (iOS에서 필요)
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { handleOAuthCallback, isLoading, error, clearError } = useAuthStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 딥링크 처리
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      console.log('[Login] Deep link received:', url);

      // myyak://oauth/callback?accessToken=...&refreshToken=...&isNewUser=...
      if (url.includes('oauth/callback')) {
        setIsAuthenticating(true);
        try {
          const parsed = Linking.parse(url);
          const { accessToken, refreshToken, isNewUser, error: authError } = parsed.queryParams || {};

          if (authError) {
            throw new Error(authError as string);
          }

          if (accessToken && refreshToken) {
            const isNew = isNewUser === 'true';
            await handleOAuthCallback(
              accessToken as string,
              refreshToken as string,
              isNew
            );
            // 신규 가입자는 기본정보 입력 화면으로, 기존 사용자는 홈으로
            router.replace(isNew ? '/profile-setup' : '/(tabs)');
          }
        } catch (err) {
          console.error('[Login] OAuth callback error:', err);
          Alert.alert('로그인 실패', '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
          setIsAuthenticating(false);
        }
      }
    };

    // 이미 열려있는 URL 확인 (앱이 닫혀있다가 딥링크로 열린 경우)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // 딥링크 리스너 등록
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

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

      // Expo Go/Development Build에서 동적으로 redirect URI 생성
      // Expo Go: exp://192.168.x.x:8081/--/oauth/callback
      // Production: myyak://oauth/callback
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'myyak',
        path: 'oauth/callback',
      });
      console.log('[Login] Redirect URI:', redirectUri);

      // 서버에 redirect_uri를 쿼리 파라미터로 전달
      const authUrl = `${API_BASE_URL}/auth/kakao/login?app_redirect_uri=${encodeURIComponent(redirectUri)}`;
      console.log('[Login] Opening auth URL:', authUrl);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      console.log('[Login] WebBrowser result:', result);

      // 결과 URL에서 토큰 파싱
      if (result.type === 'success' && result.url) {
        const parsed = Linking.parse(result.url);
        const { accessToken, refreshToken, isNewUser, error: authError } = parsed.queryParams || {};

        if (authError) {
          throw new Error(authError as string);
        }

        if (accessToken && refreshToken) {
          const isNew = isNewUser === 'true';
          await handleOAuthCallback(accessToken as string, refreshToken as string, isNew);
          // 신규 가입자는 기본정보 입력 화면으로, 기존 사용자는 홈으로
          router.replace(isNew ? '/profile-setup' : '/(tabs)');
        }
      } else if (result.type === 'cancel') {
        console.log('[Login] User cancelled');
      }
    } catch (err) {
      console.error('[Login] WebBrowser error:', err);
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
