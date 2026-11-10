# Meme Is Mine security and operations

## Hosted authentication

Appwrite Cloud manages password hashing, identity verification, email codes, session state, and private account storage. Meme Is Mine uses a server-only Appwrite API key; the key must never enter client JavaScript or a public repository. Cookie-based sessions are HttpOnly, Secure in production, and SameSite=Lax; every Studio/editor route checks for a **verified user**.

The verification-pending cookie is HMAC-signed, short-lived, and contains only the email, Appwrite user ID, purpose and expiry. The recovery flow requires both a valid one-time code and a new password. Appwrite sends verification and recovery emails using its managed mail service.

## Private likes database

Appwrite DocumentsDB holds keyed `userId`, `templateKey` and time values. The server API key is used only on the server. The collection must have no public read permissions; the public template-likes endpoint reports aggregate counts and the current signed-in visitor's own like state. The Studio likes endpoint lists only that account's items.

## Important rate-limit distinction

Calls authenticated using an Appwrite *server API key* can bypass Appwrite's client-rate-limits. The hosted provider's abuse systems and this application's Next.js CSRF checks are helpful, but **do not replace** edge/WAF controls. Before broad signup availability, enable free or paid edge bot protection and rate limits for `/signup`, `/login`, `/account/verify` and `/account/recover`. Monitor the hosted project's email quotas and account churn.

## Remote media security

The image/video proxies allow only explicitly approved HTTPS hosts. Redirects are revalidated; request timeouts, validated ranges and size limits reduce SSRF and resource-exhaustion risks. Large remote videos are still subject to CDN and client bandwidth limits.

## Headers and browser safety

The web app applies CSP, HSTS in production, Referrer Policy, no-sniff, anti-framing, and restricted permissions headers. Current Next.js hydration and the browser video editor worker require a partially permissive script policy: this **is not a strict nonce-based CSP**. Deploy with HTTPS and verify editor media exports, reduced-motion behavior and real-device keyboard/focus navigation.

## Verification

CI runs lint, TypeScript, production build, public route/API smoke checks and a high/critical production dependency audit. Real hosted account signups, emails and password recovery require an actual Appwrite project; CI must not create fake claims of live delivery.

No website can be guaranteed hacker-proof. Keep dependencies patched, rotate exposed secrets and review platform security advisories.
