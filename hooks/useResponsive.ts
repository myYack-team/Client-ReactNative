import { useWindowDimensions, ViewStyle } from 'react-native';
import { BREAKPOINTS, CONTENT_MAX_WIDTH, MODAL_WIDTH } from '../constants/responsive';

interface ResponsiveResult {
  // 화면 정보
  screenWidth: number;
  screenHeight: number;
  isTablet: boolean;

  // 콘텐츠 너비
  contentMaxWidth: number | undefined;
  contentStyle: ViewStyle | undefined;

  // 모달 너비
  modalWidth: number;
}

export function useResponsive(): ResponsiveResult {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= BREAKPOINTS.tablet;

  return {
    // 화면 정보
    screenWidth: width,
    screenHeight: height,
    isTablet,

    // 콘텐츠 너비
    contentMaxWidth: isTablet ? CONTENT_MAX_WIDTH : undefined,
    contentStyle: isTablet
      ? {
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
          width: '100%',
        }
      : undefined,

    // 모달 너비
    modalWidth: isTablet ? MODAL_WIDTH.tablet : width * MODAL_WIDTH.mobile,
  };
}
