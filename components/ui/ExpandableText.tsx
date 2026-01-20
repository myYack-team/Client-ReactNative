import React, { useState } from 'react';
import { View, TouchableOpacity, LayoutAnimation, Platform, UIManager, Text, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { Colors } from '../../constants';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableTextProps {
  text: string;
  numberOfLines?: number;
}

export function ExpandableText({ text, numberOfLines = 3 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const [measured, setMeasured] = useState(false);

  const handleTextLayout = (e: any) => {
    if (!measured) {
      // 첫 렌더링에서 실제 줄 수 측정
      const actualLines = e.nativeEvent.lines.length;
      if (actualLines > numberOfLines) {
        setShouldShowButton(true);
      }
      setMeasured(true);
    }
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // 첫 렌더링에서는 numberOfLines 제한 없이 측정
  if (!measured) {
    return (
      <View>
        <Text
          style={[styles.text, { opacity: 0, position: 'absolute' }]}
          onTextLayout={handleTextLayout}
        >
          {text}
        </Text>
        <Text
          style={styles.text}
          numberOfLines={numberOfLines}
        >
          {text}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text
        style={styles.text}
        numberOfLines={expanded ? undefined : numberOfLines}
      >
        {text}
      </Text>
      {shouldShowButton && (
        <TouchableOpacity onPress={toggleExpanded} style={styles.button}>
          <Typography variant="bodySmall" color={Colors.primary}>
            {expanded ? '접기' : '더보기'}
          </Typography>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    lineHeight: 22,
    fontSize: 14,
    color: Colors.text,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
});
