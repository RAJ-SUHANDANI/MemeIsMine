# Meme Is Mine

An independent meme-discovery and browser creation studio. The `redesign` branch introduces an editorial, motion-led discovery experience, mobile app navigation, deep-linked template previews, and a more capable personal Studio. Built by Raj Suhandani.

**Branch safety:** This work is committed to `redesign` only. The existing image and video editors and their data formats remain unchanged.

## Develop

Use Node.js 22 or newer.

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
```

The production smoke suite expects a running server on port 3001:

```bash
npm run start -- -p 3001
# In another terminal:
npm run qa:smoke
```

## Design and routes

- `/`: interactive caption example, editorial narrative, still and moving format galleries, creator story and a skippable Motion/CSS-3D first-visit introduction.
- `/explore` and `/templates`: browse the image catalogue with four selectable layouts (Grid, Flow, Stack and List), searchable, paginated results, and shareable preview URLs.
- `/video-templates`: tilted object-style video catalogue with on-demand preview, alternate layouts and existing media routes.
- Template previews: spring-driven shared-layout transitions, likes for signed-in accounts, double-tap, pinch/zoom for images, save, and copyable deep links.
- `/studio`: protected personal workspace with searchable drafts, rename/delete/undo, saved formats, custom collections, authenticated likes, and on-device JSON backup/restore.
- `/account`: shortcuts into the workspace, security and account actions.
- `/login`, `/signup`, `/account/password`, `/account/recover`: authentication and password management.
- `/about`, `/how-it-works`, `/faq`, `/privacy`, `/contact`, `/add-review`: supporting pages using the same design system. Feedback notes remain on the current device.
- `/create/:id`, `/video-editor/:id`: original editors intentionally preserved. These routes use the original editor header as well.

The mobile website has safe-area-aware bottom navigation, an accessible creation sheet and compact preview surfaces. NativeWind and gluestack are not part of this Next.js web implementation; this is a web/PWA-style experience, not a separate Expo/React Native application.

## Data and account setup

Create a Supabase project with email/password auth, email confirmation, production SMTP and the appropriate redirect URLs. Set these environment values (see `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Apply the SQL migrations in order:

1. `supabase/migrations/202611100002_template_likes.sql`
2. `supabase/migrations/202611100003_account_likes.sql`

The second migration exposes the *current account's* liked template keys, not anyone else's private reactions. See `MEMBERSHIP-SETUP.md` for details.

Drafts, bookmarks, collections, local feedback, and uploads are stored in browser storage; **signing in does not synchronize them across devices**. The Studio backup is an explicitly downloaded JSON file and may contain user-uploaded image data. Reactors/aggregate likes are stored through Supabase.

## API catalogue

- `GET /api/memes?page=1&limit=24&sort=popular`
- `GET /api/memes?id=<template-id>`
- `GET /api/video-templates?page=1&limit=24&sort=new`
- `GET /api/video-templates?slug=<slug>`
- `GET /api/home-templates`
- `GET /api/account/likes` (authenticated; requires second SQL migration)
- Existing image/video media proxies and export functions remain in place.

Catalog metadata refreshes through the existing GitHub Actions workflow. Remote source availability and browser video support can vary. Template media remains owned by its original providers: check rights and applicable terms.

## Design contract

The visual system uses warm paper `#f3efe6`, near-black `#161715`, archive vermilion `#db4b2c`, expressive typography, image-first cards and purpose-driven Motion interactions. Avoid generic gradients, fabricated metrics, ornamental perpetual motion and artificial progress indicators. Respect reduced-motion preferences, focus navigation, clear empty states and browser-storage failures.

The named Motion references are documented in `REDESIGN.md`. Premium Motion+ example source was **not** copied into this project.

## Validation

GitHub Actions on `redesign` runs lint, TypeScript, production build and route/API smoke tests. CI success does not replace manual visual or device testing. Inspect a preview deployment at desktop, 390px and 320px widths, perform keyboard and reduced-motion checks, and test the actual account flow with configured Supabase before release.

**Do not merge `redesign` into `main` without separate, explicit approval.**
