import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuthStore, useSettingsStore } from '../stores';
import { notificationService } from '../services';
import { Colors } from '../constants';

export default function RootLayout() {
  const router = useRouter();
  const { initialize: initAuth, isLoading: authLoading } = useAuthStore();
  const { initialize: initSettings, isLoading: settingsLoading } = useSettingsStore();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    initAuth();
    initSettings();

    // 푸시 알림 초기화
    notificationService.initialize();

    // 알림 수신 리스너 (포그라운드)
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('[Notification] 알림 수신:', notification.request.content);
      }
    );

    // 알림 응답 리스너 (알림 클릭 시)
    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        console.log('[Notification] 알림 클릭:', response.notification.request.content);
        // 알림 클릭 시 홈 화면으로 이동
        router.push('/(tabs)');
        // 배지 초기화
        notificationService.clearBadge();
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  if (authLoading || settingsLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
