import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants';
import { FontSizes } from '../../constants/fonts';
import { useSettingsStore } from '../../stores';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: '홈',
    medications: '약',
    history: '처방',
    analysis: '분석',
    profile: '내 정보',
  };

  const emojis: Record<string, string> = {
    home: '🏠',
    medications: '💊',
    history: '📋',
    analysis: '✨',
    profile: '👤',
  };

  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.emoji, focused && styles.emojiActive]}>
        {emojis[name]}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const fontSizeMode = useSettingsStore((state) => state.fontSizeMode);
  const fontSize = FontSizes[fontSizeMode];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.sm,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: '약 목록',
          tabBarIcon: ({ focused }) => <TabIcon name="medications" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '처방 기록',
          tabBarIcon: ({ focused }) => <TabIcon name="history" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'AI 분석',
          tabBarIcon: ({ focused }) => <TabIcon name="analysis" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '내 정보',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
    opacity: 0.6,
  },
  emojiActive: {
    opacity: 1,
  },
});
