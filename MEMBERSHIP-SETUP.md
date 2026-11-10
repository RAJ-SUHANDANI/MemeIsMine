# Meme Is Mine — Appwrite Cloud integration

## Already completed for your MemeIsMine project

- Appwrite Cloud Free project exists in Frankfurt, project ID \`6af2b2b50036b641f46d\`.
- API endpoint: \`https://fra.cloud.appwrite.io/v1\`.
- Email/password and six-digit email OTP authentication are enabled.
- Password policy: 12-character minimum, common-password checks, checks against personal information and breached passwords, and session invalidation on password changes.
- The private **TablesDB** database \`mim\` and indexed table \`template_likes\` are created with \`templateKey\` (varchar), \`userId\` (varchar), and \`createdAt\` (bigint).
- A separate Next.js SSR preview Site, \`memeismine-redesign\`, was created. Its runtime uses Node 24 and public Appwrite environment variables are already set.
- An isolated source build from the public \`redesign\` branch succeeded. It has not been activated while real account credentials are still missing.
- No changes were made to \`main\` or to either meme editor implementation.

## The remaining access-control step

The connected Appwrite plugin can configure database resources but **cannot issue permanent project API keys or grant additional site runtime scopes**. Appwrite declined both operations. The project owner must therefore complete one secure setup inside the Appwrite Console:

1. Open the **MemeIsMine** project → **Settings → API Keys**.
2. Create a new server key named \`MemeIsMine SSR\`, scoped only to \`users.read\`, \`users.write\`, \`sessions.read\`, \`sessions.write\`, \`tokens.write\`, \`rows.read\`, and \`rows.write\`.
3. Open **Sites → MemeIsMine Redesign → Settings → Environment variables** and create a **secret** variable \`APPWRITE_API_KEY\` containing that key. Never paste it into GitHub, source code, or chat.
4. Redeploy the latest \`redesign\` branch, and confirm the build is successful. If using another Next.js host, set the same private variable there instead.

Existing environment values:

\`\`\`env
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=6af2b2b50036b641f46d
APPWRITE_DATABASE_ID=mim
APPWRITE_LIKES_COLLECTION_ID=template_likes
APPWRITE_API_KEY=<server-only secret; do not commit>
\`\`\`

The API key is **server-only** and used for server-side email/password sessions, verification, recovery, and private likes. The table has no public read/write permissions. The local database and SMTP mail server are gone.

## Production testing checklist

Use a real account after configuring the secret. Confirm: create account, receive a six-digit email verification code, verify it, sign in again, open Studio and both editors, like and unlike a template, use password recovery, and sign out. Check a second account cannot read private user likes.

Appwrite's built-in sender handles email on the Free plan, subject to mail/abuse quotas and Appwrite branding. Do not advertise live signup until actual delivery and recovery have been tested. Browser drafts and bookmarks stay local and do not automatically sync across devices.

## Optional setup script

\`npm run setup:appwrite\` is now based on TablesDB with the same schema and is idempotent. It is **not required again** for this already-created project.

## Hosting and privacy

Next.js no longer needs local SQLite persistence and can use Appwrite Sites or another SSR host. Do not expose the secret key using a \`NEXT_PUBLIC_*\` environment variable. Keep HTTPS and CDN bot controls enabled, and monitor free-tier quotas.

