import React from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import * as Linking from "expo-linking"; // ✅ correct import

// Mobile Stripe
import { StripeProvider as NativeStripeProvider } from "@stripe/stripe-react-native";

// Web Stripe
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
const merchantId = "merchant.com.food-ordering"; // Replace with your Merchant ID for Apple Pay

// For web only
const stripePromise =
  Platform.OS === "web" ? loadStripe(publishableKey) : null;

export default function RootLayout(props: any) {
  if (Platform.OS === "web") {
    // ✅ Web wrapper
    return (
      <Elements stripe={stripePromise}>
        <Stack screenOptions={{ headerShown: false }} />
      </Elements>
    );
  }

  // ✅ iOS/Android wrapper
  return (
    <NativeStripeProvider
      publishableKey={publishableKey}
      merchantIdentifier={merchantId}
      urlScheme={Linking.createURL("/")?.split(":")[0]} // e.g. myapp://
      {...props}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </NativeStripeProvider>
  );
}



