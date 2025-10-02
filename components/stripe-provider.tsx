// components/stripe-provider.tsx
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import React from "react";

// Web imports only
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise =
  Platform.OS === "web"
    ? loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
    : null;

export default function StripeProviderWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    if (!stripePromise) throw new Error("Stripe.js failed to load");
    return <Elements stripe={stripePromise}>{children}</Elements>;
  }

  // Lazy import native Stripe provider
  const { StripeProvider } = require("@stripe/stripe-react-native");

  const merchantId =
    process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID || "merchant.food-ordering";

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier={merchantId}
      urlScheme={Linking.createURL("/")}
    >
      {children}
    </StripeProvider>
  );
}

