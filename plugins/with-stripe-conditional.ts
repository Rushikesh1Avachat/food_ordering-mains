import { withPlugins, ConfigPlugin } from "@expo/config-plugins";

const withStripeConditional: ConfigPlugin<{
  merchantIdentifier?: string;
  publishableKey?: string;
}> = (config, { merchantIdentifier, publishableKey }) => {
  // Skip on web builds
  if (process.env.EXPO_PLATFORM === "web") {
    return config;
  }

  // Apply Stripe plugin
  return withPlugins(config, [
    [
      "@stripe/stripe-react-native",
      { merchantIdentifier, publishableKey },
    ],
  ]);
};

export default withStripeConditional;
