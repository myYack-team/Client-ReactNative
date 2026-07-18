import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius } from '../../constants';
import { useSettingsStore } from '../../stores';
import { FontSizes } from '../../constants/fonts';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'kakao';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const fontSizeMode = useSettingsStore((state) => state.fontSizeMode);
  const fontSize = FontSizes[fontSizeMode];

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      ...styles.button,
    };

    switch (size) {
      case 'small':
        base.paddingVertical = 10;
        base.paddingHorizontal = 16;
        base.minHeight = 44;
        break;
      case 'medium':
        base.paddingVertical = 14;
        base.paddingHorizontal = 24;
        base.minHeight = 52;
        break;
      case 'large':
        base.paddingVertical = 18;
        base.paddingHorizontal = 32;
        base.minHeight = 60;
        break;
    }

    switch (variant) {
      case 'primary':
        base.backgroundColor = Colors.primary;
        break;
      case 'secondary':
        base.backgroundColor = Colors.secondary;
        break;
      case 'outline':
        base.backgroundColor = Colors.surface;
        base.borderWidth = 1.5;
        base.borderColor = Colors.primary;
        break;
      case 'danger':
        base.backgroundColor = Colors.surface;
        base.borderWidth = 1.5;
        base.borderColor = Colors.error;
        break;
      case 'kakao':
        base.backgroundColor = Colors.kakao;
        break;
    }

    if (disabled || loading) {
      base.opacity = 0.6;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: '600',
    };

    switch (size) {
      case 'small':
        base.fontSize = fontSize.base;
        break;
      case 'medium':
        base.fontSize = fontSize.lg;
        break;
      case 'large':
        base.fontSize = fontSize.xl;
        break;
    }

    switch (variant) {
      case 'primary':
      case 'secondary':
        base.color = Colors.white;
        break;
      case 'outline':
        base.color = Colors.primary;
        break;
      case 'danger':
        base.color = Colors.error;
        break;
      case 'kakao':
        base.color = Colors.kakaoText;
        break;
    }

    return base;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? Colors.primary : variant === 'danger' ? Colors.error : Colors.white}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
