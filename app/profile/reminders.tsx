import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';

const NOTIFICATION_ENABLED_KEY = 'notification_enabled';

export default function RemindersScreen() {
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotificationSetting();
  }, []);

  const loadNotificationSetting = async () => {
    try {
      const value = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
      if (value !== null) {
        setNotificationEnabled(value === 'true');
      }
    } catch (error) {
      console.error('Failed to load notification setting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    setNotificationEnabled(value);
    try {
      await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, value.toString());
    } catch (error) {
      console.error('Failed to save notification setting:', error);
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
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={notificationEnabled ? Colors.primary : Colors.textSecondary}
            />
          </View>
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
