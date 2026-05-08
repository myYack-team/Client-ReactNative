import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ScreenOrientation from 'expo-screen-orientation';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Typography, AiConsentModal } from '../../components/ui';
import { Colors } from '../../constants';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useMedicationStore } from '../../stores';
import { userService } from '../../services';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isLandscape, setIsLandscape] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { isLoading } = useMedicationStore();
  const insets = useSafeAreaInsets();
  const [cameraLayout, setCameraLayout] = useState<{ width: number; height: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // AI 동의 상태
  const [hasAiConsent, setHasAiConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isCheckingConsent, setIsCheckingConsent] = useState(true);

  // AI 동의 확인
  useEffect(() => {
    const checkAiConsent = async () => {
      try {
        const status = await userService.getAiConsentStatus();
        if (status.aiDataAgreed) {
          setHasAiConsent(true);
        } else {
          setShowConsentModal(true);
        }
      } catch (error) {
        console.error('AI 동의 상태 확인 실패:', error);
        setShowConsentModal(true); // 에러 시에도 모달 표시
      } finally {
        setIsCheckingConsent(false);
      }
    };

    checkAiConsent();
  }, []);

  // 화면 진입 시 세로 모드로 고정 (AI 동의 모달이 세로로 표시되도록)
  useEffect(() => {
    const lockPortrait = async () => {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
      setIsLandscape(false);
    };

    lockPortrait();

    // 화면 이탈 시에도 세로 모드 유지
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

  // AI 동의 처리
  const handleConsent = async () => {
    try {
      await userService.updateAiConsent(true);
      setHasAiConsent(true);
      setShowConsentModal(false);
    } catch (error) {
      console.error('AI 동의 처리 실패:', error);
      Alert.alert('오류', 'AI 동의 처리에 실패했어요.');
    }
  };

  const handleCapture = async () => {
    // AI 동의 확인
    if (!hasAiConsent) {
      setShowConsentModal(true);
      return;
    }

    if (!cameraRef.current) return;

    if (isCapturing) return;
    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        let finalUri = photo.uri;

        // 가이드 프레임 영역으로 크롭 (사진 크기 정보가 있는 경우)
        if (photo.width && photo.height) {
          try {
            const screenW = cameraLayout?.width ?? SCREEN_WIDTH;
            const screenH = cameraLayout?.height ?? SCREEN_HEIGHT;
            // Android: EXIF 회전이 있을 경우 photo.width/height는 센서 기준(가로)일 수 있음
            let pw = photo.width;
            let ph = photo.height;
            const isPortraitView = screenH >= screenW;
            const isPortraitPhoto = ph >= pw;
            if (isPortraitView !== isPortraitPhoto) {
              // EXIF에 회전이 있어 width/height가 센서 기준일 가능성
              [pw, ph] = [ph, pw];
            }
            const photoAspect = pw / ph;
            const screenAspect = screenW / screenH;
            let visibleW: number, visibleH: number, offsetX: number, offsetY: number;
            if (photoAspect > screenAspect) {
              visibleH = ph;
              visibleW = ph * screenAspect;
              offsetX = (pw - visibleW) / 2;
              offsetY = 0;
            } else {
              visibleW = pw;
              visibleH = pw / screenAspect;
              offsetX = 0;
              offsetY = (ph - visibleH) / 2;
            }
            const scaleX = visibleW / screenW;
            const scaleY = visibleH / screenH;
            const rawX = offsetX + ((SCREEN_WIDTH - GUIDE_WIDTH) / 2) * scaleX;
            const rawY = offsetY + ((SCREEN_HEIGHT - GUIDE_HEIGHT) / 2) * scaleY;
            const rawW = GUIDE_WIDTH * scaleX;
            const rawH = GUIDE_HEIGHT * scaleY;
            const originX = Math.max(0, Math.round(rawX));
            const originY = Math.max(0, Math.round(rawY));
            const cropW = Math.min(pw - originX, Math.round(rawW));
            const cropH = Math.min(ph - originY, Math.round(rawH));

            const cropped = await manipulateAsync(
              photo.uri,
              [{ crop: { originX, originY, width: cropW, height: cropH } }],
              { compress: 0.8, format: SaveFormat.JPEG }
            );
            finalUri = cropped.uri;
          } catch (cropError) {
            console.error('Failed to crop photo to guide frame:', cropError);
            // 크롭 실패 시 원본 URI 사용
          }
        }

        // 세로 모드로 전환 후 미리보기 화면으로 이동
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
        router.push({
          pathname: '/scan/preview',
          params: { uri: finalUri },
        });
      }
    } catch (error) {
      Alert.alert('오류', '사진 촬영에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickImage = async () => {
    // AI 동의 확인
    if (!hasAiConsent) {
      setShowConsentModal(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1, // 원본 품질 유지
    });

    if (!result.canceled && result.assets[0]) {
      // 미리보기 화면으로 이동
      router.push({
        pathname: '/scan/preview',
        params: { uri: result.assets[0].uri },
      });
    }
    // 취소 시에도 세로 모드 유지 (변경 불필요)
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setCameraLayout({ width, height });
        }}
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

        {/* 컨트롤 버튼 (세로 모드: 하단에 배치) */}
        <View style={[
          styles.controlsPortrait,
          {
            paddingBottom: Math.max(insets.bottom, 20),
          }
        ]}>
          <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
            <View style={styles.iconButton}>
              <Typography variant="h3" color={Colors.white}>
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
            disabled={isLoading || isCapturing}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <View style={styles.iconButton}>
              <Typography variant="h3" color={Colors.white}>
                ✕
              </Typography>
            </View>
            <Typography variant="caption" color={Colors.white}>
              닫기
            </Typography>
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* AI 동의 모달 */}
      <AiConsentModal
        visible={showConsentModal}
        onAgree={handleConsent}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// 세로 모드 기준으로 가이드 프레임 크기 설정
const GUIDE_WIDTH = SCREEN_WIDTH * 0.85;
const GUIDE_HEIGHT = GUIDE_WIDTH * 1.4; // 세로 비율 (약봉투를 세로로 촬영)
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
  controlsPortrait: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 20,
    paddingHorizontal: 20,
    // paddingBottom은 인라인에서 insets.bottom으로 동적 적용
  },
  galleryButton: {
    alignItems: 'center',
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
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
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.white,
    borderWidth: 4,
    borderColor: Colors.textPrimary,
  },
  closeButton: {
    alignItems: 'center',
  },
});
