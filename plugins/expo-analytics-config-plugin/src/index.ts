import {
  ConfigPlugin,
  withProjectBuildGradle,
  withAppBuildGradle,
  withAndroidManifest,
  withMainApplication,
  withInfoPlist,
  withPodfile,
  withAppDelegate,
  withDangerousMod,
  createRunOncePlugin,
  AndroidConfig
} from "@expo/config-plugins";
import fs from "fs";
import path from "path";

type Options = {
  android?: {
    googleServicesJsonPath?: string;
    googleServicesVersion?: string;
    analyticsCollectionEnabled?: boolean;
  };
  ios?: {
    googleServicesPlistPath?: string;
    automaticScreenReportingEnabled?: boolean;
  };
};

function ensureOnCreateInit(contents: string, initLine: string): string {
  if (contents.includes(initLine)) return contents;
  const onCreateJava = /void\s+onCreate\s*\(\)\s*\{\s*/;
  const onCreateKotlin = /override\s+fun\s+onCreate\s*\(\)\s*\{\s*/;
  if (onCreateJava.test(contents) || onCreateKotlin.test(contents)) {
    return contents
      .replace(onCreateJava, (m) => m + `\n    ${initLine}\n`)
      .replace(onCreateKotlin, (m) => m + `\n        ${initLine}\n`);
  }
  const classJava = /(class\s+\w+\s+extends\s+Application[^\{]*\{\s*)/;
  const classKotlin = /(class\s+\w+\s*:\s*Application\(\)\s*\{\s*)/;
  if (classJava.test(contents)) {
    return contents.replace(classJava, (m) =>
      m + `\n  @Override\n  public void onCreate() {\n    super.onCreate();\n    ${initLine}\n  }\n`
    );
  }
  if (classKotlin.test(contents)) {
    return contents.replace(classKotlin, (m) =>
      m + `\n  override fun onCreate() {\n    super.onCreate()\n    ${initLine}\n  }\n`
    );
  }
  return contents.replace(/\}\s*$/m, (m) => `\n  public void onCreate() {\n    super.onCreate();\n    ${initLine}\n  }\n${m}`);
}

const withFirebaseAnalyticsPlugin: ConfigPlugin<Options> = (config, options) => {
  const version = options.android?.googleServicesVersion ?? "4.4.2";

  config = withProjectBuildGradle(config, (config) => {
    const src = config.modResults.contents;
    if (!src.includes("com.google.gms:google-services")) {
      config.modResults.contents = src.replace(
        /dependencies\s*\{\s*/,
        (m) => `${m}        classpath("com.google.gms:google-services:${version}")\n`
      );
    }
    return config;
  });

  config = withAppBuildGradle(config, (config) => {
    let src = config.modResults.contents;
    if (!src.includes("com.google.gms.google-services")) {
      src += `\napply plugin: 'com.google.gms.google-services'\n`;
    }
    if (!src.includes("firebase-analytics-ktx")) {
      src = src.replace(
        /dependencies\s*\{\s*/,
        (m) => `${m}    implementation("com.google.firebase:firebase-analytics-ktx")\n`
      );
    }
    config.modResults.contents = src;
    return config;
  });

  config = withMainApplication(config, (config) => {
    const mod = config.modResults;
    const initLine = "com.google.firebase.FirebaseApp.initializeApp(this);";
    mod.contents = ensureOnCreateInit(mod.contents, initLine);
    return config;
  });

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const src = options.android?.googleServicesJsonPath;
      if (!src) return config;
      const dest = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "google-services.json"
      );
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.resolve(config.modRequest.projectRoot, src), dest);
      return config;
    }
  ]);

  config = withPodfile(config, (config) => {
    let contents = config.modResults.contents;

    // Ensure Firebase Analytics is present
    if (!contents.includes("Firebase/Analytics")) {
      contents += `\n# Firebase Analytics\npod 'Firebase/Analytics'\n`;
    }

    // Ensure modular headers for all pods that need module maps when linking statically from Swift
    const modularList = [
      "FirebaseCore",
      "FirebaseCoreInternal",
      "FirebaseInstallations",
      "GoogleUtilities",
      "PromisesObjC",
      "nanopb"
    ];

    // Helper: add or upgrade to modular_headers for a pod
    const ensureModular = (name: string) => {
      const anyLine = new RegExp(`^\\s*pod\\s+['"]${name}['"]`, "m");
      const modularLine = new RegExp(
        `^\\s*pod\\s+['"]${name}['"][^\\n]*:modular_headers\\s*=>\\s*true`,
        "m"
      );
      if (!anyLine.test(contents)) {
        contents += `pod '${name}', :modular_headers => true\n`;
      } else if (!modularLine.test(contents)) {
        // add a second guarded line to force modular headers (safe if caller defined it above without the flag)
        contents += `# ensure modular headers for ${name}\npod '${name}', :modular_headers => true\n`;
      }
    };

    modularList.forEach(ensureModular);

    config.modResults.contents = contents;
    return config;
  });

  config = withAppDelegate(config, (config) => {
    const { language, contents } = config.modResults;
    if (language === "objc" && !contents.includes("[FIRApp configure];")) {
      config.modResults.contents = contents.replace(
        /didFinishLaunchingWithOptions.*\{\n/,
        (m) => m + "  [FIRApp configure];\n"
      );
    } else if (language === "swift" && !contents.includes("FirebaseApp.configure()")) {
      const updated = contents.includes("import Firebase")
        ? contents
        : contents.replace(/^import ExpoModulesCore\n/m, (m) => m + "import Firebase\n");
      config.modResults.contents = updated.replace(
        /didFinishLaunchingWithOptions.*\{\n/,
        (m) => m + "    FirebaseApp.configure()\n"
      );
    }
    return config;
  });

  return config;
};

const pkg = "expo-analytics-config-plugin";
export default createRunOncePlugin(withFirebaseAnalyticsPlugin, pkg, "0.1.2");
