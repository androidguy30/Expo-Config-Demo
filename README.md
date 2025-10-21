# Expo Config Plugin Firebase Analytics Demo — TypeScript-only (no prebuilt JS)

This example **does not** include `build/index.js`. The plugin is TypeScript-only and compiled locally before `expo prebuild`.

## Quickstart

```bash
npm i

# Add your real Firebase files:
#   credentials/android/google-services.json
#   credentials/ios/GoogleService-Info.plist

# Compile the plugin (creates build/index.js locally)
npm run plugin:build

# Apply the plugin and generate native projects
npm run prebuild

# iOS
npx pod-install
npm run ios

# Android
npm run android
```

> Tip: Add `"prepare": "npm run build"` inside the plugin's package.json to auto-build on install.
