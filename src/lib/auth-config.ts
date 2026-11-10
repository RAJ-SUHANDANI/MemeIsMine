/**
 * Self-hosted account storage. SQLite is reached directly from Node.js,
 * not through a third-party database API. No browser-facing DB secrets.
 */
export function authConfig() {
  const path = process.env.MIM_DATABASE_PATH;
  const secret = process.env.MIM_AUTH_SECRET;
  // Serverless filesystems are ephemeral; never enable account storage there.
  if (process.env.VERCEL) return null;
  return path?.startsWith("/") && secret && secret.length >= 32
    ? { path, secret }
    : null;
}

export function emailConfig() {
  const host = process.env.MIM_SMTP_HOST;
  const from = process.env.MIM_SMTP_FROM;
  const user = process.env.MIM_SMTP_USER;
  const password = process.env.MIM_SMTP_PASSWORD;
  const port = Number(process.env.MIM_SMTP_PORT ?? 465);
  if (!host || !from || !user || !password || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { host, from, user, password, port };
}
