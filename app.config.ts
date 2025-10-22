import type { ExpoConfig } from '@expo/config-types';

const config: ExpoConfig = {
  name: "analytics-demo",
  slug: "analytics-demo",
   ios: { 
    bundleIdentifier: "com.example.analyticsdemo",
    deploymentTarget: "14.0",
    buildNumber: "1",
    // Add these new configurations
    bitcode: false,
    config: {
      usesNonExemptEncryption: false
    }
  },
  android: { package: "com.example.analyticsdemo" },
  plugins: [
    "expo-asset",
    [
      "./plugins/expo-analytics-config-plugin",
      {
        android: {
          googleServicesJsonPath: "./credentials/android/google-services.json",
          googleServicesVersion: "4.4.2",
          analyticsCollectionEnabled: true
        },
        ios: {
          deploymentTarget: "14.0",
          googleServicesPlistPath: "./credentials/ios/GoogleService-Info.plist",
          automaticScreenReportingEnabled: true
        }
      }
    ]
  ]
};

export default config;
