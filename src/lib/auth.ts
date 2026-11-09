import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { authConfig } from "./auth-config";

export async function authClient() {
  const jar = await cookies();
  const config = authConfig();
  if (!config) return null;
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(entries) {
        try {
          entries.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          // Middleware refreshes cookies before protected server components run.
        }
      },
    },
  });
}

export const accountSession = cache(async () => {
  const client = await authClient();
  if (!client) return null;
  const {
    data: { user },
  } = await client.auth.getUser();
  return user ? { client, user } : null;
});
