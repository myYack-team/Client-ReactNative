import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores';

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const needsOnboarding = useAuthStore((state) => state.needsOnboarding);

  if (isAuthenticated) {
    if (needsOnboarding) {
      return <Redirect href="/profile-setup" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
