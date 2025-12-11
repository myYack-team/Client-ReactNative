import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  LayoutChangeEvent,
  Image,
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
} from 'react-native-reanimated';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { useMedicationStore } from '../../stores';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CROP_ASPECT_RATIO = 1.5; // 가로:세로 = 1.5:1 (약봉투 비율)
const CROP_WIDTH = SCREEN_WIDTH * 0.85;
const CROP_HEIGHT = CROP_WIDTH / CROP_ASPECT_RATIO;

export default function CropScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { scanPrescription } = useMedicationStore();
  const insets = useSafeAreaInsets();

  // 원본 이미지 크기
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  // 화면에 표시되는 이미지 크기 (비율 유지)
  const [displayedSize, setDisplayedSize] = useState({ width: 0, height: 0 });
  // 실제 컨테이너 크기 (onLayout으로 측정)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reanimated shared values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // 컨테이너 레이아웃 측정
  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    console.log('[onContainerLayout] containerSize:', { width, height });
    setContainerSize({ width, height });
  };

  // 컴포넌트 마운트 시 실제 이미지 크기 가져오기
  // Image.getSize()는 캐시된 크기를 반환할 수 있으므로,
  // ImageManipulator를 사용해서 실제 파일 크기를 확인
  useEffect(() => {
    if (!uri) return;

    const getActualImageSize = async () => {
      try {
        // 빈 작업으로 manipulate하면 실제 파일 크기를 얻을 수 있음
        const result = await ImageManipulator.manipulateAsync(uri, []);
        console.log('[ImageManipulator] Actual imageSize:', { width: result.width, height: result.height });
        setImageSize({ width: result.width, height: result.height });
      } catch (error) {
        console.error('[ImageManipulator] Error getting size:', error);
        // 폴백: Image.getSize 사용
        Image.getSize(
          uri,
          (width, height) => {
            console.log('[Image.getSize fallback] imageSize:', { width, height });
            setImageSize({ width, height });
          },
          (err) => console.error('[Image.getSize] Error:', err)
        );
      }
    };

    getActualImageSize();
  }, [uri]);

  // 이미지 로드 완료 시 (UI 준비 확인용)
  const onImageLoad = () => {
    console.log('[onImageLoad] Image rendered');
  };

  // displayedSize 계산 (컨테이너 크기 기반)
  const calculateDisplayedSize = (
    imgWidth: number,
    imgHeight: number,
    contWidth: number,
    contHeight: number
  ) => {
    const imageAspect = imgWidth / imgHeight;
    const containerAspect = contWidth / contHeight;

    let displayedWidth, displayedHeight;
    if (imageAspect > containerAspect) {
      // 이미지가 더 넓음 -> 너비에 맞춤
      displayedWidth = contWidth;
      displayedHeight = contWidth / imageAspect;
    } else {
      // 이미지가 더 높음 -> 높이에 맞춤
      displayedHeight = contHeight;
      displayedWidth = contHeight * imageAspect;
    }

    setDisplayedSize({ width: displayedWidth, height: displayedHeight });

    // 크롭 영역을 채우기 위한 초기 스케일 계산
    const scaleToFillCropWidth = CROP_WIDTH / displayedWidth;
    const scaleToFillCropHeight = CROP_HEIGHT / displayedHeight;
    const initialScale = Math.max(scaleToFillCropWidth, scaleToFillCropHeight) * 1.1;

    console.log('[calculateDisplayedSize] displayedSize:', { displayedWidth, displayedHeight });
    console.log('[calculateDisplayedSize] initialScale:', initialScale);

    scale.value = initialScale;
    savedScale.value = initialScale;
    setImageLoaded(true);
  };

  // imageSize와 containerSize가 모두 준비되면 displayedSize 계산
  useEffect(() => {
    if (imageSize.width > 0 && containerSize.width > 0 && !imageLoaded) {
      console.log('[useEffect] Both ready, calculating displayedSize');
      calculateDisplayedSize(
        imageSize.width,
        imageSize.height,
        containerSize.width,
        containerSize.height
      );
    }
  }, [containerSize, imageSize, imageLoaded]);

  // 핀치 줌 제스처
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(0.3, Math.min(5, savedScale.value * event.scale));
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

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  // 애니메이션 스타일
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // 크롭 및 스캔 처리
  const handleCrop = async () => {
    if (!uri || imageSize.width === 0 || containerSize.width === 0) return;

    setIsProcessing(true);

    try {
      const currentScale = scale.value;
      const currentTranslateX = translateX.value;
      const currentTranslateY = translateY.value;

      // ========================================
      // 핵심: 컨테이너 크기 기준으로 계산
      // ========================================

      const baseWidth = displayedSize.width;
      const baseHeight = displayedSize.height;

      // 1. 화면상 이미지의 크기 (스케일 적용)
      const scaledWidth = baseWidth * currentScale;
      const scaledHeight = baseHeight * currentScale;

      // 2. 화면상 이미지의 위치 (컨테이너 중앙 기준 + translate)
      const imageLeft = (containerSize.width - scaledWidth) / 2 + currentTranslateX;
      const imageTop = (containerSize.height - scaledHeight) / 2 + currentTranslateY;
      const imageRight = imageLeft + scaledWidth;
      const imageBottom = imageTop + scaledHeight;

      // 3. 가이드라인의 화면 좌표 (컨테이너 중앙 기준)
      const guideLeft = (containerSize.width - CROP_WIDTH) / 2;
      const guideTop = (containerSize.height - CROP_HEIGHT) / 2;
      const guideRight = guideLeft + CROP_WIDTH;
      const guideBottom = guideTop + CROP_HEIGHT;

      // 4. 가이드라인과 이미지가 겹치는 영역 (화면 좌표)
      const overlapLeft = Math.max(guideLeft, imageLeft);
      const overlapTop = Math.max(guideTop, imageTop);
      const overlapRight = Math.min(guideRight, imageRight);
      const overlapBottom = Math.min(guideBottom, imageBottom);

      // 5. 겹치는 영역이 이미지 내에서 차지하는 비율 계산
      const ratioLeft = (overlapLeft - imageLeft) / scaledWidth;
      const ratioTop = (overlapTop - imageTop) / scaledHeight;
      const ratioRight = (overlapRight - imageLeft) / scaledWidth;
      const ratioBottom = (overlapBottom - imageTop) / scaledHeight;

      // 6. 비율을 원본 이미지 크기에 적용
      const cropX = ratioLeft * imageSize.width;
      const cropY = ratioTop * imageSize.height;
      const cropWidth = (ratioRight - ratioLeft) * imageSize.width;
      const cropHeight = (ratioBottom - ratioTop) * imageSize.height;

      console.log('=== CROP DEBUG v9 (containerSize 기반) ===');
      console.log('[Crop] Original image:', imageSize);
      console.log('[Crop] Container size:', containerSize);
      console.log('[Crop] Displayed size:', displayedSize);
      console.log('[Crop] Scale:', currentScale, 'Translate:', { x: currentTranslateX, y: currentTranslateY });
      console.log('[Crop] 화면상 이미지:', { left: imageLeft.toFixed(1), top: imageTop.toFixed(1), width: scaledWidth.toFixed(1), height: scaledHeight.toFixed(1) });
      console.log('[Crop] 가이드라인:', { left: guideLeft.toFixed(1), top: guideTop.toFixed(1), width: CROP_WIDTH.toFixed(1), height: CROP_HEIGHT.toFixed(1) });
      console.log('[Crop] 겹치는 영역:', { left: overlapLeft.toFixed(1), top: overlapTop.toFixed(1), right: overlapRight.toFixed(1), bottom: overlapBottom.toFixed(1) });
      console.log('[Crop] 이미지 내 비율:', {
        left: (ratioLeft*100).toFixed(1)+'%',
        top: (ratioTop*100).toFixed(1)+'%',
        right: (ratioRight*100).toFixed(1)+'%',
        bottom: (ratioBottom*100).toFixed(1)+'%'
      });

      // 유효성 검사
      if (cropWidth <= 0 || cropHeight <= 0) {
        console.error('[Crop] Invalid crop dimensions:', { cropWidth, cropHeight });
        setIsProcessing(false);
        return;
      }

      // 7. 안전하게 클램핑
      const originX = Math.max(0, Math.round(cropX));
      const originY = Math.max(0, Math.round(cropY));
      const finalWidth = Math.max(100, Math.min(Math.round(cropWidth), imageSize.width - originX));
      const finalHeight = Math.max(100, Math.min(Math.round(cropHeight), imageSize.height - originY));

      console.log('[Crop] 원본에서 크롭:', { originX, originY, width: finalWidth, height: finalHeight });
      console.log('==========================================');

      // 이미지 크롭 (원본 해상도 유지 - OCR 정확도를 위해)
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX,
              originY,
              width: finalWidth,
              height: finalHeight,
            },
          },
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );

      console.log('[Crop] Result size:', manipResult.width, 'x', manipResult.height);

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
      {/* 이미지 컨테이너 - onLayout으로 실제 크기 측정 */}
      <View style={styles.imageContainer} onLayout={onContainerLayout}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View>
            <Animated.Image
              source={{ uri }}
              style={[
                {
                  width: displayedSize.width || containerSize.width || 1,
                  height: displayedSize.height || containerSize.height || 1,
                },
                animatedStyle,
              ]}
              onLoad={onImageLoad}
            />
          </Animated.View>
        </GestureDetector>
      </View>

      {/* 어두운 오버레이 (크롭 영역 외) */}
      <View style={styles.overlay} pointerEvents="none">
        {/* 상단 어두운 영역 */}
        <View style={[styles.darkArea, { height: (containerSize.height - CROP_HEIGHT) / 2 || 0 }]} />

        {/* 중간 행 */}
        <View style={[styles.middleRow, { height: CROP_HEIGHT }]}>
          {/* 좌측 어두운 영역 */}
          <View style={[styles.darkArea, { width: (containerSize.width - CROP_WIDTH) / 2 || 0 }]} />

          {/* 크롭 영역 (밝은 부분) */}
          <View style={styles.cropArea}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          {/* 우측 어두운 영역 */}
          <View style={[styles.darkArea, { width: (containerSize.width - CROP_WIDTH) / 2 || 0 }]} />
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  darkArea: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
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
