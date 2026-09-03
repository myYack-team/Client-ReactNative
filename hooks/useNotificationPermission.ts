import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { notificationService, NotificationPermissionStatus } from '../services';

/** 훅에서 노출하는 권한 상태 (초기 조회 전에는 'loading') */
export type NotificationPermissionUiStatus = NotificationPermissionStatus | 'loading';

export interface UseNotificationPermissionResult {
  status: NotificationPermissionUiStatus;
  /** OS 권한 허용됨 */
  isGranted: boolean;
  /** 권한 미허용으로 사용자 안내가 필요한 상태 (에뮬레이터/Expo Go 등 미지원 환경은 제외) */
  needsAttention: boolean;
  /** 시스템 권한 팝업을 다시 띄울 수 있는 상태 (false면 설정 앱으로 이동해야 함) */
  canAskAgain: boolean;
  /** 권한 요청 진행 중 */
  isRequesting: boolean;
  /** 시스템 권한 팝업 요청 → 허용 시 FCM 토큰 즉시 등록 */
  request: () => Promise<NotificationPermissionStatus>;
  /** 시스템 설정 앱으로 이동 (canAskAgain === false인 경우) */
  openSettings: () => Promise<void>;
  /** 권한 상태 재조회 */
  refresh: () => Promise<NotificationPermissionStatus>;
}

/**
 * OS 알림 권한 상태를 읽고 요청/설정 이동을 처리하는 공용 훅
 * - 화면 포커스 시, 앱이 포그라운드로 복귀할 때(설정 앱에서 돌아온 경우) 자동으로 재조회
 * - 상태 3분기: granted / denied(재요청 가능) / blocked(설정에서만 변경 가능)
 */
export function useNotificationPermission(): UseNotificationPermissionResult {
  const [status, setStatus] = useState<NotificationPermissionUiStatus>('loading');
  const [isRequesting, setIsRequesting] = useState(false);
  const appState = useRef(AppState.currentState);
  const requestInFlight = useRef(false);

  const refresh = useCallback(async () => {
    const next = await notificationService.getPermissionStatus();
    setStatus(next);
    return next;
  }, []);

  // 화면 진입(포커스) 시 권한 상태 확인
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // 설정 앱 등에서 돌아와 앱이 active로 복귀하면 재조회
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        refresh();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refresh]);

  const request = useCallback(async () => {
    if (requestInFlight.current) {
      return notificationService.getPermissionStatus();
    }

    requestInFlight.current = true;
    setIsRequesting(true);
    try {
      const next = await notificationService.requestPermission();
      setStatus(next);

      if (next === 'granted') {
        // 허용 즉시 토큰 발급 + 서버 등록
        await notificationService.initialize();
      }

      return next;
    } finally {
      requestInFlight.current = false;
      setIsRequesting(false);
    }
  }, []);

  const openSettings = useCallback(() => notificationService.openSystemSettings(), []);

  return {
    status,
    isGranted: status === 'granted',
    needsAttention: status === 'denied' || status === 'blocked',
    canAskAgain: status === 'denied',
    isRequesting,
    request,
    openSettings,
    refresh,
  };
}
