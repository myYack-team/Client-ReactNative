import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore, useSettingsStore } from '../stores';
import { Colors } from '../constants';

export default function RootLayout() {
  const { initialize: initAuth, isLoading: authLoading } = useAuthStore();
  const { initialize: initSettings, isLoading: settingsLoading } = useSettingsStore();

  useEffect(() => {
    initAuth();
    initSettings();
  }, []);

  if (authLoading || settingsLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
