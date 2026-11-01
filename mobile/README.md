# MemeIsMine — Expo mobile application

The native application lives in this directory. The existing Next.js website and APIs at the repository root are unchanged.

## Run locally

```bash
git checkout app
cd mobile
npm install
npx expo start
```

Android: npm run android · iOS simulator: npm run ios · TypeScript: npm run typecheck

Requires Node.js 22 and an Android device/emulator or macOS with an iOS simulator. Camera, native FFmpeg and video features require a development build or device. Expo Go cannot load the FFmpeg native module.

## Core mobile features

- Five primary native tabs: For you, Battle, MemeCam, MemeVault and Studio.
- Live Imgflip image discovery, search, sorting and bookmarks.
- GIF/video discovery and native video preview.
- Image meme editor with captions, text styling, drafts and PNG sharing.
- Camera-roll image selection and native camera capture.
- Native video caption editor with live overlay preview, playback speed, mute, output ratio and duration settings.
- On-device MP4 rendering with native FFmpeg, ASS caption burn-in, source-audio preservation, playback speed and aspect-ratio conversion.
- Export progress, MP4 share-sheet export and saving to Photos.
- Local image and video project management.

## App-exclusive experiences

### Meme Battle
A daily rotating prompt, photo entry composer, branded entry render, one entry per day and share-to-challenge-friends flow. Entries are stored on the device. Community voting, public profiles, server-side streaks and leaderboards need a backend and are not represented as live features.

### MemeCam
Live front/rear camera preview, editable caption overlay, flash toggle and capture-to-editor flow. Camera permission is requested only when the feature is opened.

### MemeVault
Create circular or rounded transparent PNG reaction stickers from camera-roll photos, label them by mood, save them to a local collection, share individual PNGs or save them to Photos. Full ZIP pack export and keyboard integration are not included.

## Existing API use

The app consumes the existing deployed API:
- GET /api/memes?limit=100&q=...
- GET /api/video-templates?page=1&limit=30&sort=popular&q=...
- GET /api/image?url=...
- GET /api/video-source?url=...

Base URL defaults to https://memeismine.vercel.app. Set EXPO_PUBLIC_API_BASE_URL to use another deployment. Media is requested through the existing API proxies.

## Known limitations requiring further engineering

- Drafts, stickers, bookmarks and battle entries are local to one device. There is no account system, cloud backup or cross-device sync.
- Meme Battle is a local daily challenge. Community submissions, voting, anti-abuse controls and global leaderboards require a backend.
- Native MP4 rendering requires an Expo development/release build and physical-device QA on both platforms. It cannot run in Expo Go. The bundled FFmpeg dependency uses LGPLv3 binaries; review its licence and native binary size before store submission.
- The video duration setting limits rendered output; frame-accurate timeline trimming, keyframed caption animation and multi-layer video overlays are not implemented.
- MemeVault exports individual transparent PNGs; ZIP pack export and share-sheet sticker keyboard integration are future work.
- GitHub Actions checks Expo dependency compatibility and TypeScript on pushes/PRs to the app branch. A successful native device build, emulator launch and on-device QA are still required before release.

## Configuration

Set EXPO_PUBLIC_API_BASE_URL in your environment to override the deployed API. Review app identifiers, permissions and EAS Build settings in app.config.ts before publishing.
