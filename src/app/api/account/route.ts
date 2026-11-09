import { NextResponse } from "next/server";
import { accountSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(
    { signedIn: Boolean(await accountSession()) },
    {
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
