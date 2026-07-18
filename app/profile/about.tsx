import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Card, Typography, TermsModal } from '../../components/ui';
import type { TermsType } from '../../components/ui';
import { Colors } from '../../constants';

interface MenuItemProps {
  label: string;
  onPress: () => void;
}

function MenuItem({ label, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Typography variant="body">{label}</Typography>
      <Typography variant="body" color={Colors.textSecondary}>{'>'}</Typography>
    </TouchableOpacity>
  );
}

export default function AboutScreen() {
  const [modalType, setModalType] = useState<TermsType | null>(null);

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // 링크 열기 실패 시 무시
    });
  };

  const handleContact = () => {
    // Q&A 페이지로 이동
    router.push('/profile/qna');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* 앱 로고 및 버전 정보 */}
        <Card style={styles.logoCard} variant="elevated">
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              accessibilityLabel="마이약 앱 아이콘"
              resizeMode="cover"
            />
            <Typography variant="h2" style={styles.appName}>마이약</Typography>
            <Typography variant="body" color={Colors.textSecondary}>MyYak</Typography>
            <Typography variant="caption" color={Colors.textSecondary} style={styles.version}>
              버전 {Constants.expoConfig?.version ?? '-'}
            </Typography>
          </View>
        </Card>

        {/* 메뉴 */}
        <Card style={styles.menuCard} variant="elevated">
          <MenuItem
            label="이용약관"
            onPress={() => setModalType('terms')}
          />
          <View style={styles.divider} />
          <MenuItem
            label="개인정보 처리방침"
            onPress={() => setModalType('privacy')}
          />
          <View style={styles.divider} />
          <MenuItem
            label="문의하기"
            onPress={handleContact}
          />
        </Card>
      </View>

      {/* 약관 모달 */}
      {modalType && (
        <TermsModal
          visible={!!modalType}
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
  content: {
    flex: 1,
    padding: 20,
  },
  logoCard: {
    marginBottom: 16,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 18,
    marginBottom: 16,
  },
  appName: {
    marginBottom: 4,
  },
  version: {
    marginTop: 8,
  },
  menuCard: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
