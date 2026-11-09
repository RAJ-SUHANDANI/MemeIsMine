import { NextResponse } from "next/server";
import { authClient } from "@/lib/auth";
import { canonicalReactionKey } from "@/lib/template-reactions";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const key = canonicalReactionKey(
    new URL(request.url).searchParams.get("key"),
  );
  if (!key)
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404, headers },
    );
  const client = await authClient();
  if (!client)
    return NextResponse.json(
      { error: "Likes unavailable" },
      { status: 503, headers },
    );
  const { data, error } = await client.rpc("read_template_like", {
    p_key: key,
  });
  if (error || !data)
    return NextResponse.json(
      { error: "Likes unavailable" },
      { status: 503, headers },
    );
  return NextResponse.json({ ...data, key }, { headers });
}
