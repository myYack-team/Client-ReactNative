import { Stack } from 'expo-router';
import { Colors } from '../../../constants';

export default function QnALayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '문의하기',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '문의 상세',
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: '새 문의 작성',
        }}
      />
    </Stack>
  );
}
