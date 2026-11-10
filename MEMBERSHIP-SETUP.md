# Meme Is Mine — Free Appwrite Cloud setup

This guide replaces the old SQLite/SMTP self-hosting workflow. Appwrite Cloud manages the accounts and email delivery, and a private DocumentsDB collection stores template likes.

## One-time setup

1. Create an Appwrite Cloud Free project at https://cloud.appwrite.io. Choose a region.
2. Enable **Email/Password** sign-in in your project's Auth settings. Enable **Email Verification OTP** / verification by code.
3. In your project's Settings, copy the API endpoint (for example `https://fra.cloud.appwrite.io/v1`) and project ID. Add your actual website's domain as a Web platform where applicable.
4. Create one **server API key** with only the scopes needed for server actions and the private likes database: `sessions.write`, `users.read`, `users.write`, `documentsdb.read` and `documentsdb.write`. Appwrite may label these permissions slightly differently in the Console; follow the current Auth and DocumentsDB API reference.
5. Set environment variables on your Next.js hosting provider, then redeploy:
   ```env
   APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=<PROJECT_ID>
   APPWRITE_API_KEY=<PRIVATE_SERVER_KEY>
   APPWRITE_DATABASE_ID=mim
   APPWRITE_LIKES_COLLECTION_ID=template_likes
   NEXT_PUBLIC_SITE_URL=https://your-site.example
   ```
   The endpoint above is **an example**; use your chosen project's region. Never expose the API key via `NEXT_PUBLIC_*`.
6. Run `npm run setup:appwrite` in an environment with the same private variables. This creates a private, server-access-only DocumentsDB database named `mim` and collection named `template_likes`. This operation is idempotent.
7. Open the hosted website and test a **real registration**, verify the six-digit email code, sign out/in, recover a password, and test Studio likes with two separate accounts. Do not activate production signups until these checks succeed.

## Account behavior

- Email and passwords are managed by Appwrite rather than stored by this application.
- On sign-up, an unverified account session is created and Appwrite sends a six-digit code valid for 15 minutes.
- The Studio and both editor routes require a **verified** account. Unverified users see the code-verification flow.
- Password recovery sends a six-digit code and requests a new password in the same secure form; recovery does not silently log users in.
- Account and recovery session details are kept in HttpOnly cookies; pending verification state is HMAC-signed and expires.
- Template likes are stored in a private Appwrite DocumentsDB collection. Only authenticated server actions use its API key. Public APIs return aggregate counts, never lists of another person's reactions.
- The local browser still owns drafts, bookmarks and collections. These do **not** automatically sync across browsers.

## Costs and limits

Appwrite Cloud Free publishes **75,000 monthly active users**, **5 GB monthly bandwidth**, one database, and resource limits. Free projects can pause after inactivity. Its standard built-in mail sender is available without configuring a personal Gmail account or SMTP credentials, but generic provider branding and undisclosed anti-abuse or delivery limits can apply. The Free plan is not an unlimited email sender or an unlimited-traffic guarantee.

## Security and operational notes

Appwrite API keys bypass some client-side API rate limits. **Before a high-traffic launch**, put bot protection or rate limiting on public signup, login, OTP and recovery actions at the hosting/CDN layer, and monitor abuse. Keep secrets in hosting environment settings. Review Appwrite's Auth security policy (minimum password length, disposable email rules, email verification and session restrictions). Check privacy and regulatory requirements for storing user data with Appwrite.

The previous local Node SQLite database and custom SMTP sender are intentionally removed. No database file, persistent Docker volume or self-managed mail server is needed.

## Important

There is no Appwrite project or server API key connected to this repository by default. Until you configure one, account actions fail closed and the signup screen explains why; it must never pretend to send verification emails.
