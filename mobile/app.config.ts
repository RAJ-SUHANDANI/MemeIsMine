import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "MemeIsMine",
  slug: "memeismine",
  scheme: "memeismine",
  version: "1.0.0",
  ios: {
    bundleIdentifier: "com.memeismine.app",
    supportsTablet: true,
    infoPlist: {
      NSPhotoLibraryUsageDescription: "MemeIsMine uses your photo library to create memes from your images.",
      NSPhotoLibraryAddUsageDescription: "MemeIsMine saves exported memes to your photo library.",
      NSCameraUsageDescription: "MemeIsMine uses your camera to capture original memes."
    }
  },
  orientation: "portrait",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  plugins: [
    "expo-router",
    ["expo-camera", { cameraPermission: "MemeIsMine uses your camera to create memes." }],
    ["expo-image-picker", {
      photosPermission: "MemeIsMine uses your photo library to create memes from your images."
    }],
    "expo-media-library",
    "expo-video",
    "munim-ffmpeg"
  ],
  experiments: { typedRoutes: true },

  android: {
    package: "com.memeismine.app",
    edgeToEdgeEnabled: true,
    permissions: ["CAMERA", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO"]
  }
};
export default config;
