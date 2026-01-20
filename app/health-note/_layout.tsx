import { Stack } from 'expo-router';
import { Colors } from '../../constants';

export default function HealthNoteLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.brand,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="[date]"
        options={{
          title: '건강 메모',
          headerBackTitle: '뒤로',
        }}
      />
    </Stack>
  );
}
