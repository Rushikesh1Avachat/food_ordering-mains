import { Platform } from 'react-native';
import { StripeProvider as NativeStripeProvider } from '@stripe/stripe-react-native';
import { loadStripe as loadWebStripe } from '@stripe/stripe-js';
import React from 'react'; // Ensure React is imported for typing

// Your publishable key (from env)
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Helper type to match NativeStripeProvider's children expectation
type StrictChildren = React.ReactElement | React.ReactElement[];

// Main component: Use ReactNode for flexibility, but handle strict typing internally
export function StripeProvider({ children }: { children: React.ReactNode }) {
  // On web, return children as-is (ReactNode is fine here)
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  // On native: Cast/filter to ensure it's StrictChildren (non-null/undefined)
  // This satisfies TypeScript without runtime checks (assuming children is always provided in layouts)
  const strictChildren = children as StrictChildren;
  return (
    <NativeStripeProvider publishableKey={PUBLISHABLE_KEY}>
      {strictChildren}
    </NativeStripeProvider>
  );
}