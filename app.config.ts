import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "StockFlow",
  slug: "stockflow",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "stockflow",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.chantoewhan.stockflow",
    infoPlist: {
      NSCameraUsageDescription:
        "StockFlow needs camera access to scan barcodes and take product photos.",
      NSPhotoLibraryUsageDescription:
        "StockFlow needs photo library access to attach product images.",
    },
  },
  android: {
    icon: "./assets/images/icon.png",
    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      backgroundColor: "#0F172A",
    },
    package: "com.chantoewhan.stockflow",
    softwareKeyboardLayoutMode: "pan",
    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
    ],
    "googleServicesFile": "/google-services.json",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0F172A",
        android: {
          image: "./assets/images/splash-icon.png",
          imageWidth: 700,
        },
      },
    ],
    "expo-secure-store",
    [
      "expo-camera",
      {
        cameraPermission:
          "Allow StockFlow to access your camera for barcode scanning and product photos.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Allow StockFlow to access your photos to attach product images.",
      },
    ],
    [
      "expo-notifications",
      // {
      //   icon: "./assets/images/notification-icon.png",
      //   color: "#0F172A",
      // },
    ],
    "expo-sqlite",
    "expo-sharing",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: "bd1a3cb7-64fd-41e4-a73d-e53262c30eb3",
    },
  },
});
