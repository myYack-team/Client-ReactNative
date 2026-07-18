export const Colors = {
  // Brand Navy (로고 색상)
  brand: '#2C3E50',
  brandLight: '#34495E',
  brandLightest: '#ECF0F1',
  brandDark: '#1A252F',
  // Primary
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryLightest: '#E8F5E9',
  primaryDark: '#1B5E20',
  secondary: '#1565C0',
  secondaryLight: '#1976D2',
  kakao: '#FEE500',
  kakaoText: '#191919',
  warning: '#E65100',
  warningLight: '#FF9800',
  error: '#D32F2F',
  success: '#2E7D32',
  // 페이지 배경은 연한 그레이, 카드/헤더 등 서피스는 흰색으로 분리해 대비 확보
  background: '#F4F5F7',
  backgroundSecondary: '#EDEFF2',
  surface: '#FFFFFF',
  text: '#212121',
  textPrimary: '#212121',
  textSecondary: '#616161',
  textLight: '#9E9E9E',
  textTertiary: '#757575',
  textDisabled: '#9E9E9E',
  border: '#E4E7EB',
  divider: '#EEF0F2',
  white: '#FFFFFF',
  black: '#000000',
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const Radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};
