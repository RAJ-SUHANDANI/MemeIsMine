# Meme Is Mine

A playful, editorial meme creation studio built with Next.js, TypeScript, Tailwind CSS, and Motion.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Product notes

- Meme templates are bundled locally in `src/data/memes.ts`; the app does not require a meme API key.
- Drafts and saved templates use browser local storage. There is no hosted database or email-verification service.
- Meme export is generated in the browser using the Canvas API.

## Deploy

Import this repository into Vercel and use the default Next.js build settings.
