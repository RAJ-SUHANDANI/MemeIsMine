"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// Keep analytics on public pages and avoid recording private workspaces,
// sign-in flows, template IDs, or potentially sensitive URL parameters.
const privatePaths = [
  "/account",
  "/auth",
  "/login",
  "/signup",
  "/studio",
  "/create",
  "/video-editor",
  "/reset-password",
  "/forgot-password",
  "/verify",
];

function sanitizePageview(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url);

    if (
      privatePaths.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))
    ) {
      return null;
    }

    url.search = "";
    url.hash = "";
    return { ...event, url: url.toString() };
  } catch {
    // Never send a URL we cannot safely inspect.
    return null;
  }
}

export function PrivacyAnalytics() {
  return <Analytics beforeSend={sanitizePageview} />;
}
