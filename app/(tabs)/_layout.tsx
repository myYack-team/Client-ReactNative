import { Tabs } from 'expo-router';
import { View, Image, StyleSheet } from 'react-native';
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
    family: '가족연동',
  };

  const iconImages: Record<string, any> = {
    home: require('../../assets/icons_iamge_processed/01_Home.png'),
    medications: require('../../assets/icons_iamge_processed/02_Pill.png'),
    history: require('../../assets/icons_iamge_processed/03_Clipboard.png'),
    analysis: require('../../assets/icons_iamge_processed/04_AI.png'),
    family: require('../../assets/icons_iamge_processed/family.png'),
  };

  return (
    <View style={styles.tabIcon}>
      <Image
        source={iconImages[name]}
        style={[
          styles.iconImage,
          {
            opacity: focused ? 1 : 0.6,
            tintColor: focused ? Colors.textPrimary : Colors.textSecondary
          }
        ]}
        accessibilityLabel={`${icons[name]} tab icon`}
        resizeMode="contain"
      />
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
          height: (fontSize.sm > 14 ? 64 : 56) + insets.bottom,
          paddingTop: 2,
          paddingBottom: insets.bottom + 14,
          borderTopWidth: 1,
          borderTopColor: Colors.divider,
          backgroundColor: Colors.surface,
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
        name="family"
        options={{
          title: '가족연동',
          tabBarIcon: ({ focused }) => <TabIcon name="family" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  iconImage: {
    width: 24,
    height: 24,
  },
});
