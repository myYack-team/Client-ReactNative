import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Switch, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useNotificationPermission } from '../../hooks';
import { userService } from '../../services/user';

export default function RemindersScreen() {
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  // 기기(OS) 알림 권한 상태 - 서버 토글과 별개로, 기기 권한이 꺼져 있으면 알림을 받을 수 없음
  const notificationPermission = useNotificationPermission();

  useFocusEffect(
    useCallback(() => {
      loadNotificationSettings();
    }, [])
  );

  const loadNotificationSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await userService.getNotificationSettings();
      setNotificationEnabled(settings.notificationEnabled);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      Alert.alert('오류', '알림 설정을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    const previousValue = notificationEnabled;
    setNotificationEnabled(value);
    setIsUpdating(true);

    try {
      await userService.updateNotificationSettings({ notificationEnabled: value });
    } catch (error) {
      console.error('Failed to save notification setting:', error);
      setNotificationEnabled(previousValue);
      Alert.alert('오류', '알림 설정을 저장하는데 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <Typography variant="body" color={Colors.textSecondary}>
            로딩 중...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Card style={styles.card} variant="elevated">
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingHeader}>
                <Typography variant="body" style={styles.settingIcon}>🔔</Typography>
                <Typography variant="body" style={styles.settingTitle}>복약 알림</Typography>
              </View>
              <Typography variant="caption" color={Colors.textSecondary} style={styles.settingDescription}>
                설정된 시간에 복약 알림을 받습니다
              </Typography>
            </View>
            <Switch
              value={notificationEnabled}
              onValueChange={handleToggle}
              disabled={isUpdating}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={notificationEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>

          {/* 기기 알림 권한이 꺼져 있으면 서버 설정과 무관하게 알림을 받을 수 없으므로 안내 */}
          {notificationPermission.needsAttention && (
            <TouchableOpacity
              style={styles.permissionRow}
              onPress={
                notificationPermission.canAskAgain
                  ? notificationPermission.request
                  : notificationPermission.openSettings
              }
              disabled={notificationPermission.isRequesting}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-off-outline" size={16} color={Colors.warning} />
              <Typography variant="caption" color={Colors.warning} style={styles.permissionText}>
                기기 알림 권한 꺼짐 · {notificationPermission.canAskAgain ? '허용하기' : '설정에서 켜기'}
              </Typography>
              <Ionicons name="chevron-forward" size={14} color={Colors.warning} />
            </TouchableOpacity>
          )}
        </Card>

        <View style={styles.infoBox}>
          <Typography variant="body" style={styles.infoIcon}>ℹ️</Typography>
          <Typography variant="caption" color={Colors.textSecondary} style={styles.infoText}>
            알림 시간은 각 약의 설정에서 변경할 수 있습니다.
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
    padding: 20,
  },
  card: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  settingIcon: {
    fontSize: 20,
  },
  settingTitle: {
    fontWeight: '600',
  },
  settingDescription: {
    marginLeft: 28,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  permissionText: {
    flex: 1,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    lineHeight: 20,
  },
});
