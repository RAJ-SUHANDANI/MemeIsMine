import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth-config";

export async function middleware(request: NextRequest) {
  const config = authConfig();
  let response = NextResponse.next({ request });
  if (!config) return response;
  const client = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(entries) {
        entries.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        entries.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    "/create/:path*",
    "/video-editor/:path*",
    "/studio",
    "/api/template-likes",
    "/account/:path*",
    "/login",
    "/signup",
    "/api/account",
  ],
};
