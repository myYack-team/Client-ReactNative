import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus, Platform } from 'react-native';
import * as ExpoInAppUpdates from 'expo-in-app-updates';
import * as Notifications from 'expo-notifications';
import { useAuthStore, useSettingsStore } from '../stores';
import { notificationService, NOTIFICATION_ACTIONS } from '../services';
import { refreshTokenSingleFlight } from '../services/api';
import { Colors } from '../constants';
import SplashScreen from '../components/SplashScreen';

export default function RootLayout() {
  const router = useRouter();
  const { initialize: initAuth, isLoading: authLoading, isAuthenticated } = useAuthStore();
  const { initialize: initSettings, isLoading: settingsLoading } = useSettingsStore();
  const [showSplash, setShowSplash] = useState(true);

  const appState = useRef(AppState.currentState);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // 앱 종료 상태에서 알림 클릭으로 시작된 경우의 응답을 저장
  const [initialNotificationResponse, setInitialNotificationResponse] =
    useState<Notifications.NotificationResponse | null>(null);

  // 알림 응답 처리 함수 (리스너와 initial notification에서 공통 사용)
  const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
    const actionId = notificationService.getActionIdentifier(response);
    const data = response.notification.request.content.data;

    console.log('[Notification] 알림 응답:', {
      action: actionId || 'TAP',
      data,
    });

    // 액션 버튼 처리 (Development Build에서만 동작)
    if (actionId === NOTIFICATION_ACTIONS.TAKE) {
      // 복용 버튼 클릭
      console.log('[Notification] 복용 버튼 클릭');
      // TODO: 복용 기록 API 호출 (data에서 medicationId, timing 등 추출)
    } else if (actionId === NOTIFICATION_ACTIONS.SKIP) {
      // 건너뛰기 버튼 클릭
      console.log('[Notification] 건너뛰기 버튼 클릭');
      // TODO: 건너뛰기 기록 API 호출
    } else {
      // 알림 자체를 클릭한 경우 - 홈 화면으로 이동
      router.push('/(tabs)');
    }

    // 배지 초기화
    notificationService.clearBadge();
  };

  useEffect(() => {
    initAuth();
    initSettings();

    // 알림 수신 리스너 (포그라운드)
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('[Notification] 알림 수신:', notification.request.content);
      }
    );

    // 알림 응답 리스너 (알림 클릭 또는 액션 버튼 클릭 시)
    // Background 상태에서 알림 클릭 시 동작
    responseListener.current = notificationService.addNotificationResponseListener(
      handleNotificationResponse
    );

    // 앱이 종료된 상태(killed)에서 알림 클릭으로 시작된 경우
    // 즉시 처리하지 않고 state에 저장 (Race Condition 방지)
    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        console.log('[Notification] Initial notification 감지 - 앱 초기화 완료 후 처리 예정');
        setInitialNotificationResponse(response);
      }
    };
    checkInitialNotification();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // 앱 초기화 완료 후 저장된 initial notification 처리
  useEffect(() => {
    if (
      initialNotificationResponse &&
      !authLoading &&
      !settingsLoading &&
      !showSplash
    ) {
      console.log('[Notification] 앱 초기화 완료 - Initial notification 처리');
      handleNotificationResponse(initialNotificationResponse);
      setInitialNotificationResponse(null);
    }
  }, [initialNotificationResponse, authLoading, settingsLoading, showSplash]);

  // 인증 상태일 때 FCM 토큰 등록
  // - 로그인 상태 변경 시 (로그인 직후)
  // - 앱 재시작 시 (이미 로그인된 상태로 시작)
  // - 초기화 완료 후 (authLoading이 false가 된 후)
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      notificationService.initialize();
    }
  }, [isAuthenticated, authLoading]);

  // 앱이 백그라운드에서 포그라운드로 복귀할 때 토큰 사전 갱신
  // 24시간 이상 백그라운드 유지 후 복귀 시 만료된 토큰으로 인한 실패 방지
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current?.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isAuthenticated
      ) {
        refreshTokenSingleFlight().catch(() => {
          // 갱신 실패 시 무시 — 이후 API 호출에서 인터셉터가 재시도
        });
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  // Google Play In-App Update 체크 (Android 프로덕션만, 1회만 실행)
  const updateChecked = useRef(false);
  useEffect(() => {
    if (!showSplash && !authLoading && !settingsLoading && !updateChecked.current) {
      updateChecked.current = true;
      if (Platform.OS === 'android' && !__DEV__) {
        if (typeof ExpoInAppUpdates.checkAndStartUpdate === 'function') {
          ExpoInAppUpdates.checkAndStartUpdate()
            .catch((error) => {
              console.warn('[InAppUpdate] Update check failed:', error);
            });
        } else {
          console.warn('[InAppUpdate] checkAndStartUpdate is not available');
        }
      }
    }
  }, [showSplash, authLoading, settingsLoading]);

  // 스플래시 스크린 표시
  if (showSplash) {
    return (
      <>
        <SplashScreen onFinish={() => setShowSplash(false)} />
        <StatusBar style="dark" />
      </>
    );
  }

  // 초기화 로딩 중
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
