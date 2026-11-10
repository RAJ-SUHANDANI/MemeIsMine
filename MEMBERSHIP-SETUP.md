# Account setup — Redesign

Meme Is Mine uses its own Node.js + SQLite account database and SMTP verification. Supabase is no longer used for account/session or like workflows.

1. Use **Node.js 24.15+**.
2. Set `MIM_DATABASE_PATH` to an **absolute, persistent, writable location** on a server you control (for example `/data/accounts.sqlite`). SQLite creates the tables automatically on first use.
3. Set `MIM_AUTH_SECRET` to at least 32 unpredictable characters, e.g. `openssl rand -hex 32`. Keep it server-only. Rotating the secret invalidates outstanding OTP codes and rate-limit identifiers.
4. Set `MIM_SMTP_HOST`, `MIM_SMTP_PORT`, `MIM_SMTP_USER`, `MIM_SMTP_PASSWORD` and `MIM_SMTP_FROM`. Use an SMTP provider or your own configured mail server with authenticated TLS. Configure SPF/DKIM/DMARC for deliverability.
5. Put an HTTPS reverse proxy before the Node application and enforce TLS. Secure session cookies are enabled in production.
6. Back up the persistent SQLite volume and periodically verify recovery on a test server.

## Security behavior

Passwords are salted scrypt hashes; plaintext passwords are never persisted. OTPs are six digits, sent by SMTP, HMAC-hashed at rest, expire in ten minutes, allow five failed attempts, and have a one-minute resend cooldown plus hourly send caps. Sessions are random 256-bit bearer tokens stored as hashes, HTTP-only and SameSite=Lax in the browser. Password reset uses a ten-minute recovery-only session and revokes all other sessions. Updating a password in a normal signed-in session requires the old password. Signup, resend, recovery, and password-change requests also use persistent per-client rate buckets. Likes belong to the signed-in user; published counts are aggregate only.

## Important hosting limitation

Do **not** deploy this setup as an ephemeral Vercel/serverless SQLite file: that would cause account loss and inconsistent sessions. Use one persistent Node instance and a durable SQLite volume, or deliberately redesign the backend for a durable external SQL database using direct SQL connections. A dedicated deployment example is included.

## Migration

The older `supabase/migrations` files are retained as historical documentation only. Nothing in the redesigned account flow uses them. Previously stored accounts and likes are **not** migrated automatically. Existing users must sign up again or an explicit migration must be performed before switching traffic.

The `/account/verify` screen accepts a six-digit code and the `/account/recover` screen initiates recovery. All login/signup actions fail closed when configuration is missing.

## Reverse proxy requirement

The app reads `X-Real-IP` only for abuse controls. Your reverse proxy must **overwrite** this header with the verified connection address and discard client-supplied values; never pass an arbitrary user-supplied `X-Real-IP`. Configure HTTPS, request body limits, and network firewall rules. Avoid exposing the Node server directly to the public internet. In a multi-instance deployment, use a shared SQL database instead of separate local SQLite files.
