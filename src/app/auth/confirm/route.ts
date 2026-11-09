import { NextResponse } from "next/server";
import { authClient } from "@/lib/auth";
import { returnPath } from "@/lib/return-path";

function redirectHere(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path, "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const client = await authClient();
  const token = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");
  const recovery = url.searchParams.get("type") === "recovery";
  if (client && (token || code)) {
    const result = token
      ? await client.auth.verifyOtp({
          token_hash: token,
          type: recovery ? "recovery" : "email",
        })
      : await client.auth.exchangeCodeForSession(code!);
    if (!result.error)
      return redirectHere(
        recovery
          ? "/account/password"
          : returnPath(url.searchParams.get("next")),
      );
  }
  return redirectHere("/login?status=confirmation-error");
}
