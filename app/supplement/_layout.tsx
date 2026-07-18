import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants';

export default function SupplementLayout() {
  return (
    <>
      <StatusBar style="light" />
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
          name="search"
          options={{
            title: '영양제 검색',
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            title: '영양제 등록',
          }}
        />
        <Stack.Screen
          name="[id]"
          options={{
            title: '영양제 상세',
          }}
        />
        <Stack.Screen
          name="add/[id]"
          options={{
            title: '복용 정보 설정',
          }}
        />
      </Stack>
    </>
  );
}
