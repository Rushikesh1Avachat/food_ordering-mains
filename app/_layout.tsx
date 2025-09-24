import { SplashScreen, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import './globals.css';
import * as Sentry from '@sentry/react-native';
import useAuthStore from '@/store/auth.store';
import { Platform } from 'react-native';

// Stripe web imports
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Sentry
Sentry.init({
  dsn: 'https://94edd17ee98a307f2d85d750574c454a@o4506876178464768.ingest.us.sentry.io/4509588544094208',
  sendDefaultPii: true,
  replaysSessionSampleRate: 1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

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
  }, []);

  // Ensure children are only rendered when ready
  if (!fontsLoaded || isLoading) {
    return null;
  }

  // Web Stripe
  if (Platform.OS === 'web') {
    const stripePromise = loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    return (
      <Elements stripe={stripePromise}>
        <Stack screenOptions={{ headerShown: false }} />
      </Elements>
    );
  }

  // Native Stripe
  const { StripeProvider } = require('@stripe/stripe-react-native');
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      urlScheme="fastfood" // deep link scheme
      merchantIdentifier="merchant.food.ordering.com" // Apple Pay
    >
      <Stack screenOptions={{ headerShown: false }} />
    </StripeProvider>
  );
});



