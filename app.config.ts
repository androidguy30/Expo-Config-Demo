import type { ExpoConfig } from '@expo/config-types';

const config: ExpoConfig = {
  name: "analytics-demo",
  slug: "analytics-demo",
  ios: { bundleIdentifier: "com.example.analyticsdemo" },
  android: { package: "com.example.analyticsdemo" },
  plugins: [
    [
      "./plugins/expo-analytics-config-plugin",
      {
        android: {
          googleServicesJsonPath: "./credentials/android/google-services.json",
          googleServicesVersion: "4.4.2",
          analyticsCollectionEnabled: true
        },
        ios: {
          googleServicesPlistPath: "./credentials/ios/GoogleService-Info.plist",
          automaticScreenReportingEnabled: true
        }
      }
    ]
  ]
};

export default config;
