# MemeIsMine — Expo mobile app

This directory is the native mobile application. The existing Next.js website remains at the repository root and is not modified by mobile development.

## Product scope

- Discover Imgflip still-image templates.
- Browse the animated GIF/video collection.
- Search and sort both template collections.
- Create image memes with draggable text, styling and overlays.
- Save drafts and bookmarks on-device.
- Preview and export images to the device share sheet.
- Preview supported GIF/video templates; video editing/export will use native media capabilities and must be tested on physical devices.

## API integration

The app consumes the existing deployed web API:
- `GET https://memeismine.vercel.app/api/memes?limit=100&q=...`
- `GET https://memeismine.vercel.app/api/video-templates?page=1&limit=24&sort=popular&q=...`
- `GET https://memeismine.vercel.app/api/image?url=...`
- `GET https://memeismine.vercel.app/api/video-source?url=...`

The image/video endpoints enforce host allowlists. Do not bypass them by proxying arbitrary user-provided URLs.

Drafts/bookmarks remain local to the device unless a backend account/sync service is intentionally added in a later iteration. Do not claim cross-device sync.

## Development

Use the Expo SDK-compatible dependencies declared in this directory. From `mobile/` run:

```bash
npm install
npx expo start
```

Run Android with `npx expo start --android`, iOS with `npx expo start --ios` (macOS required for the iOS simulator), and web with `npx expo start --web`.

## Configuration

Set `EXPO_PUBLIC_API_BASE_URL` to the deployed API origin when using a different deployment. The default is `https://memeismine.vercel.app`.

No private API keys belong in Expo public environment variables.
