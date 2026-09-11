import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../../constants';
import { Typography } from './Typography';
import { Button } from './Button';
import type { NotificationPermissionUiStatus } from '../../hooks/useNotificationPermission';

interface NotificationPermissionNoticeProps {
  /** 권한 상태 - 'denied' | 'blocked'일 때만 렌더링됨 */
  status: NotificationPermissionUiStatus;
  /** 권한 요청 진행 중 (버튼 로딩 표시) */
  isRequesting?: boolean;
  /** [허용하기] - 시스템 권한 팝업 요청 (status === 'denied') */
  onRequest: () => void;
  /** [설정에서 켜기] - 시스템 설정 앱으로 이동 (status === 'blocked') */
  onOpenSettings: () => void;
  /** 닫기 버튼 표시 (전달하지 않으면 닫기 버튼 없음) */
  onDismiss?: () => void;
  title?: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_TITLE = '복약 알림을 받으려면 알림 권한이 필요해요';
const DEFAULT_DESCRIPTION = '설정한 시간에 복약 알림을 보내드려요';
const BLOCKED_GUIDE = '기기 설정에서 마이약 알림을 켜주세요';

/**
 * OS 알림 권한 미허용 안내 (비차단)
 * - denied: [허용하기] → 시스템 권한 팝업
 * - blocked: [설정에서 켜기] → 시스템 설정 앱
 */
export function NotificationPermissionNotice({
  status,
  isRequesting = false,
  onRequest,
  onOpenSettings,
  onDismiss,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  style,
}: NotificationPermissionNoticeProps) {
  if (status !== 'denied' && status !== 'blocked') {
    return null;
  }

  const isBlocked = status === 'blocked';
  const descriptionText = isBlocked ? `${description}. ${BLOCKED_GUIDE}` : description;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <Ionicons name="notifications-off-outline" size={22} color={Colors.warning} style={styles.icon} />
        <View style={styles.textContainer}>
          <Typography variant="bodySmall" style={styles.title}>
            {title}
          </Typography>
          <Typography variant="caption" color={Colors.textSecondary} style={styles.description}>
            {descriptionText}
          </Typography>
        </View>
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="알림 권한 안내 닫기"
          >
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <Button
        title={isBlocked ? '설정에서 켜기' : '허용하기'}
        variant="primary"
        size="small"
        onPress={isBlocked ? onOpenSettings : onRequest}
        loading={isRequesting}
        disabled={isRequesting}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3E0',
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginTop: 2,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  description: {
    marginTop: 4,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 12,
    marginLeft: 32,
  },
});
