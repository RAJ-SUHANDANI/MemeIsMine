import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["indianmemetemplates.com", "www.indianmemetemplates.com"]);
const MEDIA_PATH = /\/wp-content\/uploads\//i;
const MEDIA_FILE = /\.(gif|mp4|webm|mov|m4v|ogv)$/i;
function mediaContentType(path: string, fallback: string | null) {
  const ext = path.toLowerCase().split(".").pop();
  const known: Record<string, string> = { gif: "image/gif", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", m4v: "video/x-m4v", ogv: "video/ogg" };
  return ext ? known[ext] ?? fallback ?? "application/octet-stream" : fallback ?? "application/octet-stream";
}

async function handle(request: Request) {
  const incoming = new URL(request.url);
  const raw = incoming.searchParams.get("url");
  const rawReferrer = incoming.searchParams.get("referrer");
  const fresh = incoming.searchParams.get("fresh") === "1";
  if (!raw) return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  let target: URL;
  let referrer = "https://indianmemetemplates.com/";
  if (rawReferrer) {
    try {
      const candidate = new URL(rawReferrer);
      if (candidate.protocol === "https:" && ALLOWED_HOSTS.has(candidate.hostname) && !MEDIA_PATH.test(candidate.pathname)) referrer = candidate.toString();
    } catch { /* Keep the safe archive referrer. */ }
  }
  try { target = new URL(raw); } catch { return NextResponse.json({ error: "Invalid media URL." }, { status: 400 }); }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname) || !MEDIA_PATH.test(target.pathname) || !MEDIA_FILE.test(target.pathname)) {
    return NextResponse.json({ error: "Only GIF and video files from the template archive are supported." }, { status: 400 });
  }
  try {
    const range = request.headers.get("range");
    let upstream: Response | null = null;
    let upstreamStatus = 502;
    let lastFailure = "The upstream host did not return a media response.";

    const alternateUrl = target.hostname === "indianmemetemplates.com"
      ? target.toString().replace("https://indianmemetemplates.com/", "https://www.indianmemetemplates.com/")
      : target.toString().replace("https://www.indianmemetemplates.com/", "https://indianmemetemplates.com/");
    // Keep the proxy inside Vercel's request budget: try the page's exact
    // source first, then one canonical-host fallback instead of a long series
    // of 20-second retries that can be terminated by the platform.
    const attempts = [
      { url: target.toString(), referrer },
      { url: alternateUrl, referrer: "https://indianmemetemplates.com/" },
    ];

    for (const attempt of attempts) {
      const headers = new Headers({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "video/mp4, video/webm, video/ogg, video/*;q=0.9, image/gif;q=0.8, */*;q=0.5",
        "Referer": attempt.referrer,
        "Origin": "https://indianmemetemplates.com",
        "Accept-Encoding": "identity",
      });
      if (range) headers.set("Range", range);

      let candidate: Response;
      try {
        candidate = await fetch(attempt.url, {
          method: request.method === "HEAD" ? "HEAD" : "GET",
          headers,
          cache: "no-store",
          redirect: "follow",
          signal: AbortSignal.timeout(3500),
        });
      } catch (error) {
        lastFailure = error instanceof Error ? error.message : "Network error while contacting the source host.";
        continue;
      }

      upstreamStatus = candidate.status;
      const contentType = (candidate.headers.get("content-type") ?? "").toLowerCase();
      const isRealMedia = !contentType.includes("text/html") && !contentType.includes("application/json");
      if ((candidate.ok || candidate.status === 206) && isRealMedia) {
        upstream = candidate;
        break;
      }

      lastFailure = "Source returned HTTP " + candidate.status + (contentType ? " (" + contentType + ")" : "");
      await candidate.body?.cancel().catch(() => undefined);
    }
    if (!upstream) {
      return NextResponse.json(
        { error: upstreamStatus === 404 ? "The source media file no longer exists." : "The source media could not be retrieved after retrying the archive hosts and referrers.", status: upstreamStatus, detail: lastFailure },
        { status: upstreamStatus === 404 ? 404 : 502 },
      );
    }
    const outHeaders = new Headers();
    outHeaders.set("Content-Type", mediaContentType(target.pathname, upstream.headers.get("content-type")));
    outHeaders.set("Cache-Control", fresh ? "no-store" : "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
    outHeaders.set("Accept-Ranges", upstream.headers.get("accept-ranges") ?? "bytes");
    outHeaders.set("X-Content-Type-Options", "nosniff");
    for (const name of ["content-length", "content-range", "last-modified", "etag"]) {
      const value = upstream.headers.get(name);
      if (value) outHeaders.set(name, value);
    }
    return new NextResponse(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers: outHeaders });
  } catch (error) {
    return NextResponse.json({ error: "Could not retrieve the media file.", detail: error instanceof Error ? error.message : "Unknown media proxy error." }, { status: 502 });
  }
}
export async function GET(request: Request) { return handle(request); }
export async function HEAD(request: Request) { return handle(request); }
