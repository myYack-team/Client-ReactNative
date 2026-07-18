import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { Colors } from '../../constants';

interface TabHeaderProps {
  title: string;
  subtitle?: string;
  showSettingsButton?: boolean;
  /** 지정 시 타이틀/서브타이틀 대신 렌더링 (예: 선택 모드의 취소 버튼) */
  leftContent?: React.ReactNode;
  /** 지정 시 설정 버튼 대신 렌더링 (예: 선택 모드의 삭제 버튼) */
  rightContent?: React.ReactNode;
  /** 헤더 블록 하단에 추가 렌더링할 콘텐츠 */
  children?: React.ReactNode;
}

export function TabHeader({
  title,
  subtitle,
  showSettingsButton = true,
  leftContent,
  rightContent,
  children,
}: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  // 탭 헤더가 어두운 테마색이므로 화면 포커스 동안 상태바를 밝게 전환
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        <View style={styles.leftContent}>
          {leftContent ?? (
            <>
              <Typography variant="h2" color={Colors.white}>{title}</Typography>
              {subtitle && (
                <Typography variant="bodySmall" color="rgba(255, 255, 255, 0.7)" style={styles.subtitle}>
                  {subtitle}
                </Typography>
              )}
            </>
          )}
        </View>
        <View style={styles.rightContent}>
          {rightContent ??
            (showSettingsButton && (
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings-outline" size={24} color="rgba(255, 255, 255, 0.85)" />
              </TouchableOpacity>
            ))}
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.brand,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  settingsButton: {
    padding: 4,
  },
});
