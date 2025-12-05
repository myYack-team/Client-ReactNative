import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { scanPrescription, isLoading } = useMedicationStore();

  if (!permission) {
    return (
      <View style={styles.container}>
        <Typography variant="body">카메라 권한을 확인하는 중...</Typography>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Typography variant="h3" style={styles.permissionTitle}>
          카메라 권한이 필요해요
        </Typography>
        <Typography variant="body" color={Colors.textSecondary} style={styles.permissionText}>
          처방전이나 약봉투를 촬영하려면{'\n'}카메라 권한을 허용해주세요
        </Typography>
        <Button
          title="권한 허용하기"
          variant="primary"
          onPress={requestPermission}
          style={styles.permissionButton}
        />
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        await processImage(photo.uri);
      }
    } catch (error) {
      Alert.alert('오류', '사진 촬영에 실패했어요. 다시 시도해주세요.');
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    router.push('/scan/loading');

    try {
      const result = await scanPrescription(uri);

      if (result.confidence === 'low') {
        Alert.alert(
          '인식 실패',
          '처방전을 명확하게 읽을 수 없어요.\n다시 촬영해주세요.',
          [{ text: '확인', onPress: () => router.back() }]
        );
      } else {
        router.replace('/scan/result');
      }
    } catch (error) {
      Alert.alert('오류', '처방전 분석에 실패했어요. 다시 시도해주세요.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        <View style={styles.overlay}>
          <View style={styles.guideBox}>
            <Typography variant="body" color={Colors.white} style={styles.guideText}>
              처방전 또는 약봉투를{'\n'}가이드 안에 맞춰주세요
            </Typography>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
            <Typography variant="body" color={Colors.white}>
              갤러리
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={isLoading}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>

          <View style={styles.placeholder} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  permissionTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBox: {
    width: '85%',
    aspectRatio: 1.5,
    borderWidth: 3,
    borderColor: Colors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  guideText: {
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  galleryButton: {
    padding: 16,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    borderWidth: 4,
    borderColor: Colors.textPrimary,
  },
  placeholder: {
    width: 60,
  },
});
