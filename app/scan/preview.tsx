import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Typography } from '../../components/ui';
import { Colors } from '../../constants';

export default function PreviewScreen() {
  const params = useLocalSearchParams<{ uri: string }>();
  const uri = Array.isArray(params.uri) ? params.uri[0] : params.uri;
  const [isNavigating, setIsNavigating] = useState(false);

  if (!uri) {
    router.replace('/scan/camera');
    return null;
  }

  const handleRetake = () => {
    router.back();
  };

  const handleAnalyze = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.replace({
      pathname: '/scan/loading',
      params: { uri },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Image Display Area - Top 60% */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Info and Actions Area - Bottom 40% */}
      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Typography variant="h3" style={styles.title}>
            촬영된 사진을 확인해주세요
          </Typography>
          <Typography variant="body" color={Colors.textSecondary} style={styles.subtitle}>
            글자가 잘 보이고, 처방 내용이 모두 포함되어 있나요?
          </Typography>
          <Typography variant="caption" color={Colors.textSecondary} style={styles.hint}>
            반듯하게 촬영된 사진일 때 정확도가 높아집니다
          </Typography>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="다시 촬영"
            variant="outline"
            onPress={handleRetake}
            style={styles.outlineButton}
          />
          <Button
            title="분석 시작"
            variant="primary"
            onPress={handleAnalyze}
            disabled={isNavigating}
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  imageContainer: {
    flex: 0.6,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 0.4,
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  textContainer: {
    gap: 8,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 4,
  },
  hint: {
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  outlineButton: {
    flex: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
});
