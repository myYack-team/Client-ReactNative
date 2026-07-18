import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card, Typography, Button } from '../../components/ui';
import { Colors } from '../../constants';
import { useFamilyStore } from '../../stores';

export default function FamilySettingsScreen() {
  const {
    linkStatus,
    notificationSettings,
    fetchLinkStatus,
    fetchNotificationSettings,
    updateNotificationSettings,
    unlinkFamily,
    isLoadingStatus,
  } = useFamilyStore();

  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // 설정 메뉴에서 바로 진입하는 경우를 위해 연동 상태도 함께 로드
    fetchLinkStatus();
    fetchNotificationSettings();
  }, []);

  useEffect(() => {
    if (notificationSettings) {
      setNotificationEnabled(notificationSettings.familyNotificationEnabled);
    }
  }, [notificationSettings]);

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationEnabled(value);
    setIsUpdating(true);
    try {
      await updateNotificationSettings(value);
    } catch (error) {
      setNotificationEnabled(!value); // 롤백
      Alert.alert('오류', '설정 변경에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnlink = () => {
    if (!linkStatus?.linkedFamilies?.length) return;

    const linkedFamily = linkStatus.linkedFamilies[0];

    Alert.alert(
      '가족 연결 해제',
      `${linkedFamily.name}님과의 연결을 해제하시겠어요?\n\n해제 후에는 가족의 복약 현황을 볼 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '연결 해제',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkFamily(linkedFamily.linkId);
              Alert.alert('완료', '가족 연결이 해제되었습니다.', [
                { text: '확인', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('오류', '연결 해제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const linkedFamily = linkStatus?.linkedFamilies?.[0];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* 연결된 가족 정보 */}
        {linkedFamily && (
          <Card style={styles.card} variant="elevated">
            <Typography variant="h3" style={styles.sectionTitle}>
              연결된 가족
            </Typography>
            <View style={styles.familyInfo}>
              <Typography variant="body" style={styles.familyName}>
                {linkedFamily.name}
              </Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                {linkedFamily.phone}
              </Typography>
            </View>
          </Card>
        )}

        {/* 알림 설정 */}
        <Card style={styles.card} variant="elevated">
          <Typography variant="h3" style={styles.sectionTitle}>
            알림 설정
          </Typography>
          <View style={styles.settingItem}>
            <View style={styles.settingTextContainer}>
              <Typography variant="body">가족 알림 받기</Typography>
              <Typography variant="caption" color={Colors.textSecondary}>
                가족이 약을 복용하면 알림을 받습니다
              </Typography>
            </View>
            <Switch
              value={notificationEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={notificationEnabled ? Colors.primary : Colors.white}
              disabled={isUpdating}
            />
          </View>
        </Card>

        {/* 연결 해제 */}
        {linkedFamily && (
          <Button
            title="가족 연결 해제하기"
            variant="outline"
            size="large"
            onPress={handleUnlink}
            style={styles.unlinkButton}
            disabled={isLoadingStatus}
          />
        )}
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
  sectionTitle: {
    marginBottom: 16,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  familyInfo: {
    paddingVertical: 8,
  },
  familyName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  unlinkButton: {
    marginTop: 'auto',
    borderColor: Colors.error,
  },
});
