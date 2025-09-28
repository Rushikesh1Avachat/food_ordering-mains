import { SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import React, { useEffect } from "react";
import "./globals.css";
import * as Sentry from "@sentry/react-native";
import useAuthStore from "@/store/auth.store";
import { Platform } from "react-native";
import { Elements } from "@stripe/react-stripe-js";

// Stripe (native + web)
import { StripeProvider } from "@stripe/stripe-react-native";

import { loadStripe, Stripe } from "@stripe/stripe-js";

// Deep linking
import * as Linking from "expo-linking";
import Constants from "expo-constants";

// ✅ Merchant ID from app.json → expo.extra
const merchantId = Constants.expoConfig?.extra?.merchantIdentifier;

if (!merchantId) {
  throw new Error("Missing merchantIdentifier in app config");
}

// ✅ Initialize Sentry
Sentry.init({
  dsn: "https://94edd17ee98a307f2d85d750574c454a@o4506876178464768.ingest.us.sentry.io/4509588544094208",
  sendDefaultPii: true,
  replaysSessionSampleRate: 1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

export default Sentry.wrap(function RootLayout(props: any) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const fetchAuthenticatedUser = useAuthStore((s) => s.fetchAuthenticatedUser);

  const [fontsLoaded, error] = useFonts({
    "QuickSand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
    "QuickSand-Medium": require("../assets/fonts/Quicksand-Medium.ttf"),
    "QuickSand-Regular": require("../assets/fonts/Quicksand-Regular.ttf"),
    "QuickSand-SemiBold": require("../assets/fonts/Quicksand-SemiBold.ttf"),
    "QuickSand-Light": require("../assets/fonts/Quicksand-Light.ttf"),
  });

  // ✅ Handle fonts
  useEffect(() => {
    if (error) throw new Error("Font loading failed");
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  // ✅ Fetch user only once
  useEffect(() => {
    fetchAuthenticatedUser();
  }, []);

  // ✅ Render guard
  if (!fontsLoaded || isLoading) {
    return null;
  }

if (Platform.OS === "web") {
  const stripePromise: Promise<Stripe | null> = loadStripe(
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!
  );

  return (
    <Elements stripe={stripePromise}>
      <Stack screenOptions={{ headerShown: false }} />
    </Elements>
  );
}

  // ✅ Native Stripe setup
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier={merchantId}
      urlScheme={Linking.createURL("/")?.split(":")[0]} // e.g. myapp://
      {...props}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </StripeProvider>
  );
});



