# Meme Is Mine / Reframe — Branch design contract

**Branch:** `redesign`  
**Baseline:** `256ca97c0f1496de46b3ffb9eb9099f3865b45d3`  
**Scope:** Public site, gallery discovery, template previews, account experience, personal Studio, mobile app shell, supporting pages and introductory sequence.  
**Exclusions:** Both editor implementations and all editor export internals. Do not modify or merge into `main`.

## Creative direction

Build a peculiar, memorable internet object instead of a generic SaaS dashboard. Think archived paper ephemera, gallery labels, compact technical metadata and expressive editorial typography. Meme imagery is the main character. Warm paper `#f3efe6`, rich ink `#161715`, accent `#db4b2c`, off-white `#fffcf6` and muted mineral neutral `#69665e`. Use the existing font families with considered serif moments. No decorative purple gradients, invented testimonials, irrelevant 3D ornaments or looping animations that impair navigation.

## Named reference mapping

| Route or component | Reference | Implementation |
| --- | --- | --- |
| `/explore` | [Gallery: Showcase](https://motion.dev/examples/react-gallery-showcase) | Grid, Flow, Stack and List, with filter/sort, pagination and remembered layout |
| `/templates` | [Gallery: Showcase](https://motion.dev/examples/react-gallery-showcase) | Dedicated image archive with same layout language |
| `/video-templates` | [Gallery: Objects](https://motion.dev/examples/react-gallery-objects) | A tilted poster gallery with alternate spatial views and on-demand playback |
| Any template | [Shared Layout Modal](https://motion.dev/examples/react-modal-shared-layout) | Expand the selected image/poster into a dialog and return it to the card |
| Image preview | [Double tap](https://motion.dev/examples/react-tap-double), [Pinch zoom](https://motion.dev/examples/react-pinch-zoom) | Like gesture, zoom, pan, reset, accessible buttons |
| Preview share | [Copy Button](https://motion.dev/examples/react-copy-button) | Deep link to template with animated check confirmation |
| Mobile | [App Store](https://motion.dev/examples/react-app-store), [Sheet](https://motion.dev/examples/react-sheet-modal) | Bottom tab bar, create sheet, tactile details |
| Opening screen | [Loading overlay](https://motion.dev/examples/react-loading-line-reveal) and particle/3D references | Short CSS-3D / Motion orbiting meme cards and brand assembly, not false loading progress |
| Studio | [iOS App Folder](https://motion.dev/examples/react-ios-app-folder), smooth tabs | Searchable drafts, rename/delete undo, collections, likes and backups |

References inform original implementation. Premium Motion+ example source is not included.

## Architectural boundaries

- Preserve the original `/create/:id` and `/video-editor/:id` implementations and their storage keys.
- Authentication uses Supabase and existing middleware. Studio is protected.
- Public media catalogues and remote media paths retain existing APIs and fallbacks.
- Image/video editors get the legacy header: new mobile app navigation does not intrude into editor controls.
- Personal drafts, bookmarks, collections and feedback stay in localStorage. Account likes are stored via Supabase; account likes list requires migration `202611100003_account_likes.sql`.
- Responsive desktop/mid/mobile layouts are separate intentional compositions rather than scaling one canvas.
- Provide reduced-motion behavior, keyboard controls, focus return, touch targets, real empty/retry states and clear browser storage errors.

## Components and design layers

- `reframe-shell.tsx`: global site navigation, mobile app tabs and creation sheet
- `reframe-gallery.tsx`: layout modes, bookmarks and deep-linked preview selection
- `reframe-preview.tsx`: source-aware media preview, reactions, zoom, copy and actions
- `reframe-library.tsx`: image/video searchable paginated directories
- `reframe-intro.tsx`: 3D first-visit branding intro (skippable, reduced-motion aware)
- `reframe-home.tsx`: homepage narrative and live caption experiment
- `reframe-studio.tsx`: personal workspace, local collections, backups, account likes
- `reframe*.css`: scoped editorial styles, footer and responsive rules

## Testing and release acceptance

GitHub Actions: lint, typecheck, build and production route/API smoke. Then visual/browsing QA with a deployment preview: desktop 1440px, mobile 390px and 320px; verify no overflow, gallery modes and selected-page state, modal focus and return, touch zoom/likes, keyboard use, reduced motion, local storage quota and malformed data, imports/exports, signing in and email confirmation, and all image/video editor entry paths. Full device/browser QA is not asserted by CI. Do not merge `main` or claim deployment complete without a separate review.
