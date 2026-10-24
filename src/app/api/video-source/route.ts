import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["indianmemetemplates.com", "www.indianmemetemplates.com"]);
const MEDIA_PATH = /\/wp-content\/uploads\//i;
const MEDIA_FILE = /\.(gif|mp4|webm|mov|m4v|ogv)$/i;

async function handle(request: Request) {
  const incoming = new URL(request.url);
  const raw = incoming.searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  let target: URL;
  try { target = new URL(raw); } catch { return NextResponse.json({ error: "Invalid media URL." }, { status: 400 }); }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname) || !MEDIA_PATH.test(target.pathname) || !MEDIA_FILE.test(target.pathname)) {
    return NextResponse.json({ error: "Only GIF or video files from the approved template archive are supported." }, { status: 400 });
  }
  try {
    const headers = new Headers({ "User-Agent": "MemeIsMineVideoEditor/1.0", "Accept": "video/*, image/gif, */*" });
    const range = request.headers.get("range");
    if (range) headers.set("Range", range);
    const upstream = await fetch(target.toString(), { method: request.method === "HEAD" ? "HEAD" : "GET", headers, cache: range ? "no-store" : "force-cache", next: range ? undefined : { revalidate: 86400 }, signal: AbortSignal.timeout(30000) });
    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: "The source media is unavailable right now.", status: upstream.status }, { status: upstream.status === 404 ? 404 : 502 });
    }
    const outHeaders = new Headers();
    outHeaders.set("Content-Type", upstream.headers.get("content-type") ?? (target.pathname.toLowerCase().endsWith(".gif") ? "image/gif" : "video/mp4"));
    outHeaders.set("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
    outHeaders.set("X-Content-Type-Options", "nosniff");
    for (const name of ["content-length", "content-range", "accept-ranges", "last-modified", "etag"]) {
      const value = upstream.headers.get(name);
      if (value) outHeaders.set(name, value);
    }
    return new NextResponse(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers: outHeaders });
  } catch {
    return NextResponse.json({ error: "Could not retrieve the media file." }, { status: 502 });
  }
}
export async function GET(request: Request) { return handle(request); }
export async function HEAD(request: Request) { return handle(request); }
