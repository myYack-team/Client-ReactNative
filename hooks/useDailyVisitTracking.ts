import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { visitService } from '../services/visit';
import { DailyVisitTracker } from '../utils/dailyVisitTracker';

export function useDailyVisitTracking(): void {
  useEffect(() => {
    const tracker = new DailyVisitTracker({ createVisit: visitService.createVisit });
    const syncSession = () => {
      const { isAuthenticated, isLoading, user } = useAuthStore.getState();
      tracker.setSession(isAuthenticated && !isLoading ? (user?.id ?? 'authenticated') : null);
    };

    // 인증 초기화/로그인뿐 아니라 계정 전환·로그아웃도 즉시 반영합니다.
    const unsubscribeAuth = useAuthStore.subscribe(syncSession);
    syncSession();
    tracker.setForeground(AppState.currentState === 'active');
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      tracker.setForeground(state === 'active');
    });

    return () => {
      unsubscribeAuth();
      appStateSubscription.remove();
      tracker.dispose();
    };
  }, []);
}
