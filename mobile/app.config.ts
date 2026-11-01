import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "MemeIsMine",
  slug: "memeismine",
  scheme: "memeismine",
  version: "1.0.0",
  icon: "./assets/icon.png",
  splash: { image: "./assets/icon.png", resizeMode: "contain", backgroundColor: "#F4F0E8" },
  description: "A playful mobile meme studio with image editing, motion templates, MemeCam, Meme Battle and a personal sticker vault.",
  ios: {
    bundleIdentifier: "com.memeismine.app",
    buildNumber: "1.0.0",
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
    ["expo-splash-screen", { image: "./assets/icon.png", imageWidth: 160, resizeMode: "contain", backgroundColor: "#F4F0E8" }],
    ["expo-camera", { cameraPermission: "MemeIsMine uses your camera to create memes." }],
    ["expo-image-picker", {
      photosPermission: "MemeIsMine uses your photo library to create memes from your images."
    }],
    ["expo-media-library", {
      photosPermission: "MemeIsMine accesses photos you choose to create memes and stickers.",
      savePhotosPermission: "MemeIsMine saves memes, stickers and edited videos to your photo library.",
      granularPermissions: ["photo", "video"]
    }],
    "expo-video",
    "munim-ffmpeg"
  ],
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID }
  },

  android: {
    package: "com.memeismine.app",
    adaptiveIcon: { foregroundImage: "./assets/icon.png", backgroundColor: "#181713" },
    versionCode: 1,
    edgeToEdgeEnabled: true,
    permissions: ["CAMERA", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO"]
  }
};
export default config;
