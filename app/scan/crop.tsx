import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_ASPECT_RATIO = 1.5; // 가로:세로 = 1.5:1 (약봉투 비율)
const CROP_WIDTH = SCREEN_WIDTH * 0.85;
const CROP_HEIGHT = CROP_WIDTH / CROP_ASPECT_RATIO;

export default function CropScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { scanPrescription } = useMedicationStore();
  const insets = useSafeAreaInsets();

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reanimated shared values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // 이미지 로드 시 크기 계산
  const onImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageSize({ width, height });

    // 이미지가 크롭 영역을 채우도록 초기 스케일 설정
    const scaleToFitWidth = CROP_WIDTH / width;
    const scaleToFitHeight = CROP_HEIGHT / height;
    const initialScale = Math.max(scaleToFitWidth, scaleToFitHeight) * 1.2;

    scale.value = initialScale;
    savedScale.value = initialScale;
    setImageLoaded(true);
  };

  // 핀치 줌 제스처
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(0.5, Math.min(5, savedScale.value * event.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // 팬 (드래그) 제스처
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // 제스처 동시 인식
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // 크롭 및 스캔 처리
  const handleCrop = async () => {
    if (!uri || imageSize.width === 0) return;

    setIsProcessing(true);

    try {
      const currentScale = scale.value;
      const currentTranslateX = translateX.value;
      const currentTranslateY = translateY.value;

      // 화면상 이미지 크기
      const displayedWidth = imageSize.width * currentScale;
      const displayedHeight = imageSize.height * currentScale;

      // 크롭 영역의 화면 중앙 좌표
      const cropCenterX = SCREEN_WIDTH / 2;
      const cropCenterY = SCREEN_HEIGHT / 2;

      // 이미지 중앙 좌표 (변환 적용)
      const imageCenterX = SCREEN_WIDTH / 2 + currentTranslateX;
      const imageCenterY = SCREEN_HEIGHT / 2 + currentTranslateY;

      // 크롭 영역의 이미지 내 좌표 계산
      const cropLeftInDisplay = cropCenterX - CROP_WIDTH / 2;
      const cropTopInDisplay = cropCenterY - CROP_HEIGHT / 2;

      // 이미지 좌상단 기준 좌표
      const imageLeft = imageCenterX - displayedWidth / 2;
      const imageTop = imageCenterY - displayedHeight / 2;

      // 크롭 영역의 이미지 내 상대 좌표
      const cropX = (cropLeftInDisplay - imageLeft) / currentScale;
      const cropY = (cropTopInDisplay - imageTop) / currentScale;
      const cropWidth = CROP_WIDTH / currentScale;
      const cropHeight = CROP_HEIGHT / currentScale;

      // 원본 이미지 기준 좌표로 변환 (범위 체크)
      const originX = Math.max(0, Math.min(cropX, imageSize.width - cropWidth));
      const originY = Math.max(0, Math.min(cropY, imageSize.height - cropHeight));
      const width = Math.min(cropWidth, imageSize.width - originX);
      const height = Math.min(cropHeight, imageSize.height - originY);

      // 이미지 크롭
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: Math.round(Math.max(0, originX)),
              originY: Math.round(Math.max(0, originY)),
              width: Math.round(Math.max(1, width)),
              height: Math.round(Math.max(1, height)),
            },
          },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 로딩 화면으로 이동
      router.push('/scan/loading');

      // 스캔 처리
      const result = await scanPrescription(manipResult.uri);

      if (result.confidence === 'low') {
        router.back();
        router.back();
      } else {
        router.replace('/scan/result');
      }
    } catch (error) {
      console.error('Crop error:', error);
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!uri) {
    return (
      <View style={styles.container}>
        <Typography variant="body">이미지를 불러올 수 없습니다.</Typography>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* 이미지 영역 */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.imageContainer}>
          <Animated.Image
            source={{ uri }}
            style={[styles.image, animatedStyle]}
            onLoad={onImageLoad}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>

      {/* 어두운 오버레이 (크롭 영역 외) */}
      <View style={styles.overlay} pointerEvents="none">
        {/* 상단 어두운 영역 */}
        <View style={[styles.darkArea, { height: (SCREEN_HEIGHT - CROP_HEIGHT) / 2 - 30 }]} />

        {/* 중간 행 */}
        <View style={styles.middleRow}>
          {/* 좌측 어두운 영역 */}
          <View style={[styles.darkArea, { width: (SCREEN_WIDTH - CROP_WIDTH) / 2 }]} />

          {/* 크롭 영역 (밝은 부분) */}
          <View style={styles.cropArea}>
            {/* 코너 표시 */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          {/* 우측 어두운 영역 */}
          <View style={[styles.darkArea, { width: (SCREEN_WIDTH - CROP_WIDTH) / 2 }]} />
        </View>

        {/* 하단 어두운 영역 */}
        <View style={[styles.darkArea, { flex: 1 }]} />
      </View>

      {/* 안내 문구 */}
      <View style={[styles.guideContainer, { top: insets.top + 20 }]}>
        <Typography variant="body" color={Colors.white} style={styles.guideText}>
          두 손가락으로 확대/축소, 드래그로 위치 조절
        </Typography>
      </View>

      {/* 하단 버튼 */}
      <View style={[styles.bottomButtons, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Typography variant="body" color={Colors.white}>
            취소
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isProcessing && styles.disabledButton]}
          onPress={handleCrop}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Typography variant="body" color={Colors.white}>
              스캔하기
            </Typography>
          )}
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  darkArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: CROP_HEIGHT,
  },
  cropArea: {
    width: CROP_WIDTH,
    height: CROP_HEIGHT,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#4CAF50',
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  guideContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  guideText: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
