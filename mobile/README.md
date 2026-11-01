# MemeIsMine — Expo mobile application

The native application lives in this directory. The existing Next.js website and APIs at the repository root are unchanged.

## Current mobile features

- Home, Explore, Motion, Studio and profile tabs.
- Live Imgflip image template discovery from the deployed MemeIsMine API.
- Search and sorting for image templates.
- Animated GIF/video template discovery with search and sort.
- Native GIF and video preview (Expo Video for video sources).
- Local bookmarks and image-editor drafts using AsyncStorage.
- Camera-roll image selection.
- Image meme editor with top/bottom captions, text size, colour and outline controls.
- PNG rendering with `react-native-view-shot` and device share-sheet export.

## Existing API use

The app consumes the existing deployed API:
- `GET /api/memes?limit=100&q=...`
- `GET /api/video-templates?page=1&limit=30&sort=popular&q=...`
- `GET /api/image?url=...`
- `GET /api/video-source?url=...`

Base URL defaults to `https://memeismine.vercel.app`. Set `EXPO_PUBLIC_API_BASE_URL` to use another deployment. Only use the existing allowlisted API proxies for external media.

## Honest limitations

- Drafts and bookmarks are local to one device; there is no account system or cross-device sync.
- Native video caption compositing, timeline editing, video export, and audio-track export are not implemented. The web editor uses browser Canvas/MediaRecorder and this is not automatically available in React Native.
- User-uploaded photo URIs are kept as local editor input; draft restoration for custom local photos is limited because app-private URI persistence should be implemented with a managed file copy before relying on it long-term.
- The application has been added to GitHub, but an Expo install, type-check, emulator launch, and on-device QA have not been run in this environment.

## Run locally

Requires Node.js and an Android emulator/device or macOS with the iOS simulator.

```bash
cd mobile
npm install
npx expo start
```

Android: `npm run android`

iOS simulator (macOS): `npm run ios`

Web preview: `npm run web`

Type-check: `npm run typecheck`

For a native release, configure EAS Build and review the permissions and app identifiers in `app.config.ts`.
