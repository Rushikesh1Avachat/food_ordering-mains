// components/stripe-provider.tsx
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import React from "react";

// Web imports (lazy loaded to avoid bundling issues)
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripeProviderWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    // ✅ Web: use stripe-js
    return <Elements stripe={stripePromise}>{children}</Elements>;
  }

  // ✅ Native: use stripe-react-native
  const { StripeProvider } = require("@stripe/stripe-react-native");

  const merchantId =
    Constants.expoConfig?.plugins?.find((p) => p[0] === "@stripe/stripe-react-native")?.[1]
      .merchantIdentifier;

  if (!merchantId) {
    throw new Error("Missing expo config for merchantIdentifier");
  }

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier={merchantId}
      urlScheme={Linking.createURL("/")?.split(":")[0]}
    >
      {children}
    </StripeProvider>
  );
}
