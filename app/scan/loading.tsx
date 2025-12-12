import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';

export default function LoadingScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { scanPrescription } = useMedicationStore();
  const hasStartedScan = useRef(false);

  useEffect(() => {
    if (!uri || hasStartedScan.current) return;

    hasStartedScan.current = true;

    const performScan = async () => {
      try {
        // 원본 이미지로 스캔 처리
        const result = await scanPrescription(uri);

        if (result.confidence === 'low') {
          // 인식 실패 시 카메라 화면으로 돌아가기
          Alert.alert(
            '인식 실패',
            '처방전을 인식하지 못했어요.\n다시 촬영해주세요.',
            [{ text: '확인', onPress: () => router.back() }]
          );
        } else {
          // 인식 성공 시 결과 화면으로 이동
          router.replace('/scan/result');
        }
      } catch (error) {
        console.error('Scan error:', error);
        Alert.alert(
          '오류',
          '처방전 분석 중 오류가 발생했어요.\n다시 시도해주세요.',
          [{ text: '확인', onPress: () => router.back() }]
        );
      }
    };

    performScan();
  }, [uri, scanPrescription]);

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
});
