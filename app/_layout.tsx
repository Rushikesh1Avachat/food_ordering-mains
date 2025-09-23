import { SplashScreen, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import './globals.css';
import * as Sentry from '@sentry/react-native';
import useAuthStore from '@/store/auth.store';
import { StripeProvider } from '@stripe/stripe-react-native';

Sentry.init({
  dsn: 'https://94edd17ee98a307f2d85d750574c454a@o4506876178464768.ingest.us.sentry.io/4509588544094208',
  sendDefaultPii: true,
  replaysSessionSampleRate: 1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

// Root layout component
export default Sentry.wrap(function RootLayout() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const fetchAuthenticatedUser = useAuthStore((s) => s.fetchAuthenticatedUser);
  const [fontsLoaded, error] = useFonts({
    'QuickSand-Bold': require('../assets/fonts/Quicksand-Bold.ttf'),
    'QuickSand-Medium': require('../assets/fonts/Quicksand-Medium.ttf'),
    'QuickSand-Regular': require('../assets/fonts/Quicksand-Regular.ttf'),
    'QuickSand-SemiBold': require('../assets/fonts/Quicksand-SemiBold.ttf'),
    'QuickSand-Light': require('../assets/fonts/Quicksand-Light.ttf'),
  });

  // Fonts load
  useEffect(() => {
    if (error) throw new Error('Font loading failed');
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  // Fetch user only once
  useEffect(() => {
    fetchAuthenticatedUser();
  }, []); // ✅ empty deps → won’t run again on state changes

  // Ensure children are only rendered when ready
  if (!fontsLoaded || isLoading) {
    return null; // Block rendering until ready
  }

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      urlScheme="fastfood" // e.g., "com.yourapp" for iOS; optional
      merchantIdentifier="merchant.food.ordering.com" // Optional, for Apple Pay
    >
      <Stack screenOptions={{ headerShown: false }} />
    </StripeProvider>
  );
});
