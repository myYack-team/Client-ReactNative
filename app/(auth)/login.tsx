import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Typography } from '../../components/ui';
import { Colors } from '../../constants';

export default function LoginScreen() {
  // TODO: 나중에 실제 카카오 로그인 구현
  const handleKakaoLogin = () => {
    // 임시로 바로 홈 화면으로 이동
    router.replace('/(tabs)');
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
  terms: {
    textAlign: 'center',
    marginTop: 16,
  },
});
