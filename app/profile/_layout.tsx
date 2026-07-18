import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants';

export default function ProfileLayout() {
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
          name="reminders"
          options={{
            title: '알림 설정',
          }}
        />
        <Stack.Screen
          name="edit"
          options={{
            title: '프로필 수정',
          }}
        />
        <Stack.Screen
          name="privacy"
          options={{
            title: '개인정보 보호',
          }}
        />
        <Stack.Screen
          name="font-size"
          options={{
            title: '글자 크기',
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: '앱 정보',
          }}
        />
        <Stack.Screen
          name="ai-consent"
          options={{
            title: 'AI 데이터 분석 동의',
          }}
        />
        <Stack.Screen
          name="qna"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
