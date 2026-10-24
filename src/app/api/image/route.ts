import { NextResponse } from "next/server";
const ALLOWED_HOSTS = new Set(["i.imgflip.com", "imgflip.com"]);
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  let target: URL;
  try { target = new URL(raw); } catch { return NextResponse.json({ error: "Invalid image URL" }, { status: 400 }); }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) return NextResponse.json({ error: "Only approved meme image hosts are supported" }, { status: 400 });
  try {
    const upstream = await fetch(target.toString(), { next: { revalidate: 86400 } });
    if (!upstream.ok) return NextResponse.json({ error: "Image could not be retrieved" }, { status: upstream.status });
    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return NextResponse.json({ error: "URL did not return an image" }, { status: 415 });
    return new NextResponse(upstream.body, { headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=86400, s-maxage=604800", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "Unable to fetch image right now" }, { status: 502 }); }
}
