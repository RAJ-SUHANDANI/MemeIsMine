# MemeIsMine Mobile App

The native MemeIsMine app is an Expo / React Native companion to the MemeIsMine website. It brings template discovery and meme creation to mobile, with camera-first tools and app-exclusive experiences.

> The mobile app lives in `mobile/`. The existing Next.js website and its APIs at the repository root are kept separate and are not modified by the mobile app.

## Contents

- [Highlights](#highlights)
- [App-exclusive features](#app-exclusive-features)
- [Getting started](#getting-started)
- [Native development builds](#native-development-builds)
- [Automated EAS builds](#automated-eas-builds)
- [API configuration](#api-configuration)
- [Data and storage](#data-and-storage)
- [Known limitations](#known-limitations)
- [Release checklist](#release-checklist)

## Highlights

- **Five primary tabs:** For you, Battle, MemeCam, MemeVault and Studio.
- **Meme discovery:** Browse, search, sort and bookmark Imgflip image templates.
- **Motion templates:** Discover GIF and video templates and preview the original moving media.
- **Image editor:** Add and style captions, create image drafts, and share or save PNG output.
- **Video editor:** Preview video/GIF sources, add top and bottom captions, adjust text styling, playback speed, output aspect ratio and duration.
- **Native MP4 export:** Render on-device with FFmpeg, burn captions into the video, preserve source audio when available, show export progress, and share or save the resulting MP4.
- **Studio:** Manage locally saved image and video projects.

## App-exclusive features

These experiences are designed specifically for the mobile app and are not part of the website editing flow.

### Meme Battle

A daily meme-making challenge with a rotating prompt, an image entry composer, a branded entry render and a one-entry-per-day limit. Users can save their entry locally and share it to challenge friends.

**Current scope:** entries are stored on the device. There is no server-side submission, community voting, public profile, global leaderboard or cloud-based streak tracking.

### MemeCam

A camera-first meme creator with a live front/rear camera preview, editable caption overlay and flash control. Capture a photo and continue directly into the image editor.

Camera permission is requested when MemeCam is opened. The camera session is released when leaving the tab.

### MemeVault

Turn photos from the camera roll into circular or rounded transparent PNG reaction stickers. Add mood labels, keep stickers in a local collection, share individual stickers or save them to Photos.

**Current scope:** individual sticker PNGs are supported. ZIP pack export and system keyboard/sticker-pack integration are not included.

## Getting started

### Requirements

- Node.js 22
- npm
- Android device/emulator, or macOS with an iOS simulator for iOS development
- Expo development build for native camera and FFmpeg functionality

### Install and run

From the repository root:

```bash
git checkout app
cd mobile
npm install
npx expo start
```

For a native development build, use the EAS instructions below and start Metro with the development client:

```bash
npx expo start --dev-client
```

Useful scripts:

```bash
npm run typecheck
npm run android
npm run ios
```

The iOS simulator requires macOS and Xcode. Android development requires Android Studio / Android SDK or a connected Android device.

## Native development builds

The app uses native camera and FFmpeg modules. **Expo Go is not sufficient** for the full app because it does not include the native FFmpeg module. Build and install a custom development client.

Install or invoke the EAS CLI, then build for your target platform:

```bash
npx eas-cli build --profile development --platform android
```

For iOS:

```bash
npx eas-cli build --profile development --platform ios
```

After installing the generated development build on your device, run:

```bash
npx expo start --dev-client
```

Build profiles are defined in `eas.json`. The app icon and splash artwork are in `assets/icon.png`. Review the app identifiers, permission strings and native plugins in `app.config.ts` before creating store builds.

## Automated EAS builds

The repository includes a manual GitHub Actions workflow at `.github/workflows/mobile-eas-build.yml` for preview and production builds on Android, iOS or both.

One-time setup:

1. Create or link the Expo project from `mobile/` with `npx eas-cli@latest login` and `npx eas-cli@latest init`.
2. Copy the EAS project UUID and make it available as `EAS_PROJECT_ID` in the local build environment.
3. In GitHub, add an Actions secret named `EXPO_TOKEN` (an Expo access token) and an Actions variable named `EAS_PROJECT_ID` (the project UUID).
4. Open **Actions → Native Mobile Build → Run workflow**, then choose the platform and `preview` or `production` profile.

The preview profile creates an Android APK for internal device testing. The production profile creates store-oriented builds (Android App Bundle by default). EAS signing credentials and Apple/Google store accounts must be configured on the Expo project by its owner; this repository does not contain signing keys or store credentials.

## API configuration

The app uses the existing deployed MemeIsMine API. The default base URL is:

```text
https://memeismine.vercel.app
```

Override it by setting `EXPO_PUBLIC_API_BASE_URL` in the mobile app environment.

Endpoints currently used:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/memes?limit=100&q=...` | Image meme templates and search |
| `GET /api/video-templates?page=1&limit=30&sort=popular&q=...` | GIF/video template discovery |
| `GET /api/image?url=...` | Image media proxy |
| `GET /api/video-source?url=...` | GIF/video media proxy |

Media is loaded through the existing API proxy routes rather than changing the website's API implementation.

## Data and storage

- Image drafts, video projects, bookmarks, Meme Battle entries and MemeVault stickers are stored locally on the device.
- The current app does not provide account sign-in, cloud backup or cross-device synchronization.
- Meme Battle entries are private local records unless the user chooses to share an entry through the device share sheet.
- Camera and photo-library access are used by the corresponding camera, editor and sticker workflows.
- The app consumes the existing website API for template discovery and media retrieval; the mobile-only experiences do not currently have a dedicated backend.

## Known limitations

- **Backend/community features:** Meme Battle voting, public submissions, anti-abuse controls, global leaderboards and server-side streaks require backend services and are not implemented.
- **Cloud sync:** local drafts, stickers, bookmarks and battle entries do not sync between devices.
- **Native QA:** the MP4 pipeline is implemented, but a successful TypeScript/CI check does not replace native build and physical-device testing. Verify rendering, audio, permissions, sharing and saving on real Android and iOS devices before release. The repository does not include device-test results or a signed store binary yet.
- **Video timeline:** duration selection limits the rendered output. Frame-accurate timeline trimming, keyframed caption animation and multi-layer video overlays are not implemented.
- **Sticker packs:** MemeVault currently exports individual transparent PNGs; ZIP export and keyboard integration remain future work.
- **FFmpeg licensing and size:** the bundled FFmpeg dependency uses LGPLv3 binaries. Review its licence obligations and native binary size before publishing.

## Release checklist

Before shipping a store build:

1. Set and verify `EXPO_PUBLIC_API_BASE_URL` for the production API.
2. Confirm the Android/iOS identifiers, permission descriptions and EAS configuration.
3. Create clean Android and iOS development or release builds.
4. Test MemeCam permissions, camera switching, flash and capture on physical devices.
5. Test image and sticker export, Photos saving and share-sheet behavior.
6. Test MP4 export with different source formats, durations, aspect ratios and audio conditions on physical devices.
7. Review FFmpeg licensing, app size, privacy disclosures and store submission requirements.

## Continuous integration

The GitHub Actions workflow at `.github/workflows/mobile-typecheck.yml` checks Expo dependency compatibility, TypeScript and Expo Doctor for changes to the mobile app and the app branch. The manual `.github/workflows/mobile-eas-build.yml` workflow starts cloud preview or production builds after EAS credentials and project configuration are added.

A passing workflow confirms dependency compatibility and static type validation; it does **not** confirm that a native build launches or that camera and media export work on a physical device.
