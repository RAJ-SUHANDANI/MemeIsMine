# Meme Is Mine — Redesign branch

An original, interactive meme studio with image and video discovery, expressive Motion galleries, mobile navigation, template preview and editing, and a personal Studio.

## Run locally

**Requires Node.js 24.15 or newer.**

```bash
npm ci
cp .env.example .env.local
# Set the environment variables below, then:
npm run dev
```

Routes: `/`, `/explore` (**Image Templates**), `/video-templates` (**Video Templates**), `/studio`, `/account`, `/signup`, `/login`, `/account/verify`, `/account/recover`, and the support pages. The old `/templates` route redirects to `/explore`. Image/video editor internals are intentionally unchanged.

### Discovery

Search and filter controls use a rounded design with a keyboard-accessible animated sort menu. Flow is the only gallery layout across Home, Image Templates and Video Templates. It scrolls horizontally, loops continuously and supports autoplay, pause, touch/drag and keyboard gestures. The homepage renders 24 still and 24 moving formats from the catalogue immediately, with no List/Grid toggle on the landing page. Video cards and expanded previews silently autoplay and loop without playback controls; the actual editor retains playback controls. Image previews offer like, save, share-link and zoom interactions.

## First-party accounts: SQLite + Node + SMTP

The backend does **not** use Supabase or a remotely hosted database API. It uses the built-in `node:sqlite` module directly on your Node 24 application server. User records, salted scrypt password hashes, email verification codes (stored as keyed HMAC hashes), scoped sessions, throttling, and private likes live in the SQLite database.

Configure these server-side variables:

```env
MIM_DATABASE_PATH=/data/accounts.sqlite
MIM_AUTH_SECRET=<at-least-32-random-characters>
MIM_SMTP_HOST=<smtp-host>
MIM_SMTP_PORT=465
MIM_SMTP_USER=<smtp-username>
MIM_SMTP_PASSWORD=<smtp-secret>
MIM_SMTP_FROM=<verified-sender-address>
```

**Deployment requirement:** the SQLite file must live on a persistent, backed-up writable volume attached to **one always-on Node.js instance**. Vercel/serverless function filesystems are ephemeral; this database is **not suitable for a conventional Vercel deployment**. Deploy the Node server on a VPS or container host with a persistent volume and HTTPS reverse proxy instead. Use SMTP credentials only on the server, never in `NEXT_PUBLIC_*` variables.

Sign-up creates a pending account with a scrypt password hash, delivers a six-digit OTP by authenticated SMTP, and activates the account on successful verification. OTPs expire after 10 minutes and have five attempts and a resend cooldown. Login uses an HTTP-only SameSite cookie containing a random session token whose SHA-256 digest alone is stored in the database. Forgot-password uses a separate email OTP and a temporary recovery-scoped session; password replacement revokes old sessions. Reaction updates and reads use local SQL transactions.

If database or SMTP configuration is missing, the relevant form is disabled with an accurate notice: the project does not pretend to send emails. Configure and test real SMTP before inviting users.

**Existing accounts:** legacy account identities, passwords, sessions and likes do not automatically migrate from the previous authentication provider. Users with previous accounts must register again unless an explicit export/import migration is performed. Existing browser drafts and bookmarks remain stored locally.

**Do not commit** `.env.local`, `.env.production`, the SQLite database, WAL files, or database backups.

## Deploy on your own Node host

A Dockerfile and compose configuration are provided. Copy the environment file to `.env.production` with real server values and use:

```bash
docker compose up -d --build
```

The container binds to localhost port 3000. Put an HTTPS reverse proxy in front, configure SMTP and its sender domain, monitor disk space, and back up the named SQLite volume consistently (prefer SQLite's online backup API, not copying WAL files independently).

## Verify

```bash
npm run lint
npm run typecheck
npm run build
npm run start -- -p 3001
# In another terminal:
npm run qa:smoke
```

The repository's CI runs lint, TypeScript, build, and production route/API checks. Browser and end-to-end signup/SMTP delivery tests on the target host remain required before a production launch.

Notes: image/video template media can originate from remote hosts; rights and third-party license terms still apply even when the UI doesn't show promotional links. No platform/source-code/portfolio links appear in the public redesigned flows.

## Current design and search visibility

The homepage intro runs through its full Motion progress animation and exit before the main page is revealed on the first visit; a manual Skip control and reduced-motion/no-JavaScript fallbacks remain available. Home and both template archives use the **Flow gallery only**. There are no Grid, List or Stack layout controls.

Unique per-page canonical metadata, structured WebApplication/WebSite descriptions, an SSR FAQ and server-rendered image/video catalogues support indexing. Set `NEXT_PUBLIC_SITE_URL` to the **real HTTPS public domain** before launch. See `SEARCH-VISIBILITY.md` and `SECURITY.md` for release checks. No search ranking or AI citation can be guaranteed.

GitHub Actions also tests a temporary signed-in SQLite session accessing Studio and both existing editor routes. The genuine email/OTP workflow still requires a production SMTP account and persistent Node deployment. These steps cannot be verified by CI without real SMTP credentials.
