const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);

// Extend with web-specific resolver to block native-only modules
const extendedConfig = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    resolveRequest: (context, moduleName, platform) => {
      // Blacklist native-only packages on web only
      const webBlacklistedModules = [
        '@stripe/stripe-react-native',  // Targets the Stripe native SDK
        // Add more if needed, e.g., 'react-native-maps'
      ];

      if (platform === 'web' && webBlacklistedModules.some(blacklisted => moduleName.includes(blacklisted))) {
        // Return empty module to skip bundling (no error, just ignores)
        return { type: 'empty' };
      }

      // Default resolution for everything else
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

// Apply Sentry config on top
const sentryConfig = getSentryExpoConfig(__dirname, extendedConfig);

// Wrap with NativeWind for CSS support
module.exports = withNativeWind(sentryConfig, { input: './app/globals.css' });