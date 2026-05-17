import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function AdminLayout() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (initialized && !profile?.is_admin) {
      router.replace('/(app)/(tabs)');
    }
  }, [profile, initialized]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="products/index" />
      <Stack.Screen name="products/new" />
      <Stack.Screen name="products/[id]" />
      <Stack.Screen name="orders/index" />
      <Stack.Screen name="orders/[id]" />
      <Stack.Screen name="categories/index" />
      <Stack.Screen name="banners/index" />
      <Stack.Screen name="coupons/index" />
      <Stack.Screen name="slots/index" />
    </Stack>
  );
}
