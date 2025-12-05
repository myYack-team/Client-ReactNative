import { Stack } from 'expo-router';
import { Colors } from '../../constants';

export default function ScanLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen
        name="camera"
        options={{
          title: '약 촬영',
          headerBackTitle: '취소',
        }}
      />
      <Stack.Screen
        name="loading"
        options={{
          title: '분석 중',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="result"
        options={{
          title: '인식 결과',
          headerBackTitle: '다시 촬영',
        }}
      />
      <Stack.Screen
        name="reminder"
        options={{
          title: '알림 설정',
        }}
      />
    </Stack>
  );
}
