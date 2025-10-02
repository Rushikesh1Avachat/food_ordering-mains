import { SplashScreen, Stack } from "expo-router";
import { useFonts } from 'expo-font';
import { useEffect } from "react";
import { View, TouchableOpacity, Text } from 'react-native'; // For feedback button

import './globals.css';
import * as Sentry from '@sentry/react-native';
import useAuthStore from "@/store/auth.store";
import { StripeProvider } from '@/components/stripe-provider'; // Fixed: No space

Sentry.init({
  dsn: 'https://94edd17ee98a307f2d85d750574c454a@o4506876178464768.ingest.us.sentry.io/4509588544094208',
  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight[](https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function RootLayout() {
  const { isLoading, fetchAuthenticatedUser } = useAuthStore();

  const [fontsLoaded, error] = useFonts({
    "QuickSand-Bold": require('../assets/fonts/Quicksand-Bold.ttf'),
    "QuickSand-Medium": require('../assets/fonts/Quicksand-Medium.ttf'),
    "QuickSand-Regular": require('../assets/fonts/Quicksand-Regular.ttf'),
    "QuickSand-SemiBold": require('../assets/fonts/Quicksand-SemiBold.ttf'),
    "QuickSand-Light": require('../assets/fonts/Quicksand-Light.ttf'),
  });

  useEffect(() => {
    if (error) throw error; // Or Sentry.captureException(error) for better handling
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  useEffect(() => {
    fetchAuthenticatedUser();
  }, []);

  // Show feedback widget on button press (user-initiated, per Sentry best practices)
  const handleFeedback = () => {
    Sentry.showFeedbackWidget();
  };

  if (!fontsLoaded || isLoading) return null;

  return (
    <StripeProvider> {/* Fixed: No space */}
      <Stack screenOptions={{ headerShown: false }} />
      {/* Optional: Feedback button (position absolute or in a modal; hide in prod with __DEV__ */}
      {__DEV__ && (
        <View className="absolute bottom-5 right-5 z-50">
          <TouchableOpacity
            onPress={handleFeedback}
            className="bg-blue-500 p-3 rounded-full"
          >
            <Text className="text-white font-bold">Feedback</Text>
          </TouchableOpacity>
        </View>
      )}
    </StripeProvider>
  );
});




