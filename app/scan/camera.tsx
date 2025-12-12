import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ScreenOrientation from 'expo-screen-orientation';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isLandscape, setIsLandscape] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { isLoading } = useMedicationStore();
  const insets = useSafeAreaInsets();

  // 화면 진입 시 가로 모드로 고정
  useEffect(() => {
    const lockLandscape = async () => {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
      );
      setIsLandscape(true);
    };

    lockLandscape();

    // 화면 이탈 시 세로 모드로 복원
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    };
  }, []);

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
        quality: 1, // 원본 품질 유지 (무손실)
      });

      if (photo?.uri) {
        // 세로 모드로 전환 후 로딩 화면으로 이동 (원본 이미지 전송)
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
        router.push({
          pathname: '/scan/loading',
          params: { uri: photo.uri },
        });
      }
    } catch (error) {
      Alert.alert('오류', '사진 촬영에 실패했어요. 다시 시도해주세요.');
    }
  };

  const handlePickImage = async () => {
    // 갤러리 열기 전 세로 모드로 전환
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1, // 원본 품질 유지
    });

    if (!result.canceled && result.assets[0]) {
      // 로딩 화면으로 이동 (원본 이미지 전송)
      router.push({
        pathname: '/scan/loading',
        params: { uri: result.assets[0].uri },
      });
    } else {
      // 취소 시 다시 가로 모드로
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* 가이드 프레임 오버레이 */}
        <View style={styles.overlay}>
          {/* 상단 안내 문구 */}
          <View style={styles.topGuide}>
            <Typography variant="body" color={Colors.white} style={styles.guideText}>
              📋 약봉투를 가이드 안에 맞춰주세요
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.7)" style={styles.subGuideText}>
              글자가 정방향으로 보이도록 맞춰주세요
            </Typography>
          </View>

          {/* 가이드 프레임 */}
          <View style={styles.guideFrame}>
            {/* 코너 표시 - 좌상단 */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            {/* 코너 표시 - 우상단 */}
            <View style={[styles.corner, styles.cornerTopRight]} />
            {/* 코너 표시 - 좌하단 */}
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            {/* 코너 표시 - 우하단 */}
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
        </View>

        {/* 컨트롤 버튼 (가로 모드: 우측에 배치) */}
        <View style={[
          styles.controlsLandscape,
          {
            paddingRight: Math.max(insets.right, 16),
            width: 100 + Math.max(insets.right, 16),
          }
        ]}>
          <TouchableOpacity style={styles.galleryButtonLandscape} onPress={handlePickImage}>
            <View style={styles.iconButton}>
              <Typography variant="caption" color={Colors.white}>
                🖼️
              </Typography>
            </View>
            <Typography variant="caption" color={Colors.white}>
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

          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <View style={styles.iconButton}>
              <Typography variant="caption" color={Colors.white}>
                ✕
              </Typography>
            </View>
            <Typography variant="caption" color={Colors.white}>
              닫기
            </Typography>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GUIDE_WIDTH = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.85;
const GUIDE_HEIGHT = GUIDE_WIDTH * 0.65; // 약봉투 비율
const CORNER_SIZE = 30;
const CORNER_THICKNESS = 4;

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
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topGuide: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  guideText: {
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subGuideText: {
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  guideFrame: {
    width: GUIDE_WIDTH,
    height: GUIDE_HEIGHT,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#4CAF50',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 8,
  },
  controlsLandscape: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 20,
    paddingLeft: 16,
    // width와 paddingRight는 인라인에서 insets.right로 동적 적용
  },
  galleryButtonLandscape: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    borderWidth: 4,
    borderColor: Colors.textPrimary,
  },
  closeButton: {
    alignItems: 'center',
  },
});
