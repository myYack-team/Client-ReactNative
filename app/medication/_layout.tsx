import { Stack } from 'expo-router';
import { Colors } from '../../constants';

export default function MedicationLayout() {
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
        name="[id]"
        options={{
          title: '약 상세',
        }}
      />
    </Stack>
  );
}
