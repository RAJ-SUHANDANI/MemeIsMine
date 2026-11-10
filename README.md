# Meme Is Mine — Redesign

A motion-driven, browser-based meme studio with image and video templates, a personal Studio, and email-verified accounts. This work stays on the `redesign` branch; the editor implementations and `main` branch are untouched.

## Development

Node.js 24 is used by CI, although the application no longer depends on a local SQLite server.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The public homepage, `/explore` (Image Templates) and `/video-templates` (Video Templates) use a continuous horizontal Flow gallery. Each home gallery includes 24 formats, video previews autoplay silently and loop, and the branded first-visit intro completes before displaying the homepage. The duplicate `/templates` route redirects to `/explore`.

## Free hosted accounts — Appwrite Cloud

**No VPS, custom SMTP, self-managed SQLite, or paid database required.** Accounts, email-password login, six-digit email verification and password recovery are handled through Appwrite Cloud Free. The platform also stores private likes, while drafts, bookmarks, collections and uploads remain on the current browser.

The Appwrite Free project, private indexed TablesDB likes table, and isolated Next.js preview Site are **already created**. `MEMBERSHIP-SETUP.md` records the verified project and the one remaining server API key permission. The required environment variables are:

```env
APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<your-project-id>
APPWRITE_API_KEY=<server-only-api-key>
APPWRITE_DATABASE_ID=mim
APPWRITE_LIKES_COLLECTION_ID=template_likes
NEXT_PUBLIC_SITE_URL=<your-public-https-url>
```

The private `mim/template_likes` TablesDB is already provisioned. `npm run setup:appwrite` remains available as an idempotent schema setup script for new environments.

**Security:** `APPWRITE_API_KEY` is server-only and must never appear in a public source file, chat message or `NEXT_PUBLIC_*` variable. Sessions are verified server-side with Appwrite and use HttpOnly cookies. Protected Studio and editor routes reject signed-out visitors.

**Email:** Appwrite Cloud's default email service handles verification and recovery, using Appwrite branding on the Free plan. A custom SMTP provider is not necessary for initial public signup. Custom branded email templates and SMTP require a different provider/plan. Free-tier service limits, quotas and abuse controls still apply.

**Hosting:** This managed setup is compatible with ordinary Next.js hosting, including Vercel, because no local account file needs persistent storage.

**Migration:** Previously registered users in the retired local SQLite authentication implementation are not automatically transferred to Appwrite. Browser drafts/bookmarks are unaffected. If you have real existing account data, perform an explicit, authorized migration before switching production users.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
npm run start -- -p 3001
# In another terminal:
npm run qa:smoke
```

CI verifies public pages, sitemap, gallery UI, security headers and signed-out route protection. A live Appwrite project exists, but this plugin connection cannot issue a permanent API key. Add the server key privately in the Site environment before end-to-end registration, OTP delivery, password reset, or cross-device likes can be tested. Do not claim the service is live until these tests pass.

## Search visibility

Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS origin to generate accurate metadata, canonicals, structured data and sitemap entries. `SECURITY.md` and `SEARCH-VISIBILITY.md` document production checks. SEO ranking, AI citations, and unrestricted scale are not guaranteed.

Public pages do not show source-code, provider, portfolio or other promotional external links. Media licensing requirements still apply even when source links are not rendered.
