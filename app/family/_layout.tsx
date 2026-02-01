import { Stack } from 'expo-router';
import { Colors } from '../../constants';

export default function FamilyLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="request"
        options={{
          title: '가족 연결 요청',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: '가족 연동 설정',
        }}
      />
      <Stack.Screen
        name="[userId]"
        options={{
          title: '가족 복약 현황',
        }}
      />
    </Stack>
  );
}
