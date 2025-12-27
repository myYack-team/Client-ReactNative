import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// 포그라운드에서 알림 표시 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  /**
   * 푸시 알림 권한 요청 및 토큰 발급
   */
  registerForPushNotifications: async (): Promise<string | null> => {
    // 실제 디바이스에서만 동작
    if (!Device.isDevice) {
      console.log('[Notification] 실제 디바이스에서만 푸시 알림이 지원됩니다.');
      return null;
    }

    // 기존 권한 확인
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 권한이 없으면 요청
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notification] 푸시 알림 권한이 거부되었습니다.');
      return null;
    }

    // FCM 토큰 발급
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      // projectId가 유효하지 않으면 개발 환경으로 간주하고 스킵
      if (!projectId || projectId === 'your-project-id') {
        console.log('[Notification] 개발 환경 - Expo projectId 미설정, 푸시 알림 스킵');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      console.log('[Notification] FCM 토큰 발급 완료:', token.data);

      // Android 채널 설정
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medication', {
          name: '복약 알림',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4A90D9',
          sound: 'default',
        });
      }

      return token.data;
    } catch (error) {
      // 개발 환경에서의 에러는 조용히 무시
      console.log('[Notification] 토큰 발급 스킵 (개발 환경)');
      return null;
    }
  },

  /**
   * FCM 토큰을 서버에 등록
   */
  registerTokenToServer: async (fcmToken: string): Promise<void> => {
    try {
      await api.post('/fcm/token', { fcmToken });
      console.log('[Notification] 서버에 FCM 토큰 등록 완료');
    } catch (error) {
      console.error('[Notification] 서버 토큰 등록 실패:', error);
    }
  },

  /**
   * 푸시 알림 초기화 (권한 요청 + 토큰 발급 + 서버 등록)
   */
  initialize: async (): Promise<void> => {
    const token = await notificationService.registerForPushNotifications();
    if (token) {
      await notificationService.registerTokenToServer(token);
    }
  },

  /**
   * 알림 수신 리스너 등록 (포그라운드)
   */
  addNotificationReceivedListener: (
    callback: (notification: Notifications.Notification) => void
  ) => {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * 알림 응답 리스너 등록 (알림 클릭 시)
   */
  addNotificationResponseListener: (
    callback: (response: Notifications.NotificationResponse) => void
  ) => {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * 배지 수 초기화
   */
  clearBadge: async (): Promise<void> => {
    await Notifications.setBadgeCountAsync(0);
  },

  /**
   * 로컬 테스트용 알림 발송
   */
  sendTestNotification: async (): Promise<void> => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '복약 알림',
        body: '테스트 알림입니다. 약을 복용할 시간입니다!',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  },
};
