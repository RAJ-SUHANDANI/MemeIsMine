# Security and operations — Meme Is Mine (redesign)

## Threat model and safety properties

This project accepts account credentials and renders remote image/video templates. Its main risks are credential stuffing, insecure email recovery, leaked session cookies, cross-site scripting, server-side request forgery, malicious oversized media responses, resource-exhaustion attacks, dependency vulnerabilities, and loss of account data.

### Accounts

- First-party Node.js + persistent SQLite; no browser-side database keys.
- Passwords hashed with salted scrypt; OTPs are keyed HMAC hashes (6 digits, 10-minute expiry, 5 failed code attempts).
- Recovery gets a narrowly scoped ten-minute session; it cannot access Studio or an editor until the password has been reset.
- Changing the password from a normal session also requires the old password. Successful replacement revokes all existing sessions.
- Session bearer tokens are random, stored server-side only as SHA-256 digests, and sent in HttpOnly, SameSite=Lax, Secure-in-production cookies.
- Persistent per-client rate buckets cover login, signup, code verification, OTP resend, recovery and password replacement.
- Password and OTP data are never written to public HTML or logs. Server errors should not expose secrets.
- **Known limitation:** SQLite rate buckets are keyed by the reverse proxy's trusted `X-Real-IP`. Production infrastructure must overwrite, not forward, any client-provided value. Configure an additional edge/WAF rate limit, especially for video/image APIs.

### Remote media proxies

- Use HTTPS allowlists for media hostnames and deny credentials/custom ports in URLs.
- Validate each redirect hop against the allowlist; never automatically follow a redirect to private or arbitrary hosts.
- Enforce reasonable media MIME types, response size caps, timeouts and validated byte-range formats.
- Remote source availability is not guaranteed. A blocked media request must fail safely with a usable poster/fallback.

### Security headers and frontend

- CSP, X-Frame-Options DENY, no-sniff, restricted permissions, COOP, referrer policy, and production HSTS are applied centrally.
- **CSP caveat:** Next.js static hydration and the current FFmpeg worker need a limited permissive script policy including `unsafe-inline` and blob workers. This reduces several risks, but **is not a nonce-based strict CSP**. A full CSP rollout needs verified browser and editor export testing.
- Never render untrusted strings as HTML. JSON-LD is escaped before insertion.
- Protected routes check account sessions inside Node page/route logic, not only middleware.
- Avoid granting upload/write permissions to visitors other than the intended browser-local editor flow.

### Runtime and deployment

- Use Node.js 24.15+ and Next.js 15.5.29 with React/React DOM 19.1.10 or newer audited compatible patches.
- Run a **single** persistent Node instance with a durable SQLite volume and HTTPS reverse proxy. Default Vercel/serverless disks are **not** suitable for this local database.
- Keep SMTP and `MIM_AUTH_SECRET` server-only; never use `NEXT_PUBLIC_*` for secrets.
- Protect SMTP with SPF/DKIM/DMARC, and monitor delivery failures.
- Restrict outgoing access where possible, configure proxy request-size limits, and use WAF/rate-limit rules against abusive traffic.
- Schedule tested SQLite backups and restore drills. Monitor capacity and WAL growth.
- Deploy under least-privilege OS users, and protect all backup files and server logs.
- Treat third-party media as untrusted; displaying a template does not grant rights to republish it.

### Verification gates

Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:auth`, `npm run build`, and `npm run qa:smoke` against a running production-style server. CI validates local database/OTP behavior using a fake mail sender, **not an SMTP provider**. Before launch, complete real-browser login/verification/recovery tests with configured SMTP, actual image/video editor exports, real-device motion checks, security scans and a production HTTPS review.

No application can be guaranteed immune to attacks. Keep patching dependencies and monitoring the deployed host.
