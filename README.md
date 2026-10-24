# Meme Is Mine

A playful, editorial meme creation studio built with Next.js, TypeScript, Tailwind CSS and Motion.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Included
- Editorial landing page with layered 3D-style meme cards, scroll motion, moving type strip and responsive sections.
- Explore page with search, category filters, sorting, template cards and bookmarks.
- Meme editor with top/bottom captions, font size, font, colour, alignment, outline toggle, undo/redo, local drafts and PNG export.
- Studio for browser-local drafts and bookmarked templates.
- `/api/memes` attempts to retrieve up to 100 public Imgflip template entries without an API key and falls back to a bundled starter catalog.
- `/api/image?url=...` proxies images only from approved Imgflip hostnames for same-origin canvas export.
- No hosted database, email-verification service, auth provider, or database key. Drafts and bookmarks stay in browser local storage.

## Routes
- `/` — landing page
- `/explore` — template directory
- `/create/:id` — editor for a template
- `/create/upload` — begin with a local image
- `/studio` — browser-local drafts and bookmarks
- `/api/memes` — meme template source
- `/api/image` — image proxy for approved template hosts

The meme directory uses Imgflip's public template endpoint when reachable; no API key is required. A bundled starter catalog keeps the app usable if the remote source is unavailable. The editor exports in-browser via Canvas. Drafts are available only in the same browser profile/device and are not synced between devices.

## Deploy
Import the repository into Vercel and use standard Next.js settings. Build command: `npm run build`.
