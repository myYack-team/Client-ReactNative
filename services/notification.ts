import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Linking, Platform } from 'react-native';
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

/**
 * OS 알림 권한 상태
 * - granted: 허용됨
 * - denied: 미허용, 시스템 권한 팝업 재요청 가능 (canAskAgain === true)
 * - blocked: 미허용, 시스템 권한 팝업 재요청 불가 (canAskAgain === false) → 설정 앱에서 직접 켜야 함
 * - unsupported: 푸시를 지원하지 않는 환경 (에뮬레이터, Expo Go) → 사용자에게 권한 UI를 띄우지 않음
 */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'blocked' | 'unsupported';

/**
 * 푸시 토큰을 발급하지 못한 사유
 * - device: 에뮬레이터/시뮬레이터
 * - expo-go: Expo Go 환경 (FCM 네이티브 토큰 발급 불가)
 * - permission: OS 알림 권한 미허용
 * - token-error: 권한은 있으나 토큰 발급 실패
 */
export type PushRegistrationFailureReason = 'device' | 'expo-go' | 'permission' | 'token-error';

export interface PushRegistrationResult {
  /** 발급된 FCM 네이티브 토큰 (실패 시 null) */
  token: string | null;
  /** 토큰이 null인 경우의 사유 */
  reason: PushRegistrationFailureReason | null;
  /** 확인된 OS 권한 상태 */
  permissionStatus: NotificationPermissionStatus;
}

interface RegisterOptions {
  /**
   * 권한이 'denied'(재요청 가능)일 때 시스템 권한 팝업을 띄울지 여부
   * 기본값 false: 맥락 없는 권한 요청(로그인 직후 등)을 피하기 위해 이미 허용된 경우에만 토큰을 등록
   */
  requestPermission?: boolean;
}

// Development/Release Build 여부 확인
// Expo Go에서는 Constants.appOwnership이 'expo'
// Development Build/Release Build에서는 undefined, null, 또는 'standalone'
const isNativeBuild = Constants.appOwnership !== 'expo';

// 실제 디바이스 + 네이티브 빌드에서만 FCM 푸시 지원
const isPushSupportedEnvironment = (): boolean => Device.isDevice && isNativeBuild;

// expo-notifications 권한 응답 → 앱 내부 권한 상태로 변환
const toPermissionStatus = (
  response: Notifications.NotificationPermissionsStatus
): NotificationPermissionStatus => {
  if (response.granted || response.status === 'granted') {
    return 'granted';
  }
  return response.canAskAgain ? 'denied' : 'blocked';
};

// 마지막 initialize() 시점의 권한 상태 (앱 복귀 시 권한 변경 감지용)
let lastInitializedPermissionStatus: NotificationPermissionStatus | null = null;

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
   * 푸시 지원 환경 여부 (실제 디바이스 + Development/Release Build)
   */
  isPushSupportedEnvironment,

  /**
   * 현재 OS 알림 권한 상태 조회 (시스템 팝업을 띄우지 않음)
   */
  getPermissionStatus: async (): Promise<NotificationPermissionStatus> => {
    if (!isPushSupportedEnvironment()) {
      return 'unsupported';
    }

    try {
      const response = await Notifications.getPermissionsAsync();
      return toPermissionStatus(response);
    } catch (error) {
      // 조회 자체가 실패하면 권한 UI를 띄우지 않도록 unsupported로 처리
      logger.error('[Notification] 권한 상태 조회 실패:', error);
      return 'unsupported';
    }
  },

  /**
   * OS 알림 권한 요청 (시스템 팝업)
   * Android 13+는 팝업이 최대 2회만 노출되므로 'blocked' 상태에서는 팝업 없이 거부가 반환됨
   */
  requestPermission: async (): Promise<NotificationPermissionStatus> => {
    if (!isPushSupportedEnvironment()) {
      return 'unsupported';
    }

    try {
      const response = await Notifications.requestPermissionsAsync();
      const status = toPermissionStatus(response);
      logger.log(`[Notification] 권한 요청 결과: ${status}`);
      return status;
    } catch (error) {
      logger.error('[Notification] 권한 요청 실패:', error);
      return notificationService.getPermissionStatus();
    }
  },

  /**
   * 시스템 설정 앱(마이약 앱 설정)으로 이동
   * 권한이 'blocked'인 경우 사용자가 직접 알림을 켜야 함
   */
  openSystemSettings: async (): Promise<void> => {
    try {
      await Linking.openSettings();
    } catch (error) {
      logger.error('[Notification] 시스템 설정 열기 실패:', error);
    }
  },

  /**
   * 마지막 initialize() 시점의 권한 상태 (아직 초기화 전이면 null)
   */
  getLastInitializedPermissionStatus: (): NotificationPermissionStatus | null =>
    lastInitializedPermissionStatus,

  /**
   * FCM 네이티브 토큰 발급 (권한 확인 포함)
   * 실패 시 token은 null이며 reason으로 사유를 구분할 수 있음
   * 주의: getDevicePushTokenAsync()는 Expo Go에서 작동하지 않음. Development Build 필수.
   */
  registerForPushNotifications: async (
    options: RegisterOptions = {}
  ): Promise<PushRegistrationResult> => {
    const { requestPermission = false } = options;

    logger.log(`[Notification] 토큰 등록 시작 - isDevice: ${Device.isDevice}, appOwnership: ${Constants.appOwnership}, isNativeBuild: ${isNativeBuild}`);

    // 실제 디바이스에서만 동작
    if (!Device.isDevice) {
      logger.log('[Notification] 실제 디바이스에서만 푸시 알림이 지원됩니다.');
      return { token: null, reason: 'device', permissionStatus: 'unsupported' };
    }

    // Expo Go에서는 FCM 네이티브 토큰 발급 불가
    if (!isNativeBuild) {
      logger.log('[Notification] Expo Go 환경 - FCM 네이티브 토큰 발급 불가. Development Build 필요.');
      return { token: null, reason: 'expo-go', permissionStatus: 'unsupported' };
    }

    // 권한 확인 (시스템 팝업 요청은 옵션으로만 수행)
    let permissionStatus = await notificationService.getPermissionStatus();
    if (permissionStatus === 'denied' && requestPermission) {
      permissionStatus = await notificationService.requestPermission();
    }

    if (permissionStatus !== 'granted') {
      logger.log(`[Notification] 푸시 알림 권한 미허용 (${permissionStatus})`);
      return { token: null, reason: 'permission', permissionStatus };
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

      return { token: deviceToken.data, reason: null, permissionStatus: 'granted' };
    } catch (error) {
      logger.error('[Notification] FCM 토큰 발급 실패:', error);
      return { token: null, reason: 'token-error', permissionStatus: 'granted' };
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
   * 서버에 등록된 FCM 토큰 해제 (로그아웃 시)
   * 세션 삭제 전에 호출해야 하며, 실패해도 로그아웃은 계속 진행 (best-effort)
   */
  unregisterTokenFromServer: async (): Promise<void> => {
    try {
      await api.delete('/fcm/token');
      logger.log('[Notification] 서버 FCM 토큰 해제 완료');
    } catch (error) {
      logger.error('[Notification] 서버 토큰 해제 실패:', error);
    } finally {
      lastInitializedPermissionStatus = null;
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
   * 푸시 알림 초기화 (권한 확인 + 토큰 발급 + 서버 등록 + 카테고리 설정)
   * 기본적으로 시스템 권한 팝업은 띄우지 않으며, 권한 요청은 리마인더 설정 등 맥락이 있는 화면에서 수행
   */
  initialize: async (options: RegisterOptions = {}): Promise<PushRegistrationResult> => {
    const result = await notificationService.registerForPushNotifications(options);

    if (result.token) {
      await notificationService.registerTokenToServer(result.token);
    } else {
      logger.log(`[Notification] 서버 토큰 등록 건너뜀 - 사유: ${result.reason}, 권한: ${result.permissionStatus}`);
    }

    lastInitializedPermissionStatus = result.permissionStatus;

    // 알림 카테고리 설정 (Development Build에서만 동작)
    await notificationService.setupNotificationCategories();

    return result;
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
