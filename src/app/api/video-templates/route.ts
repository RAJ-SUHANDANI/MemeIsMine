import { NextResponse } from "next/server";
import videoCatalog from "@/data/indian-video-templates.json";

export const revalidate = 3600;
const SITE = "https://indianmemetemplates.com";
type MediaKind = "gif" | "video";
type VideoTemplate = {
  id: string;
  name: string;
  url: string;
  posterUrl: string;
  width: number;
  height: number;
  box_count: number;
  category: string;
  description: string;
  source: "indianmemetemplates";
  originalUrl: string;
  mediaType: MediaKind;
  publishedAt: string | null;
  trending: boolean;
  popularity: number;
};
function decodeEntities(value: string): string {
  return value.replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
}
function plainText(value: string): string {
  return decodeEntities(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
function attr(tag: string, name: string): string | null {
  const single = tag.match(new RegExp("\\b" + name + "\\s*=\\s*'([^']*)'", "i"));
  if (single) return decodeEntities(single[1].trim());
  const double = tag.match(new RegExp("\\b" + name + "\\s*=\\s*\"([^\"]*)\"", "i"));
  return double?.[1] ? decodeEntities(double[1].trim()) : null;
}
function allowedSourceUrl(raw: string | null, base = SITE): string | null {
  if (!raw) return null;
  try {
    const value = new URL(raw, base);
    if (value.protocol !== "https:" || !["indianmemetemplates.com", "www.indianmemetemplates.com"].includes(value.hostname)) return null;
    if (!/\/wp-content\/uploads\//i.test(value.pathname)) return null;
    return value.toString();
  } catch { return null; }
}
function mediaType(url: string): MediaKind | null {
  const path = new URL(url).pathname.toLowerCase();
  if (path.endsWith(".gif")) return "gif";
  if (/\.(mp4|webm|mov|m4v|ogv)$/.test(path)) return "video";
  return null;
}
function extractPoster(html: string, base: string): string | null {
  const meta = html.match(/<meta\b(?=[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'])[^>]*>/i)?.[0];
  const metaUrl = meta ? attr(meta, "content") : null;
  if (metaUrl) {
    try {
      const u = new URL(metaUrl, base);
      if (u.protocol === "https:" && ["indianmemetemplates.com", "www.indianmemetemplates.com"].includes(u.hostname)) return u.toString();
    } catch { /* Try the page images instead. */ }
  }
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const raw = attr(tag, "data-src") ?? attr(tag, "data-lazy-src") ?? attr(tag, "data-original") ?? attr(tag, "src");
    if (!raw) continue;
    try {
      const u = new URL(raw, base);
      if (u.protocol === "https:" && ["indianmemetemplates.com", "www.indianmemetemplates.com"].includes(u.hostname) && /\/wp-content\/uploads\//i.test(u.pathname) && !/\.(gif|mp4|webm|mov|m4v|ogv)$/i.test(u.pathname)) return u.toString();
    } catch { /* Skip malformed image URLs. */ }
  }
  return null;
}
function extractMedia(html: string, base: string): { url: string; kind: MediaKind } | null {
  const candidates: string[] = [];
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const property = attr(tag, "property") ?? attr(tag, "name") ?? "";
    if (/og:video|twitter:player:stream|video:url/i.test(property)) {
      const value = attr(tag, "content");
      if (value) candidates.push(value);
    }
  }
  for (const tag of html.match(/<(?:video|source|a)\b[^>]*>/gi) ?? []) {
    const value = attr(tag, "src") ?? attr(tag, "href");
    if (value && /\.(gif|mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i.test(value)) candidates.push(value);
  }
  for (const value of html.match(/https?:[^\s"'<>\\]+?\.(?:gif|mp4|webm|mov|m4v|ogv)(?:\?[^\s"'<>\\]*)?/gi) ?? []) candidates.push(value.replace(/&amp;/g, "&"));
  const unique = [...new Set(candidates)];
  const found: { url: string; kind: MediaKind }[] = [];
  for (const raw of unique) {
    const safe = allowedSourceUrl(decodeEntities(raw), base);
    if (!safe) continue;
    const kind = mediaType(safe);
    if (kind && !found.some((item) => item.url === safe)) found.push({ url: safe, kind });
  }
  return found.find((item) => item.kind === "video") ?? found.find((item) => item.kind === "gif") ?? null;
}
function extractPosts(html: string): { id: string; name: string; originalUrl: string; posterUrl: string | null; index: number }[] {
  const articles = html.match(/<article\b[\s\S]*?<\/article>/gi) ?? [];
  const blocks = articles.length ? articles : html.split(/(?=<h[1-3]\b)/i).slice(1);
  const posts: { id: string; name: string; originalUrl: string; posterUrl: string | null; index: number }[] = [];
  for (const block of blocks) {
    const heading = block.match(/<h[1-3]\b[^>]*>[\s\S]*?<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[1-3]>/i);
    if (!heading) continue;
    let url: URL;
    try { url = new URL(decodeEntities(heading[2]), SITE); } catch { continue; }
    if (url.protocol !== "https:" || !["indianmemetemplates.com", "www.indianmemetemplates.com"].includes(url.hostname)) continue;
    if (url.pathname.startsWith("/category/") || url.pathname.startsWith("/tag/")) continue;
    const name = plainText(heading[3]);
    const id = url.pathname.split("/").filter(Boolean).pop();
    if (!name || !id || posts.some((item) => item.id === id)) continue;
    posts.push({ id, name, originalUrl: url.toString(), posterUrl: extractPoster(block, SITE), index: posts.length });
  }
  return posts;
}
function publicTemplate(item: VideoTemplate) {
  const { source: _source, originalUrl: _originalUrl, ...publicItem } = item;
  return publicItem;
}
function parseRobots(text: string): { agents: string[]; rules: { type: string; path: string }[]; rulesStarted: boolean }[] {
  const groups: { agents: string[]; rules: { type: string; path: string }[]; rulesStarted: boolean }[] = [];
  let group: { agents: string[]; rules: { type: string; path: string }[]; rulesStarted: boolean } | null = null;
  for (const row of text.split(/\r?\n/)) {
    const line = row.split("#")[0].trim(); const colon = line.indexOf(":"); if (!line || colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase(); const value = line.slice(colon + 1).trim();
    if (key === "user-agent") {
      if (!group || group.rulesStarted) { group = { agents: [], rules: [], rulesStarted: false }; groups.push(group); }
      group.agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && group) { group.rulesStarted = true; group.rules.push({ type: key, path: value }); }
  }
  return groups;
}
let robotsCache: Promise<ReturnType<typeof parseRobots>> | null = null;
async function crawlAllowed(path: string): Promise<boolean> {
  try {
    robotsCache ??= (async () => {
      const response = await fetch(SITE + "/robots.txt", { headers: { "User-Agent": "MemeIsMineVideoIndex/1.0", "Accept": "text/plain,*/*" }, next: { revalidate: 21600 }, signal: AbortSignal.timeout(8000) });
      if (response.status === 404) return [];
      if (!response.ok) throw new Error("Robots rules unavailable");
      return parseRobots(await response.text());
    })();
    const groups = await robotsCache;
    const specific = groups.filter((item) => item.agents.some((agent) => agent !== "*" && "memeisminevideoindex".startsWith(agent)));
    const applicable = specific.length ? specific : groups.filter((item) => item.agents.includes("*"));
    const rules = applicable.flatMap((item) => item.rules).filter((rule) => rule.path && (rule.path === "/" || rule.path === path || path.startsWith(rule.path)));
    rules.sort((a, b) => b.path.length - a.path.length || (a.type === "allow" ? -1 : 1));
    return rules[0]?.type !== "disallow";
  } catch { return false; }
}
async function fetchSource(url: string): Promise<Response> {
  if (!await crawlAllowed(new URL(url).pathname)) throw new Error("The source site's crawl rules do not permit this request.");
  return fetch(url, { headers: { "User-Agent": "MemeIsMineVideoIndex/1.0", "Accept": "text/html,application/xhtml+xml" }, next: { revalidate: 21600 }, signal: AbortSignal.timeout(12000) });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const slug = (params.get("slug") ?? "").trim().replace(/^\/+|\/+$/g, "");
  const query = (params.get("q") ?? "").trim().slice(0, 120).toLowerCase();
  const sort = params.get("sort") ?? "popular";
  const page = Math.min(500, Math.max(1, Math.floor(Number(params.get("page") ?? 1) || 1)));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(params.get("limit") ?? 24) || 24)));
  const catalog = (videoCatalog as VideoTemplate[]).filter((item) => {
    const path = (() => { try { return new URL(item.url).pathname.toLowerCase(); } catch { return ""; } })();
    return item.mediaType === "gif" ? path.endsWith(".gif") : item.mediaType === "video" && /\.(mp4|webm|mov|m4v|ogv)$/.test(path);
  });

  if (slug) {
    const item = catalog.find((template) => template.id === slug);
    const refreshSource = params.get("refresh") === "1";
    if (item && !refreshSource) return NextResponse.json({ success: true, template: publicTemplate(item) }, { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } });
    if (!/^[a-zA-Z0-9%._~!$&'()*+,;=:@-]+$/.test(slug) || slug.includes("..")) return NextResponse.json({ success: false, error: "Invalid template slug." }, { status: 400 });
    try {
      const originalUrl = item?.originalUrl ?? SITE + "/" + slug + "/";
      const response = await fetchSource(originalUrl);
      if (!response.ok) {
        if (item) return NextResponse.json({ success: true, template: publicTemplate(item), refreshUnavailable: true }, { headers: { "Cache-Control": "no-store" } });
        return NextResponse.json({ success: false, error: "Template page is unavailable.", status: response.status }, { status: 502 });
      }
      const html = await response.text();
      const media = extractMedia(html, originalUrl);
      if (!media) {
        if (item) return NextResponse.json({ success: true, template: publicTemplate(item), refreshUnavailable: true }, { headers: { "Cache-Control": "no-store" } });
        return NextResponse.json({ success: false, error: "This page does not expose a direct GIF/video file. Static images are not listed in this collection." }, { status: 404 });
      }
      const posterUrl = extractPoster(html, originalUrl) ?? (media.kind === "gif" ? media.url : item?.posterUrl ?? "");
      const template: VideoTemplate = {
        ...(item ?? {
          id: slug,
          name: plainText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? slug.replace(/-/g, " ")),
          width: 0, height: 0, box_count: 2, category: "Video Memes",
          description: "Animate your own text and export a new video from the browser.",
          source: "indianmemetemplates" as const, publishedAt: null, trending: false, popularity: 0,
        }),
        url: media.url, posterUrl, originalUrl, mediaType: media.kind,
      };
      return NextResponse.json({ success: true, template: publicTemplate(template) }, { headers: { "Cache-Control": refreshSource ? "no-store" : "public, s-maxage=21600, stale-while-revalidate=86400" } });
    } catch (error) {
      if (item) return NextResponse.json({ success: true, template: publicTemplate(item), refreshUnavailable: true }, { headers: { "Cache-Control": "no-store" } });
      return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Could not load this template." }, { status: 502 });
    }
  }

  let items = catalog.filter((item) => !query || item.name.toLowerCase().includes(query));
  if (sort === "trending") items = [...items].sort((a, b) => Number(b.trending) - Number(a.trending) || b.popularity - a.popularity);
  else if (sort === "recent") items = [...items].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || b.popularity - a.popularity);
  else if (sort === "name") items = [...items].sort((a, b) => a.name.localeCompare(b.name));
  else items = [...items].sort((a, b) => b.popularity - a.popularity);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const results = items.slice((page - 1) * limit, page * limit);
  return NextResponse.json({
    success: true, collection: "video-templates",
    query: query || null, sort, page, limit, count: results.length, totalItems, totalPages,
    hasPreviousPage: page > 1, hasNextPage: page < totalPages,
    templates: results.map(publicTemplate),
    syncedAt: null,
  }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
