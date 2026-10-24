# Meme Is Mine

An independent meme-creation studio with an editorial visual identity, animated templates, a browser-side editor and a local draft studio. Designed and developed by **Raj Suhandani**.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Pages
- `/` — landing page with floating meme-card motion and a creator spotlight
- `/explore` — search, filter, sort and bookmark template formats
- `/templates` — randomized template discovery with popular, trending, recent and surprise filters
- `/video-templates` — animated template collection with popular, trending, recent and name filters
- `/video-editor/:id` — drag captions, add image overlays, choose output dimensions and export WebM
- `/create/:id` — editor for a selected template
- `/create/upload` — start with an image from your own device
- `/studio` — drafts and bookmarks saved in the current browser
- `/how-it-works` — how to create and export a meme
- `/about` — product story and information about Raj Suhandani
- `/faq` — interactive frequently asked questions
- `/privacy` — plain-language data and storage details
- `/contact` — portfolio, GitHub, LinkedIn and email links
- `/api/memes` — the original Meme Is Mine template feed, with a bundled fallback
- `/api/indian-memes` — paginated Indian still image template API
- `/api/video-templates` — paginated animated GIF and video template API
- `/api/video-source` — safe same origin proxy restricted to GIF animation files
- `/api/image` — image proxy restricted to approved template image hosts

## Template API examples

```text
GET /api/indian-memes?page=1&limit=24&sort=popular
GET /api/indian-memes?q=arjun&sort=trending
GET /api/video-templates?page=1&limit=24&sort=recent
GET /api/video-templates?slug=chinese-guy-explaining
```

The image endpoint returns a `memes` array; the GIF endpoint returns a `templates` array. Both support pagination and search. Animated source media is previewed through `/api/video-source?url=...`, which permits GIF files from approved media hosts. The video editor exports WebM locally in the browser. MP4 clips are excluded from the GIF collection.

To refresh source indexes manually, run `npm run sync:indian-videos` followed by `npm run sync:indian-images`, or use the GitHub Actions workflow. The workflow also refreshes the catalogs weekly. The sync indexes template metadata and original media URLs; it does not mirror media files into this repository.

The source site describes its library as copyright free, but its disclaimer also describes a process for reporting third party intellectual property claims. The app therefore preserves original page URLs and does not make a blanket guarantee that every source asset is free of third party rights. Review source terms and individual asset rights before using content commercially.

## Stack
Next.js App Router, React, TypeScript, Motion, Lucide icons, Tailwind CSS v4 and custom responsive CSS.

## Data and privacy notes
- The public meme endpoint retrieves templates from a no key feed where available, then falls back to bundled template metadata.
- The Indian template sync job indexes metadata and original media URLs from the still image archive and the video category, checks robots rules, throttles requests, and retries rate limits. It does not download or rehost source media files. The video collection is restricted to actual `.gif` URLs; still images remain in the still template collection and MP4 clips are not exposed as GIF templates.
- Meme images are provided by their respective source URLs. Each template card includes a small external link to the original template page; it is not part of the Meme Is Mine brand identity.
- The image editor exports PNGs in the browser using Canvas.
- The video editor renders canvas frames and exports WebM with the browser MediaRecorder API. Browser support for WebM recording is required.
- Drafts and bookmarks use browser localStorage. They are not uploaded to a hosted database and do not sync across devices.
- Local image uploads are limited to 2.5 MB so data-URL drafts can remain in browser storage.
- No hosted user database, email-verification service or external authentication provider is required.

## Deployment
Import the repository into Vercel and use the standard Next.js build settings. Build command: `npm run build`.
