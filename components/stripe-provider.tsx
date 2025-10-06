// components/stripe-provider.tsx
import React, { ReactNode } from "react";
import { Platform } from "react-native";

type Props = {
  children: ReactNode;
};

let StripeProviderComponent: React.FC<{ children: ReactNode; publishableKey: string }>;

// Use web provider
if (Platform.OS === "web") {
  const { Elements } = require("@stripe/react-stripe-js");
  const { loadStripe } = require("@stripe/stripe-js");
  const stripePromise = loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  StripeProviderComponent = ({ children }) => <Elements stripe={stripePromise}>{children}</Elements>;
} else {
  const { StripeProvider } = require("@stripe/stripe-react-native");
  StripeProviderComponent = ({ children }) => (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>
      {children}
    </StripeProvider>
  );
}

export default function AppStripeProvider({ children }: Props) {
  return <StripeProviderComponent publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>{children}</StripeProviderComponent>;
}

