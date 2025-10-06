import { SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { View, TouchableOpacity, Text, Platform } from "react-native";

import "./globals.css";
import * as Sentry from "@sentry/react-native";
import useAuthStore from "@/store/auth.store";
import AppStripeProvider from "@/components/stripe-provider"; // Platform-aware StripeProvider

Sentry.init({
  dsn: "https://94edd17ee98a307f2d85d750574c454a@o4506876178464768.ingest.us.sentry.io/4509588544094208",
  sendDefaultPii: true,
  replaysSessionSampleRate: 1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

export default Sentry.wrap(function RootLayout() {
  const { isLoading, fetchAuthenticatedUser } = useAuthStore();

  const [fontsLoaded, error] = useFonts({
    "QuickSand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
    "QuickSand-Medium": require("../assets/fonts/Quicksand-Medium.ttf"),
    "QuickSand-Regular": require("../assets/fonts/Quicksand-Regular.ttf"),
    "QuickSand-SemiBold": require("../assets/fonts/Quicksand-SemiBold.ttf"),
    "QuickSand-Light": require("../assets/fonts/Quicksand-Light.ttf"),
  });

  useEffect(() => {
    if (error) Sentry.captureException(error);
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  useEffect(() => {
    fetchAuthenticatedUser();
  }, []);

  const handleFeedback = () => {
    Sentry.showFeedbackWidget();
  };

  if (!fontsLoaded || isLoading) return null;

  return (
    <AppStripeProvider>
      <Stack screenOptions={{ headerShown: false }} />

      {/* Optional feedback button in dev mode */}
      {__DEV__ && Platform.OS !== "web" && (
        <View className="absolute bottom-5 right-5 z-50">
          <TouchableOpacity
            onPress={handleFeedback}
            className="bg-blue-500 p-3 rounded-full"
          >
            <Text className="text-white font-bold">Feedback</Text>
          </TouchableOpacity>
        </View>
      )}
    </AppStripeProvider>
  );
});




