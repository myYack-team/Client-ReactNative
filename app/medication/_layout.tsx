import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants';

export default function MedicationLayout() {
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
        name="add"
        options={{
          title: '약/영양제 추가',
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: '약 검색',
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: '약 추가',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: '약 상세',
          headerTitleAlign: 'left',
        }}
      />
      </Stack>
    </>
  );
}
