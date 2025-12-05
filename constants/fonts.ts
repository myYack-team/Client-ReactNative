export type FontSizeMode = 'small' | 'medium' | 'large';

export const FontSizes = {
  small: {
    xs: 12,
    sm: 14,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
  },
  medium: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
  },
  large: {
    xs: 14,
    sm: 16,
    base: 18,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 32,
  },
};

export const LineHeights = {
  small: {
    xs: 16,
    sm: 20,
    base: 20,
    lg: 24,
    xl: 26,
    '2xl': 28,
    '3xl': 32,
  },
  medium: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 26,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
  },
  large: {
    xs: 20,
    sm: 24,
    base: 26,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 40,
  },
};

export const DEFAULT_FONT_SIZE_MODE: FontSizeMode = 'large';
