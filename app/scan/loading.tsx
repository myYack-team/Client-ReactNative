import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui';
import { Colors } from '../../constants';

export default function LoadingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
        <Typography variant="h2" style={styles.title}>
          분석 중...
        </Typography>
        <Typography variant="body" color={Colors.textSecondary} style={styles.subtitle}>
          처방전에서 약 정보를{'\n'}추출하고 있어요
        </Typography>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  spinner: {
    marginBottom: 32,
  },
  title: {
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 26,
  },
});
