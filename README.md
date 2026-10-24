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
- `/api/video-source` — safe same-origin media proxy for GIF and supported video formats
- `/api/image` — image proxy restricted to approved template image hosts

## Template API examples

```text
GET /api/indian-memes?page=1&limit=24&sort=popular
GET /api/indian-memes?q=arjun&sort=trending
GET /api/video-templates?page=1&limit=24&sort=recent
GET /api/video-templates?slug=chinese-guy-explaining
```

The image endpoint returns a `memes` array; `/api/video-templates` returns a paginated `templates` array containing direct GIF and video files (including MP4). Both support pagination and search. Media is streamed through `/api/video-source?url=...`, which validates approved hosts, upload paths, and supported file extensions. Video templates stay as videos and are not converted into still images. The editor exports WebM locally in the browser.

To refresh source indexes manually, run `npm run sync:indian-videos` followed by `npm run sync:indian-images`, or use the GitHub Actions workflow. The workflow also refreshes the catalogs weekly. The sync indexes template metadata and original media URLs; it does not mirror media files into this repository.

The sync process indexes template metadata and media URLs rather than copying media files into the repository. Check applicable content and usage terms before redistributing media or using it commercially.

## Stack
Next.js App Router, React, TypeScript, Motion, Lucide icons, Tailwind CSS v4 and custom responsive CSS.

## Data and privacy notes
- The public meme endpoint retrieves templates from a no key feed where available, then falls back to bundled template metadata.
- The Indian template sync job indexes metadata and original media URLs from the still image archive and the video category, checks robots rules, throttles requests, and retries rate limits. It does not download or rehost source media files. The video collection accepts direct `.gif`, `.mp4`, `.webm`, `.mov`, `.m4v`, and `.ogv` media URLs; video archive entries are excluded from the still-image catalog.
- Meme images are provided by their respective source URLs. Template cards do not display external source/archive links.
- The image editor exports PNGs in the browser using Canvas.
- The video editor renders canvas frames and exports WebM with the browser MediaRecorder API. Browser support for WebM recording is required.
- Drafts and bookmarks use browser localStorage. They are not uploaded to a hosted database and do not sync across devices.
- Local image uploads are limited to 2.5 MB so data-URL drafts can remain in browser storage.
- No hosted user database, email-verification service or external authentication provider is required.

## Deployment
Import the repository into Vercel and use the standard Next.js build settings. Build command: `npm run build`.
