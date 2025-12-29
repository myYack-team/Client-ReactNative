import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Typography } from '../../components/ui';
import { Colors } from '../../constants';
import { FontSizeMode, FontSizes } from '../../constants/fonts';
import { useSettingsStore } from '../../stores';

interface FontSizeOptionProps {
  label: string;
  value: FontSizeMode;
  selected: boolean;
  onSelect: () => void;
}

function FontSizeOption({ label, value, selected, onSelect }: FontSizeOptionProps) {
  const fontSize = FontSizes[value];

  return (
    <TouchableOpacity
      style={[styles.optionContainer, selected && styles.optionSelected]}
      onPress={onSelect}
    >
      <View style={styles.optionHeader}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
        <Typography variant="body" style={selected ? styles.labelSelected : undefined}>
          {label}
        </Typography>
      </View>
      <Typography
        variant="body"
        style={[styles.previewText, { fontSize: fontSize.base }]}
        color={Colors.textSecondary}
      >
        가나다라마바사 아자차카타파하
      </Typography>
    </TouchableOpacity>
  );
}

export default function FontSizeScreen() {
  const { fontSizeMode, setFontSizeMode } = useSettingsStore();

  const fontSizeOptions: { label: string; value: FontSizeMode }[] = [
    { label: '작게', value: 'small' },
    { label: '보통', value: 'medium' },
    { label: '크게', value: 'large' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Card style={styles.card} variant="elevated">
          {fontSizeOptions.map((option, index) => (
            <View key={option.value}>
              <FontSizeOption
                label={option.label}
                value={option.value}
                selected={fontSizeMode === option.value}
                onSelect={() => setFontSizeMode(option.value)}
              />
              {index < fontSizeOptions.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  optionContainer: {
    padding: 16,
  },
  optionSelected: {
    backgroundColor: Colors.primaryLightest,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  labelSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  previewText: {
    marginLeft: 34,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
