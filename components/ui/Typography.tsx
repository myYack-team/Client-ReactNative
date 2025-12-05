import React, { ReactNode } from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors } from '../../constants';
import { FontSizes, LineHeights } from '../../constants/fonts';
import { useSettingsStore } from '../../stores';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption';

interface TypographyProps {
  children: ReactNode;
  variant?: TypographyVariant;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
}

export function Typography({
  children,
  variant = 'body',
  color = Colors.textPrimary,
  style,
  numberOfLines,
}: TypographyProps) {
  const fontSizeMode = useSettingsStore((state) => state.fontSizeMode);
  const fontSize = FontSizes[fontSizeMode];
  const lineHeight = LineHeights[fontSizeMode];

  const getStyle = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: fontSize['3xl'],
          lineHeight: lineHeight['3xl'],
          fontWeight: '700',
        };
      case 'h2':
        return {
          fontSize: fontSize['2xl'],
          lineHeight: lineHeight['2xl'],
          fontWeight: '600',
        };
      case 'h3':
        return {
          fontSize: fontSize.xl,
          lineHeight: lineHeight.xl,
          fontWeight: '600',
        };
      case 'body':
        return {
          fontSize: fontSize.base,
          lineHeight: lineHeight.base,
          fontWeight: '400',
        };
      case 'bodySmall':
        return {
          fontSize: fontSize.sm,
          lineHeight: lineHeight.sm,
          fontWeight: '400',
        };
      case 'caption':
        return {
          fontSize: fontSize.xs,
          lineHeight: lineHeight.xs,
          fontWeight: '400',
        };
    }
  };

  return (
    <Text
      style={[getStyle(), { color }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}
