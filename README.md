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
- `/templates` — curated categories and routes into the template library
- `/create/:id` — editor for a selected template
- `/create/upload` — start with an image from your own device
- `/studio` — drafts and bookmarks saved in the current browser
- `/how-it-works` — how to create and export a meme
- `/about` — product story and information about Raj Suhandani
- `/faq` — interactive frequently asked questions
- `/privacy` — plain-language data and storage details
- `/contact` — portfolio, GitHub, LinkedIn and email links
- `/api/memes` — template endpoint, with a bundled fallback
- `/api/image` — image proxy restricted to approved template image hosts

## Stack
Next.js App Router, React, TypeScript, Motion, Lucide icons, Tailwind CSS v4 and custom responsive CSS.

## Data and privacy notes
- The public meme endpoint retrieves templates from a no key feed where available, then falls back to bundled template metadata.
- The Indian template sync job indexes metadata and original media URLs from the still image archive and the video category, checks robots rules, throttles requests, and retries rate limits. It does not download or rehost source media files. Video templates appear only when a direct GIF or video asset can be found on an allowed source upload URL.
- Meme images are provided by their respective source URLs. Each template card includes a small external link to the original template page; it is not part of the Meme Is Mine brand identity.
- The image editor exports PNGs in the browser using Canvas.
- The video editor renders canvas frames and exports WebM with the browser MediaRecorder API. Browser support for WebM recording is required.
- Drafts and bookmarks use browser localStorage. They are not uploaded to a hosted database and do not sync across devices.
- Local image uploads are limited to 2.5 MB so data-URL drafts can remain in browser storage.
- No hosted user database, email-verification service or external authentication provider is required.

## Deployment
Import the repository into Vercel and use the standard Next.js build settings. Build command: `npm run build`.
