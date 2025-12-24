import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Typography, Button } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';

export default function LoadingScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { scanPrescription, scanError, clearScanError } = useMedicationStore();
  const hasStartedScan = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const performScan = async () => {
    if (!uri) return;

    setError(null);
    clearScanError();

    try {
      const result = await scanPrescription(uri);

      if (result.confidence === 'low') {
        Alert.alert(
          '인식 실패',
          '처방전을 인식하지 못했어요.\n다시 촬영해주세요.',
          [{ text: '확인', onPress: () => router.back() }]
        );
      } else {
        router.replace('/scan/result');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || '스캔에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (!uri || hasStartedScan.current) return;
    hasStartedScan.current = true;
    performScan();
  }, [uri]);

  const handleRetry = () => {
    setError(null);
    hasStartedScan.current = false;
    performScan();
  };

  const handleGoBack = () => {
    clearScanError();
    router.back();
  };

  // 에러 오버레이 표시
  if (error || scanError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <Typography variant="h3" style={styles.errorTitle}>
              ⚠️ 오류 발생
            </Typography>
            <Typography variant="body" style={styles.errorMessage}>
              {error || scanError}
            </Typography>
            <View style={styles.errorButtons}>
              <Button
                title="다시 시도"
                onPress={handleRetry}
                style={styles.retryButton}
              />
              <Button
                title="돌아가기"
                variant="outline"
                onPress={handleGoBack}
                style={styles.backButton}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
        <Typography variant="h2" style={styles.title}>
          분석 중...
        </Typography>
        <Typography variant="body" color={Colors.textSecondary} style={styles.subtitle}>
          처방전에서 약 정보를{'\n'}추출하고 있어요
        </Typography>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  spinner: {
    marginBottom: 32,
  },
  title: {
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 26,
  },
  errorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  errorTitle: {
    marginBottom: 8,
  },
  errorMessage: {
    textAlign: 'center',
    marginVertical: 16,
    color: Colors.textSecondary,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  retryButton: {
    flex: 1,
  },
  backButton: {
    flex: 1,
  },
});
