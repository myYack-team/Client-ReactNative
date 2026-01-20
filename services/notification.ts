import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';
import { logger } from '../utils/logger';

// 푸시 액션 식별자
export const NOTIFICATION_ACTIONS = {
  TAKE: 'TAKE_MEDICATION',
  SKIP: 'SKIP_MEDICATION',
} as const;

// 알림 카테고리 식별자
export const NOTIFICATION_CATEGORY = 'MEDICATION_REMINDER';

// Development/Release Build 여부 확인
// Expo Go에서는 Constants.appOwnership이 'expo'
// Development Build/Release Build에서는 undefined, null, 또는 'standalone'
const isNativeBuild = Constants.appOwnership !== 'expo';

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
   * 푸시 알림 권한 요청 및 FCM 네이티브 토큰 발급
   * 주의: getDevicePushTokenAsync()는 Expo Go에서 작동하지 않음. Development Build 필수.
   */
  registerForPushNotifications: async (): Promise<string | null> => {
    logger.log(`[Notification] 토큰 등록 시작 - isDevice: ${Device.isDevice}, appOwnership: ${Constants.appOwnership}, isNativeBuild: ${isNativeBuild}`);

    // 실제 디바이스에서만 동작
    if (!Device.isDevice) {
      logger.log('[Notification] 실제 디바이스에서만 푸시 알림이 지원됩니다.');
      return null;
    }

    // Expo Go에서는 FCM 네이티브 토큰 발급 불가
    if (!isNativeBuild) {
      logger.log('[Notification] Expo Go 환경 - FCM 네이티브 토큰 발급 불가. Development Build 필요.');
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
      logger.log('[Notification] 푸시 알림 권한이 거부되었습니다.');
      return null;
    }

    // FCM 네이티브 토큰 발급
    try {
      // Android 채널 설정 (토큰 발급 전에 설정해야 함)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medication', {
          name: '복약 알림',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4A90D9',
          sound: 'default',
        });
      }

      // FCM 네이티브 토큰 발급 (Firebase Admin SDK와 호환)
      const deviceToken = await Notifications.getDevicePushTokenAsync();

      logger.log(`[Notification] FCM 네이티브 토큰 발급 완료 (${deviceToken.type}):`, deviceToken.data);

      return deviceToken.data;
    } catch (error) {
      logger.error('[Notification] FCM 토큰 발급 실패:', error);
      return null;
    }
  },

  /**
   * FCM 토큰을 서버에 등록
   */
  registerTokenToServer: async (fcmToken: string): Promise<void> => {
    try {
      await api.post('/fcm/token', { fcmToken });
      logger.log('[Notification] 서버에 FCM 토큰 등록 완료');
    } catch (error) {
      logger.error('[Notification] 서버 토큰 등록 실패:', error);
    }
  },

  /**
   * 알림 카테고리 설정 (복용/건너뛰기 액션 버튼)
   * Development Build에서만 활성화됨
   */
  setupNotificationCategories: async (): Promise<void> => {
    // Expo Go에서는 카테고리 액션이 지원되지 않음
    if (!isNativeBuild) {
      logger.log('[Notification] Expo Go 환경 - 알림 액션 버튼 비활성화');
      return;
    }

    try {
      await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY, [
        {
          identifier: NOTIFICATION_ACTIONS.TAKE,
          buttonTitle: '복용',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: NOTIFICATION_ACTIONS.SKIP,
          buttonTitle: '건너뛰기',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
      logger.log('[Notification] 알림 카테고리 설정 완료');
    } catch (error) {
      logger.error('[Notification] 알림 카테고리 설정 실패:', error);
    }
  },

  /**
   * 푸시 알림 초기화 (권한 요청 + 토큰 발급 + 서버 등록 + 카테고리 설정)
   */
  initialize: async (): Promise<void> => {
    const token = await notificationService.registerForPushNotifications();
    if (token) {
      await notificationService.registerTokenToServer(token);
    }

    // 알림 카테고리 설정 (Development Build에서만 동작)
    await notificationService.setupNotificationCategories();
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
   * 알림 액션 식별자 추출
   */
  getActionIdentifier: (response: Notifications.NotificationResponse): string | null => {
    return response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER
      ? response.actionIdentifier
      : null;
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
        title: '마이약',
        body: '테스트 알림입니다. 약을 복용할 시간입니다!',
        sound: 'default',
        // Development Build에서만 카테고리 적용
        ...(isNativeBuild && { categoryIdentifier: NOTIFICATION_CATEGORY }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  },
};
