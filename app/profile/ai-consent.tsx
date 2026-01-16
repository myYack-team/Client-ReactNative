import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography, Card } from '../../components/ui';
import { Colors } from '../../constants';
import { AI_DATA_CONSENT } from '../../constants/termsContent';
import { userService } from '../../services';
import { AiConsentStatus } from '../../types';

export default function AiConsentScreen() {
  const [consentStatus, setConsentStatus] = useState<AiConsentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchConsentStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const status = await userService.getAiConsentStatus();
      setConsentStatus(status);
    } catch (error) {
      console.error('Failed to fetch AI consent status:', error);
      // 에러 시 기본값 설정
      setConsentStatus({ aiDataAgreed: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsentStatus();
  }, [fetchConsentStatus]);

  const handleToggle = async (value: boolean) => {
    if (isUpdating) return;

    // 동의 철회 시 경고
    if (!value && consentStatus?.aiDataAgreed) {
      Alert.alert(
        'AI 데이터 분석 동의 철회',
        '동의를 철회하면 처방전 스캔 기능과 AI 복약 분석 기능을 이용할 수 없습니다.\n\n정말 철회하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '철회',
            style: 'destructive',
            onPress: () => updateConsent(false),
          },
        ]
      );
      return;
    }

    // 동의 시
    if (value) {
      Alert.alert(
        'AI 데이터 분석 동의',
        '처방전 스캔 및 AI 복약 분석 기능을 위해 데이터 분석에 동의합니다.\n\n동의하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '동의',
            onPress: () => updateConsent(true),
          },
        ]
      );
    }
  };

  const updateConsent = async (agreed: boolean) => {
    try {
      setIsUpdating(true);
      const updated = await userService.updateAiConsent(agreed);
      setConsentStatus(updated);
      Alert.alert(
        '완료',
        agreed ? 'AI 데이터 분석에 동의하셨습니다.' : 'AI 데이터 분석 동의가 철회되었습니다.'
      );
    } catch (error) {
      console.error('Failed to update AI consent:', error);
      Alert.alert('오류', '설정 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 동의 상태 카드 */}
        <Card style={styles.statusCard} variant="elevated">
          <View style={styles.statusRow}>
            <View style={styles.statusTextContainer}>
              <Typography variant="h3" style={styles.statusTitle}>
                AI 데이터 분석 동의
              </Typography>
              <Typography variant="bodySmall" color={Colors.textSecondary}>
                {consentStatus?.aiDataAgreed
                  ? `${formatDate(consentStatus.consentedAt)} 동의함`
                  : '동의하지 않음'}
              </Typography>
            </View>
            <Switch
              value={consentStatus?.aiDataAgreed || false}
              onValueChange={handleToggle}
              disabled={isUpdating}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={consentStatus?.aiDataAgreed ? Colors.primary : Colors.textSecondary}
            />
          </View>
        </Card>

        {/* 설명 카드 */}
        <Card style={styles.infoCard} variant="elevated">
          <Typography variant="h3" style={styles.infoTitle}>
            AI 데이터 분석이란?
          </Typography>
          <Typography variant="body" color={Colors.textSecondary} style={styles.infoDescription}>
            마이약 서비스의 처방전/약봉투 스캔 기능과 AI 복약 분석 기능을 이용하기 위해 필요한 동의입니다.
          </Typography>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Typography variant="body" style={styles.featureIcon}>1</Typography>
              <View style={styles.featureTextContainer}>
                <Typography variant="body" style={styles.featureTitle}>
                  처방전 스캔
                </Typography>
                <Typography variant="bodySmall" color={Colors.textSecondary}>
                  카메라로 촬영한 처방전을 AI가 분석하여 약물 정보를 자동으로 추출합니다.
                </Typography>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Typography variant="body" style={styles.featureIcon}>2</Typography>
              <View style={styles.featureTextContainer}>
                <Typography variant="body" style={styles.featureTitle}>
                  AI 복약 분석
                </Typography>
                <Typography variant="bodySmall" color={Colors.textSecondary}>
                  등록된 약물을 분석하여 상호작용 위험과 음식 주의사항을 안내합니다.
                </Typography>
              </View>
            </View>
          </View>
        </Card>

        {/* 상세 약관 */}
        <Card style={styles.detailCard} variant="elevated">
          <Typography variant="h3" style={styles.detailTitle}>
            상세 내용
          </Typography>
          <Typography variant="bodySmall" color={Colors.textSecondary} style={styles.detailContent}>
            {AI_DATA_CONSENT}
          </Typography>
        </Card>

        {/* 주의사항 */}
        {!consentStatus?.aiDataAgreed && (
          <View style={styles.warningBox}>
            <Typography variant="bodySmall" color={Colors.warning} style={styles.warningText}>
              * AI 데이터 분석에 동의하지 않으면 처방전 스캔 기능과 AI 복약 분석 기능을 이용할 수 없습니다.
            </Typography>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    marginBottom: 4,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoTitle: {
    marginBottom: 8,
  },
  infoDescription: {
    lineHeight: 22,
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLightest,
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  detailCard: {
    marginBottom: 16,
  },
  detailTitle: {
    marginBottom: 12,
  },
  detailContent: {
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  warningText: {
    lineHeight: 20,
  },
});
