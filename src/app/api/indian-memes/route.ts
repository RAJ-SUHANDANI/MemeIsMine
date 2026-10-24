import snapshotData from "@/data/indian-meme-templates.json";
import { NextResponse } from "next/server";

const SITE = "https://indianmemetemplates.com";
const ARCHIVE = SITE + "/meme-templates/";
const USER_AGENT = "MemeIsMineTemplateIndex/1.0";

type IndianTemplate = {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
  category: string;
  description: string;
  source: "indianmemetemplates";
  originalUrl: string;
  publishedAt?: string | null;
  trending?: boolean;
  popularity?: number;
};

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)));
}
function plainText(value: string): string {
  return decodeEntities(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
function attr(tag: string, name: string): string | null {
  const singleQuoted = tag.match(new RegExp("\\b" + name + "\\s*=\\s*'([^']*)'", "i"));
  if (singleQuoted) return decodeEntities(singleQuoted[1].trim());
  const doubleQuoted = tag.match(new RegExp("\\b" + name + "\\s*=\\s*\"([^\"]*)\"", "i"));
  return doubleQuoted?.[1] ? decodeEntities(doubleQuoted[1].trim()) : null;
  return match?.[2] ? decodeEntities(match[2].trim()) : null;
}
function allowedSiteUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw, SITE);
    if (url.protocol !== "https:" || !["indianmemetemplates.com", "www.indianmemetemplates.com"].includes(url.hostname)) return null;
    return url.toString();
  } catch { return null; }
}
function getImageUrl(block: string): string | null {
  const tags = block.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const raw = attr(tag, "data-src") ?? attr(tag, "data-lazy-src") ?? attr(tag, "data-original") ?? attr(tag, "src");
    const safe = allowedSiteUrl(raw);
    if (safe && /\/wp-content\/uploads\//i.test(new URL(safe).pathname) && !/dummyimage|pixel\.(?:gif|png)|blank\.(?:gif|png)/i.test(safe)) return safe;
    const srcset = attr(tag, "data-srcset") ?? attr(tag, "srcset");
    if (srcset) {
      const candidate = srcset.split(",").map((item) => item.trim().split(/\s+/)[0]).find((item) => /\/wp-content\/uploads\//i.test(item));
      const srcsetUrl = allowedSiteUrl(candidate ?? null);
      if (srcsetUrl) return srcsetUrl;
    }
  }
  return null;
}
function extractCards(html: string): IndianTemplate[] {
  const articles = html.match(/<article\b[\s\S]*?<\/article>/gi) ?? [];
  const blocks = articles.length ? articles : html.split(/(?=<h2\b|<h3\b)/i).slice(1);
  const found = new Map<string, IndianTemplate>();
  for (const block of blocks) {
    const heading = block.match(/<h[1-3]\b[^>]*>[\s\S]*?<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[1-3]>/i);
    if (!heading) continue;
    const originalUrl = allowedSiteUrl(decodeEntities(heading[2]));
    const name = plainText(heading[3]);
    if (!originalUrl || !name || originalUrl.includes("/category/") || originalUrl.includes("/tag/")) continue;
    const image = getImageUrl(block);
    if (!image) continue;
    const slug = new URL(originalUrl).pathname.split("/").filter(Boolean).pop();
    if (!slug || found.has(slug)) continue;
    found.set(slug, {
      id: slug, name, url: image, width: 0, height: 0, box_count: 2,
      category: "Indian Memes", description: "Open the original page for template details and download options.",
      source: "indianmemetemplates", originalUrl,
    });
  }
  return [...found.values()];
}
function totalPagesFrom(html: string, fallback: number): number {
  const patterns = [
    /\/meme-templates\/page\/(\d+)\//g,
    /href=["'][^"']*\/page\/(\d+)\/(?:\?[^"']*)?["']/g,
    /page-numbers[^>]*>\s*(\d+)\s*</gi,
    /of\s+(\d+)\s*[-–]?\s*(?:pages|results)/gi,
  ];
  const candidates: number[] = [];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const value = Number(match[1]);
      if (Number.isInteger(value) && value > 0 && value <= 5000) candidates.push(value);
    }
  }
  return candidates.length ? Math.max(...candidates) : fallback;
}
function archiveUrl(page: number, query: string, sort: string): string {
  if (query) {
    const url = new URL(page <= 1 ? "/" : "/page/" + page + "/", SITE);
    url.searchParams.set("s", query);
    return url.toString();
  }
  if (sort === "trending") return page <= 1 ? SITE + "/category/trending/" : SITE + "/category/trending/page/" + page + "/";
  return page <= 1 ? ARCHIVE : ARCHIVE + "page/" + page + "/";
}
let robotsRulesCache: Promise<{ agents: string[]; rules: { type: string; path: string }[] }[]> | null = null;
async function robotsRules() {
  if (!robotsRulesCache) {
    robotsRulesCache = (async () => {
      const response = await fetch(SITE + "/robots.txt", {
        headers: { "User-Agent": USER_AGENT, "Accept": "text/plain,*/*" },
        next: { revalidate: 21600 },
        signal: AbortSignal.timeout(8000),
      });
      if (response.status === 404) return [];
      if (!response.ok) throw new Error("The source robots.txt could not be checked.");
      const groups: { agents: string[]; rules: { type: string; path: string }[]; rulesStarted: boolean }[] = [];
      let group: { agents: string[]; rules: { type: string; path: string }[]; rulesStarted: boolean } | null = null;
      for (const rawLine of (await response.text()).split(/\\r?\\n/)) {
        const line = rawLine.split("#")[0].trim();
        const colon = line.indexOf(":");
        if (!line || colon < 0) continue;
        const key = line.slice(0, colon).trim().toLowerCase();
        const value = line.slice(colon + 1).trim();
        if (key === "user-agent") {
          if (!group || group.rulesStarted) { group = { agents: [], rules: [], rulesStarted: false }; groups.push(group); }
          group.agents.push(value.toLowerCase());
        } else if ((key === "allow" || key === "disallow") && group) {
          group.rulesStarted = true;
          group.rules.push({ type: key, path: value });
        }
      }
      return groups;
    })();
  }
  return robotsRulesCache;
}
async function isCrawlAllowed(path: string): Promise<boolean> {
  try {
    const groups = await robotsRules();
    const token = USER_AGENT.toLowerCase().split(/[\\s/]/)[0];
    const specific = groups.filter((item) => item.agents.some((agent) => agent !== "*" && token.startsWith(agent)));
    const applicable = specific.length ? specific : groups.filter((item) => item.agents.includes("*"));
    const rules = applicable.flatMap((item) => item.rules).filter((rule) => rule.path && rule.path !== "" && (rule.path === "/" || path === rule.path || path.startsWith(rule.path)));
    rules.sort((a, b) => b.path.length - a.path.length || (a.type === "allow" ? -1 : 1));
    return rules[0]?.type !== "disallow";
  } catch {
    return false;
  }
}

async function fetchHtml(url: string): Promise<{ html: string; response: Response }> {
  if (!await isCrawlAllowed(new URL(url).pathname)) throw new Error("Source crawl rules do not permit access right now.");
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml" },
    next: { revalidate: 21600 },
    signal: AbortSignal.timeout(12000),
  });
  const html = await response.text();
  return { html, response };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const slug = (params.get("slug") ?? "").trim().replace(/^\/+|\/+$/g, "");
  const query = (params.get("q") ?? "").trim().slice(0, 120);
  const sort = params.get("sort") ?? "popular";
  const page = Math.min(500, Math.max(1, Math.floor(Number(params.get("page") ?? 1) || 1)));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(params.get("limit") ?? 24) || 24)));
  const snapshot = snapshotData as IndianTemplate[];

  try {
    if (slug) {
      const localMatch = snapshot.find((item) => item.id === slug);
      if (localMatch) {
        return NextResponse.json({ success: true, source: "indianmemetemplates", meme: localMatch }, { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } });
      }
      if (!/^[a-zA-Z0-9%._~!$&'()*+,;=:@-]+$/.test(slug) || slug.includes("..")) {
        return NextResponse.json({ success: false, error: "Invalid template slug." }, { status: 400 });
      }
      const originalUrl = allowedSiteUrl(SITE + "/" + slug + "/");
      if (!originalUrl) return NextResponse.json({ success: false, error: "Invalid template slug." }, { status: 400 });
      const { html, response } = await fetchHtml(originalUrl);
      if (!response.ok) return NextResponse.json({ success: false, error: "The template source is temporarily unavailable.", status: response.status }, { status: 502 });
      const titleTag = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? html.match(/<meta\b[^>]*property=["']og:title["'][^>]*>/i)?.[0] ?? "";
      const metaImageTag = html.match(/<meta\b(?=[^>]*property=["']og:image["'])[^>]*>/i)?.[0] ?? html.match(/<meta\b(?=[^>]*name=["']twitter:image["'])[^>]*>/i)?.[0];
      const image = allowedSiteUrl(metaImageTag ? attr(metaImageTag, "content") : null) ?? getImageUrl(html);
      const name = plainText(titleTag) || slug.replace(/-/g, " ");
      if (!image) return NextResponse.json({ success: false, error: "No preview image was found on the source page." }, { status: 404 });
      const meme: IndianTemplate = {
        id: slug, name, url: image, width: 0, height: 0, box_count: 2,
        category: "Indian Memes", description: "Open the original page for template details and download options.",
        source: "indianmemetemplates", originalUrl,
      };
      return NextResponse.json({ success: true, source: "indianmemetemplates", meme }, { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } });
    }

    if (snapshot.length) {
      let filtered = query ? snapshot.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())) : [...snapshot];
      if (sort === "trending") {
        const trending = filtered.filter((item) => item.trending);
        if (trending.length) filtered = trending;
        filtered = [...filtered].sort((a, b) => Number(b.trending) - Number(a.trending) || (b.popularity ?? 0) - (a.popularity ?? 0));
      } else if (sort === "recent") {
        filtered = [...filtered].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
      } else if (sort === "popular") {
        filtered = [...filtered].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
      }
      const totalItems = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));
      const memes = filtered.slice((page - 1) * limit, page * limit);
      return NextResponse.json({
        success: true, source: "indianmemetemplates", collection: "synced-metadata",
        query: query || null, page, limit, count: memes.length, pageCount: memes.length,
        totalItems, totalPages, hasPreviousPage: page > 1, hasNextPage: page < totalPages,
        memes,
        attribution: { name: "Indian Meme Templates", url: SITE, note: "Preview images and original pages remain hosted by the source website." },
      }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
    }

    const url = archiveUrl(page, query, sort);
    const { html, response } = await fetchHtml(url);
    if (!response.ok) {
      return NextResponse.json({
        success: false, error: response.status === 429 ? "The template site is rate limiting requests. Please retry shortly." : "The template archive is temporarily unavailable.",
        status: response.status,
      }, { status: 502, headers: { "Retry-After": response.status === 429 ? "60" : "15" } });
    }
    const memes = extractCards(html);
    const title = plainText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const totalPages = totalPagesFrom(html, query ? 1 : sort === "trending" ? 5 : 170);
    if (!memes.length) {
      return NextResponse.json({ success: false, error: "No template cards were found on the source page.", page, totalPages, upstreamTitle: title }, { status: 502 });
    }
    const sliced = memes.slice(0, limit);
    return NextResponse.json({
      success: true,
      source: "indianmemetemplates",
      collection: query ? "search" : "meme-templates",
      query: query || null,
      page,
      limit,
      count: sliced.length,
      pageCount: memes.length,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
      memes: sliced,
      attribution: { name: "Indian Meme Templates", url: SITE, note: "Preview images and original pages remain hosted by the source website." },
    }, { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: "Could not reach the template archive right now.", detail }, { status: 502 });
  }
}
