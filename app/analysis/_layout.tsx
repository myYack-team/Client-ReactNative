import { Stack } from 'expo-router';
import { Colors } from '../../constants';

export default function AnalysisLayout() {
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
        name="loading"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="preview"
        options={{
          title: '미리보기',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[reportId]"
        options={{
          title: '분석 결과',
          headerTitleAlign: 'center',
        }}
      />
    </Stack>
  );
}
