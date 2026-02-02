import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { Typography } from './Typography';
import { Colors } from '../../constants';

interface TabHeaderProps {
  title?: string;
  showSettingsButton?: boolean;
  rightContent?: React.ReactNode;
}

export function TabHeader({ title, showSettingsButton = true, rightContent }: TabHeaderProps) {
  const handleSettingsPress = () => {
    router.push('/settings');
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        {title && <Typography variant="h2">{title}</Typography>}
      </View>
      <View style={styles.rightContent}>
        {rightContent}
        {showSettingsButton && (
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
            <Text style={styles.settingsIcon}>&#9881;</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButton: {
    padding: 4,
  },
  settingsIcon: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
});
