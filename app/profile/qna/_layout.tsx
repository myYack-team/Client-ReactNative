import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../../constants';

export default function QnALayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.brand,
          },
          headerTintColor: Colors.white,
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
    </>
  );
}
