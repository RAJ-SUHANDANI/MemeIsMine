import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SITE = "https://indianmemetemplates.com";
const ARCHIVE = SITE + "/meme-templates/";
const USER_AGENT = "MemeIsMineTemplateIndex/1.0 (+https://github.com/RAJ-SUHANDANI/MemeIsMine)";
const OUTPUT = resolve("src/data/indian-meme-templates.json");
const DELAY_MS = 1000;
const MAX_PAGES = 500;
const VERIFY_CONCURRENCY = 5;
const VERIFY_DELAY_MS = 300;

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

function decodeEntities(value) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}
function plainText(value) {
  return decodeEntities(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
function attr(tag, name) {
  const singleQuoted = tag.match(new RegExp("\\b" + name + "\\s*=\\s*'([^']*)'", "i"));
  if (singleQuoted) return decodeEntities(singleQuoted[1].trim());
  const doubleQuoted = tag.match(new RegExp("\\b" + name + "\\s*=\\s*\"([^\"]*)\"", "i"));
  return doubleQuoted?.[1] ? decodeEntities(doubleQuoted[1].trim()) : null;
}
function siteUrl(raw, base = SITE) {
  if (!raw) return null;
  try {
    const value = new URL(raw, base);
    if (value.protocol !== "https:" || !["indianmemetemplates.com", "www.indianmemetemplates.com"].includes(value.hostname)) return null;
    return value.toString();
  } catch { return null; }
}
function imageUrl(block) {
  const candidates = [];
  const tags = block.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const raw = attr(tag, "data-src") ?? attr(tag, "data-lazy-src") ?? attr(tag, "data-original") ?? attr(tag, "src");
    const safe = siteUrl(raw);
    if (safe && /\/wp-content\/uploads\//i.test(new URL(safe).pathname) && !/dummyimage|pixel\.(?:gif|png)|blank\.(?:gif|png)/i.test(safe)) candidates.push(safe);
    const srcset = attr(tag, "data-srcset") ?? attr(tag, "srcset");
    if (srcset) {
      for (const item of srcset.split(",")) {
        const candidate = item.trim().split(/\s+/)[0];
        const fromSet = siteUrl(candidate ?? null);
        if (fromSet && /\/wp-content\/uploads\//i.test(new URL(fromSet).pathname)) candidates.push(fromSet);
      }
    }
  }
  for (const tag of block.match(/<(?:a|source|video)\b[^>]*>/gi) ?? []) {
    const raw = attr(tag, "href") ?? attr(tag, "src") ?? attr(tag, "data-src");
    if (!raw || !/\.gif(?:[?#]|$)/i.test(raw)) continue;
    const safe = siteUrl(raw);
    if (safe && /\/wp-content\/uploads\//i.test(new URL(safe).pathname)) candidates.push(safe);
  }
  for (const raw of block.match(/https?:[^\s"'<>\\]+?\.gif(?:\?[^\s"'<>\\]*)?/gi) ?? []) {
    const safe = siteUrl(raw.replace(/&amp;/g, "&"));
    if (safe && /\/wp-content\/uploads\//i.test(new URL(safe).pathname)) candidates.push(safe);
  }
  const unique = [...new Set(candidates)];
  return unique.find((url) => new URL(url).pathname.toLowerCase().endsWith(".gif")) ?? unique[0] ?? null;
}
function extractAnimatedMedia(html, base) {
  const candidates = [];
  for (const tag of html.match(/<(?:video|source|a)\b[^>]*>/gi) ?? []) {
    const raw = attr(tag, "src") ?? attr(tag, "href") ?? attr(tag, "data-src");
    if (raw && /\.(?:gif|mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i.test(raw)) candidates.push(raw);
  }
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const property = attr(tag, "property") ?? attr(tag, "name") ?? "";
    if (/og:video|twitter:player:stream|video:url/i.test(property)) {
      const raw = attr(tag, "content");
      if (raw) candidates.push(raw);
    }
  }
  for (const raw of html.match(/https?:[^\s"'<>\\]+?\.(?:gif|mp4|webm|mov|m4v|ogv)(?:\?[^\s"'<>\\]*)?/gi) ?? []) candidates.push(raw.replace(/&amp;/g, "&"));
  const found = [];
  for (const raw of candidates) {
    const safe = siteUrl(raw, base);
    if (!safe || !new URL(safe).pathname.toLowerCase().includes("/wp-content/uploads/")) continue;
    const ext = new URL(safe).pathname.toLowerCase().split(".").pop();
    const type = ext === "gif" ? "gif" : ["mp4", "webm", "mov", "m4v", "ogv"].includes(ext ?? "") ? "video" : null;
    if (type && !found.some((item) => item.url === safe)) found.push({ url: safe, type });
  }
  return found.find((item) => item.type === "video") ?? found.find((item) => item.type === "gif") ?? null;
}
function hasEmbeddedVideo(html) {
  return /<video\b/i.test(html)
    || /<source\b[^>]*src\s*=\s*["'][^"']+\.(?:mp4|webm|mov|m4v|ogv|gif)(?:[?#"']|$)/i.test(html)
    || /<meta\b(?=[^>]*(?:property|name)=["'](?:og:video|twitter:player:stream|video:url)["'])/i.test(html)
    || /<iframe\b[^>]*src\s*=\s*["'][^"']*(?:youtube\.com\/embed|youtu\.be\/|vimeo\.com\/video|dailymotion\.com\/embed)/i.test(html);
}
function parseCards(html) {
  const articles = html.match(/<article\b[\s\S]*?<\/article>/gi) ?? [];
  const blocks = articles.length ? articles : html.split(/(?=<h2\b|<h3\b)/i).slice(1);
  const found = new Map();
  for (const block of blocks) {
    const heading = block.match(/<h[1-3]\b[^>]*>[\s\S]*?<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[1-3]>/i);
    if (!heading) continue;
    const originalUrl = siteUrl(decodeEntities(heading[2]));
    const name = plainText(heading[3]);
    if (!originalUrl || !name || originalUrl.includes("/category/") || originalUrl.includes("/tag/")) continue;
    const image = imageUrl(block);
    if (!image) continue;
    const id = new URL(originalUrl).pathname.split("/").filter(Boolean).pop();
    if (!id || found.has(id)) continue;
    found.set(id, {
      id, name, url: image, width: 0, height: 0, box_count: 2,
      category: "Indian Memes",
      description: "Open the original page for template details and download options.",
      source: "indianmemetemplates",
      originalUrl,
      publishedAt: block.match(/<time\\b[^>]*datetime=["']([^"']+)["']/i)?.[1] ?? null,
      trending: false,
      popularity: 0,
    });
  }
  return [...found.values()];
}
function discoverPageCount(html) {
  const patterns = [
    /\/meme-templates\/page\/(\d+)\//g,
    /href=["'][^"']*\/page\/(\d+)\/(?:\?[^"']*)?["']/g,
    /page-numbers[^>]*>\s*(\d+)\s*</gi,
  ];
  const candidates = [];
  for (const pattern of patterns) for (const match of html.matchAll(pattern)) {
    const number = Number(match[1]);
    if (Number.isInteger(number) && number > 0 && number <= MAX_PAGES) candidates.push(number);
  }
  return candidates.length ? Math.max(...candidates) : null;
}
function parseRobots(text) {
  const groups = [];
  let group = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === "user-agent") {
      if (!group || group.rulesStarted) { group = { agents: [], rules: [], rulesStarted: false }; groups.push(group); }
      group.agents.push(value.toLowerCase());
    } else if (key === "allow" || key === "disallow") {
      if (!group) continue;
      group.rulesStarted = true;
      group.rules.push({ type: key, path: value });
    }
  }
  return groups;
}
let robotsGroupsPromise;
async function loadRobotsGroups() {
  if (!robotsGroupsPromise) {
    robotsGroupsPromise = (async () => {
      let response;
      try {
        response = await fetch(SITE + "/robots.txt", {
          headers: { "User-Agent": USER_AGENT, "Accept": "text/plain,*/*" },
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        throw new Error("Could not verify the source site's robots.txt; stopping rather than crawling without the rules.");
      }
      if (response.status === 404) return [];
      if (!response.ok) throw new Error("Could not read robots.txt (HTTP " + response.status + "); stopping the sync.");
      return parseRobots(await response.text());
    })();
  }
  return robotsGroupsPromise;
}
async function checkRobots(path) {
  const groups = await loadRobotsGroups();
  const specific = groups.filter((item) => item.agents.some((agent) => agent !== "*" && USER_AGENT.toLowerCase().startsWith(agent)));
  const applicable = specific.length ? specific : groups.filter((item) => item.agents.includes("*"));
  const rules = applicable.flatMap((item) => item.rules).filter((rule) => rule.path && (rule.path === "/" || rule.path === path || path.startsWith(rule.path)));
  rules.sort((a, b) => b.path.length - a.path.length || (a.type === "allow" ? -1 : 1));
  if (rules[0]?.type === "disallow") throw new Error("robots.txt disallows crawling " + path + "; sync stopped.");
}
async function fetchPage(url, path) {
  await checkRobots(path);
  let lastError;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml" },
        signal: AbortSignal.timeout(20000),
      });
      if (response.ok) return await response.text();
      if (response.status === 404) throw new Error("Archive page returned 404: " + url);
      if (response.status === 429 || response.status >= 500) {
        const retrySeconds = Number(response.headers.get("retry-after") ?? 0);
        await sleep(Math.max(retrySeconds * 1000, 4000 * (attempt + 1)));
        lastError = new Error("HTTP " + response.status + " for " + url);
        continue;
      }
      throw new Error("HTTP " + response.status + " for " + url);
    } catch (error) {
      lastError = error;
      if (attempt < 4) await sleep(1500 * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not retrieve " + url);
}
function archiveUrl(page) {
  return page === 1 ? ARCHIVE : ARCHIVE + "page/" + page + "/";
}

async function main() {
  console.log("Checking source crawl rules and reading archive page 1...");
  let previouslyVerifiedIds = new Set();
  try {
    const previousCatalog = JSON.parse(await readFile(OUTPUT, "utf8"));
    previouslyVerifiedIds = new Set(previousCatalog.filter((item) => item.mediaType === "still-image").map((item) => item.id));
  } catch { /* First run: source media for each template will be verified. */ }
  const firstHtml = await fetchPage(ARCHIVE, "/meme-templates/");
  const totalPages = discoverPageCount(firstHtml) ?? 170;
  if (totalPages > MAX_PAGES) throw new Error("The archive advertises more than " + MAX_PAGES + " pages; stopping for manual review.");
  if (!parseCards(firstHtml).length) throw new Error("Could not parse template cards from page 1. No catalog file was overwritten.");
  const all = new Map();
  const videoCatalogPath = resolve("src/data/indian-video-templates.json");
  let videoCatalog = [];
  let videoSlugs = new Set();
  let videoPages = new Set();
  let videoPosters = new Set();
  const discoveredGifs = new Map();
  try {
    videoCatalog = JSON.parse(await readFile(videoCatalogPath, "utf8"));
    videoSlugs = new Set(videoCatalog.map((item) => item.id));
    videoPages = new Set(videoCatalog.map((item) => item.originalUrl).filter(Boolean).map((value) => value.replace(/\/+$/, "").toLowerCase()));
    videoPosters = new Set(videoCatalog.map((item) => item.posterUrl).filter(Boolean).map((value) => value.split("?")[0].toLowerCase()));
  } catch { console.warn("Video catalog is not available yet; image catalog will be collected without cross filtering."); }
  let trendingIds = new Set();
  let popularRanks = new Map();
  try {
    const trendingHtml = await fetchPage(SITE + "/category/trending/", "/category/trending/");
    trendingIds = new Set(parseCards(trendingHtml).map((item) => item.id));
  } catch (error) { console.warn("Trending list unavailable: " + (error instanceof Error ? error.message : "request failed")); }
  try {
    const homeHtml = await fetchPage(SITE + "/", "/");
    parseCards(homeHtml).forEach((item, index) => popularRanks.set(item.id, Math.max(1, 1000 - index)));
  } catch (error) { console.warn("Homepage popularity list unavailable: " + (error instanceof Error ? error.message : "request failed")); }
  const append = (cards) => cards.forEach((card) => {
    if (isClearlyVideoPost(card) || videoPages.has(card.originalUrl.replace(/\/+$/, "").toLowerCase()) || videoPosters.has(card.url.split("?")[0].toLowerCase())) return;
    const isGif = /\.gif(?:[?#]|$)/i.test(card.url);
    if (isGif) {
      discoveredGifs.set(card.id, {
        ...card, posterUrl: card.url, mediaType: "gif", category: "Video Memes",
        publishedAt: card.publishedAt ?? null, trending: trendingIds.has(card.id),
        popularity: popularRanks.get(card.id) ?? (trendingIds.has(card.id) ? 100 : 0),
      });
      return;
    }
    if (!videoSlugs.has(card.id)) all.set(card.id, {
      ...card,
      trending: trendingIds.has(card.id),
      popularity: popularRanks.get(card.id) ?? (trendingIds.has(card.id) ? 100 : 0),
    });
  });
  append(parseCards(firstHtml));
  console.log("Archive pages discovered: " + totalPages + "; page 1 yielded " + all.size + " templates.");
  for (let page = 2; page <= totalPages; page++) {
    await sleep(DELAY_MS);
    const url = archiveUrl(page);
    const html = await fetchPage(url, new URL(url).pathname);
    const cards = parseCards(html);
    if (!cards.length) {
      console.warn("Page " + page + " yielded no parseable cards. Continuing because the source can have uneven pages.");
    } else {
      append(cards);
    }
    if (page % 10 === 0 || page === totalPages) console.log("Scanned " + page + "/" + totalPages + " pages; collected " + all.size + " unique template records.");
  }
  if (all.size < 100) throw new Error("Only " + all.size + " records were collected. Refusing to replace the catalog with an incomplete result.");
  const rawRecords = [...all.values()];
  const unverified = rawRecords.filter((item) => !previouslyVerifiedIds.has(item.id));
  const rejectedVideoIds = new Set();
  const discoveredPageVideos = new Map();
  let verifyCursor = 0;
  console.log("Verifying original post media for " + unverified.length + " previously unchecked image candidates (concurrency " + VERIFY_CONCURRENCY + ").");
  await Promise.all(Array.from({ length: Math.min(VERIFY_CONCURRENCY, unverified.length) }, async () => {
    while (verifyCursor < unverified.length) {
      const index = verifyCursor++;
      const item = unverified[index];
      await sleep(VERIFY_DELAY_MS);
      try {
        const sourcePath = new URL(item.originalUrl).pathname;
        const pageHtml = await fetchPage(item.originalUrl, sourcePath);
        const media = extractAnimatedMedia(pageHtml, item.originalUrl);
        if (media || hasEmbeddedVideo(pageHtml)) {
          rejectedVideoIds.add(item.id);
          if (media) discoveredPageVideos.set(item.id, {
            id: item.id, name: item.name, url: media.url, posterUrl: item.url,
            width: 0, height: 0, box_count: 2, category: "Video Memes",
            description: "Add your own captions and export a video in the browser.",
            source: "indianmemetemplates", originalUrl: item.originalUrl,
            mediaType: media.type, publishedAt: item.publishedAt ?? null,
            trending: item.trending ?? false, popularity: item.popularity ?? 0,
          });
        } else {
          previouslyVerifiedIds.add(item.id);
        }
      } catch (error) {
        // Keep the candidate for this run, but do not mark it verified: a future sync retries it.
        console.warn("Could not verify original media for " + item.id + "; retaining temporarily and retrying on a later sync: " + (error instanceof Error ? error.message : "request failed"));
      }
      if ((index + 1) % 100 === 0 || index + 1 === unverified.length) console.log("Verified " + (index + 1) + "/" + unverified.length + " image candidates; excluded " + rejectedVideoIds.size + " video/animated posts.");
    }
  }));
  const records = rawRecords
    .filter((item) => !rejectedVideoIds.has(item.id))
    .map((item) => ({ ...item, mediaType: "still-image" }));
  if (records.length < 100) throw new Error("Only " + records.length + " verified still images remain. Refusing to overwrite the catalog.");
  const videosById = new Map(videoCatalog.map((item) => [item.id, item]));
  for (const [id, item] of discoveredPageVideos) if (!videosById.has(id)) videosById.set(id, item);
  for (const [id, gif] of discoveredGifs) videosById.set(id, gif);
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(records, null, 2) + "\n", "utf8");
  await writeFile(videoCatalogPath, JSON.stringify([...videosById.values()], null, 2) + "\n", "utf8");
  console.log("Saved " + records.length + " verified still image templates; excluded " + rejectedVideoIds.size + " pages with video or animated media and promoted " + (discoveredGifs.size + discoveredPageVideos.size) + " native animated/video templates. Media files were not downloaded or copied.");
}
main().catch((error) => {
  console.error("Template catalog sync failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
