import { Platform } from 'react-native';
import React, { Suspense } from 'react';
import { loadStripe } from '@stripe/stripe-js'; // For web (if not installed: npx expo install @stripe/stripe-js)

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Lazy-load native provider *only* on non-web platforms
const LazyNativeStripeProvider = React.lazy(async () => {
  const { StripeProvider } = await import('@stripe/stripe-react-native');
  return { default: StripeProvider };
});

// Helper type for strict children (matches Stripe's expectation)
type StrictChildren = React.ReactElement | React.ReactElement[];

export function StripeProvider({ children }: { children: React.ReactNode }) {
  // Web: Passthrough (ReactNode is fine)
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  // Native: Assert children as strict type before passing
  const strictChildren = children as StrictChildren;
  return (
    <Suspense fallback={<>Loading...</>}>
      <LazyNativeStripeProvider publishableKey={PUBLISHABLE_KEY}>
        {strictChildren}
      </LazyNativeStripeProvider>
    </Suspense>
  );
}