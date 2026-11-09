# Free accounts and live template likes

Use Node.js 22 or newer. Apply `supabase/migrations/202611100002_template_likes.sql` in the Meme Is Mine Supabase project. Set the two public project values in `.env.example` for local development and in Vercel before building the app.

In Supabase Auth, enable email and password sign-in with email confirmation. Set the site URL to the deployment origin. Set the confirmation email URL to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}` and the recovery email URL to `{{ .SiteURL }}/auth/confirm?type=recovery&token_hash={{ .TokenHash }}`. Configure production SMTP. Signing in from Studio or an editor link returns to that page.

The migration publishes only public aggregate counts to Supabase Realtime. Individual reactions are private and every account gets one reaction per template. Enable Realtime for the project. Guests can read counts and preview templates. A free account unlocks Studio, both editors, and likes. Drafts and bookmarks stay on the current browser.

The scheduled catalog workflow runs daily on the GitHub default branch and refreshes Imgflip, Memegen, and the Indian video archive. New memes shows templates added or published in the last 30 days. Run `node scripts/sync-open-templates.mjs` and `npm run sync:indian-videos` to refresh the source snapshots locally.

## Redesign Studio liked formats

Apply `supabase/migrations/202611100003_account_likes.sql` after the template likes migration. It grants authenticated users a private, limited list of their own liked template keys using a SECURITY DEFINER function filtered by `auth.uid()`. `/api/account/likes` resolves those keys against the public image/video catalog for the Studio Liked tab; it is never a public list of individual reactions. The tab reports that likes are unavailable if the migration has not been applied. Browser drafts, bookmarks, collections, and local JSON backups remain on-device and are not uploaded to Supabase.
