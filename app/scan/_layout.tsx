import { Stack } from 'expo-router';
import { Colors } from '../../constants';

export default function ScanLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.brand,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen
        name="camera"
        options={{
          headerShown: false, // 카메라 화면은 헤더 숨김
        }}
      />
      <Stack.Screen
        name="preview"
        options={{
          headerShown: false,
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
