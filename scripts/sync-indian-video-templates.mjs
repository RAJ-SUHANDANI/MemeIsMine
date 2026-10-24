import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SITE = "https://indianmemetemplates.com";
const ARCHIVE = SITE + "/category/videos/";
const OUTPUT = resolve("src/data/indian-video-templates.json");
const USER_AGENT = "MemeIsMineVideoIndex/1.0 (+https://github.com/RAJ-SUHANDANI/MemeIsMine)";
const DELAY_MS = 1250;
const MAX_PAGES = 40;
const MEDIA_EXT = /\.(gif|mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i;
const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

function decodeEntities(value) {
  return value.replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}
function plainText(value) {
  return decodeEntities(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
function attr(tag, name) {
  const single = tag.match(new RegExp("\\b" + name + "\\s*=\\s*'([^']*)'", "i"));
  if (single) return decodeEntities(single[1].trim());
  const double = tag.match(new RegExp("\\b" + name + "\\s*=\\s*\"([^\"]*)\"", "i"));
  return double?.[1] ? decodeEntities(double[1].trim()) : null;
}
function validSiteUrl(raw, base = SITE) {
  if (!raw) return null;
  try {
    const url = new URL(raw, base);
    if (url.protocol !== "https:" || !["indianmemetemplates.com", "www.indianmemetemplates.com"].includes(url.hostname)) return null;
    return url.toString();
  } catch { return null; }
}
function getPoster(block, base) {
  for (const tag of block.match(/<img\b[^>]*>/gi) ?? []) {
    const raw = attr(tag, "data-src") ?? attr(tag, "data-lazy-src") ?? attr(tag, "data-original") ?? attr(tag, "src");
    const url = validSiteUrl(raw, base);
    if (url && /\/wp-content\/uploads\//i.test(new URL(url).pathname) && !MEDIA_EXT.test(new URL(url).pathname)) return url;
  }
  return null;
}
function extractPosts(html) {
  const articles = html.match(/<article\b[\s\S]*?<\/article>/gi) ?? [];
  const blocks = articles.length ? articles : html.split(/(?=<h[1-3]\b)/i).slice(1);
  const posts = [];
  for (const block of blocks) {
    const heading = block.match(/<h[1-3]\b[^>]*>[\s\S]*?<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h[1-3]>/i);
    if (!heading) continue;
    const originalUrl = validSiteUrl(heading[2], SITE);
    const name = plainText(heading[3]);
    if (!originalUrl || !name || /\/category\/|\/tag\//i.test(new URL(originalUrl).pathname)) continue;
    const id = new URL(originalUrl).pathname.split("/").filter(Boolean).pop();
    if (!id || posts.some((post) => post.id === id)) continue;
    posts.push({ id, name, originalUrl, posterUrl: getPoster(block, SITE), index: posts.length });
  }
  return posts;
}
function getMediaCandidates(html, base) {
  const candidates = [];
  for (const tag of html.match(/<(?:video|source|a)\b[^>]*>/gi) ?? []) {
    const raw = attr(tag, "src") ?? attr(tag, "href") ?? attr(tag, "data-src");
    if (raw && MEDIA_EXT.test(raw)) candidates.push(raw);
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
    const safe = validSiteUrl(raw, base);
    if (!safe || !/\/wp-content\/uploads\//i.test(new URL(safe).pathname) || !MEDIA_EXT.test(new URL(safe).pathname)) continue;
    if (!found.some((item) => item.url === safe)) found.push({ url: safe, type: new URL(safe).pathname.toLowerCase().endsWith(".gif") ? "gif" : "video" });
  }
  return found;
}
function parseRobots(text) {
  const groups = []; let group = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split("#")[0].trim(); const colon = line.indexOf(":"); if (!line || colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase(); const value = line.slice(colon + 1).trim();
    if (key === "user-agent") {
      if (!group || group.rulesStarted) { group = { agents: [], rules: [], rulesStarted: false }; groups.push(group); }
      group.agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && group) { group.rulesStarted = true; group.rules.push({ type: key, path: value }); }
  }
  return groups;
}
let robotsPromise;
async function allowed(path) {
  try {
    robotsPromise ??= (async () => {
      const response = await fetch(SITE + "/robots.txt", { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(10000) });
      if (response.status === 404) return [];
      if (!response.ok) throw new Error("Could not read robots.txt");
      return parseRobots(await response.text());
    })();
    const groups = await robotsPromise;
    const specific = groups.filter((item) => item.agents.some((agent) => agent !== "*" && USER_AGENT.toLowerCase().startsWith(agent)));
    const selected = specific.length ? specific : groups.filter((item) => item.agents.includes("*"));
    const rules = selected.flatMap((item) => item.rules).filter((rule) => rule.path && (rule.path === "/" || rule.path === path || path.startsWith(rule.path)));
    rules.sort((a, b) => b.path.length - a.path.length || (a.type === "allow" ? -1 : 1));
    return rules[0]?.type !== "disallow";
  } catch { return false; }
}
async function fetchHtml(url) {
  const path = new URL(url).pathname;
  if (!await allowed(path)) throw new Error("The source site's robots rules do not permit " + path + ".");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml" }, signal: AbortSignal.timeout(20000) });
    if (response.ok) return await response.text();
    if (response.status === 404) throw new Error("Page not found: " + url);
    if (response.status !== 429 && response.status < 500) throw new Error("HTTP " + response.status + " for " + url);
    const retryAfter = Number(response.headers.get("retry-after") ?? 0);
    await sleep(Math.max(retryAfter * 1000, 3000 * (attempt + 1)));
  }
  throw new Error("The source site rate limited repeated requests for " + url);
}
function archiveUrl(page) { return page === 1 ? ARCHIVE : ARCHIVE + "page/" + page + "/"; }
function discoverPages(html) {
  const nums = [];
  for (const match of html.matchAll(/\/category\/videos\/page\/(\d+)\//g)) nums.push(Number(match[1]));
  return nums.length ? Math.max(...nums) : 10;
}
async function main() {
  console.log("Checking crawl rules and reading the video template archive.");
  const firstHtml = await fetchHtml(ARCHIVE);
  const totalPages = discoverPages(firstHtml);
  if (!extractPosts(firstHtml).length) throw new Error("No video archive items could be parsed. Catalog was not overwritten.");
  if (totalPages > MAX_PAGES) throw new Error("Unexpected archive size: " + totalPages);
  const posts = new Map();
  const addPosts = (items) => items.forEach((post) => posts.set(post.id, post));
  addPosts(extractPosts(firstHtml));
  for (let page = 2; page <= totalPages; page++) {
    await sleep(DELAY_MS);
    addPosts(extractPosts(await fetchHtml(archiveUrl(page))));
    console.log("Archive page " + page + "/" + totalPages + "; " + posts.size + " source pages indexed.");
  }
  const trendHtml = await fetchHtml(SITE + "/category/trending/");
  const trendingIds = new Set(extractPosts(trendHtml).map((post) => post.id));
  const results = [];
  let completed = 0;
  for (const post of posts.values()) {
    await sleep(DELAY_MS);
    try {
      const html = await fetchHtml(post.originalUrl);
      const media = getMediaCandidates(html, post.originalUrl);
      if (!media.length) continue;
      const ogTitle = html.match(/<meta\b(?=[^>]*property=["']og:title["'])[^>]*>/i)?.[0];
      const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
      const timeTag = html.match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1];
      const publishedMeta = html.match(/<meta\b(?=[^>]*(?:property|name)=["']article:published_time["'])[^>]*>/i)?.[0];
      const published = timeTag ?? (publishedMeta ? attr(publishedMeta, "content") : null);
      const name = plainText(heading ?? (ogTitle ? attr(ogTitle, "content") ?? post.name : post.name));
      const mediaChoice = media[0];
      results.push({
        id: post.id, name, url: mediaChoice.url, posterUrl: post.posterUrl ?? mediaChoice.url,
        width: 0, height: 0, box_count: 2, category: "Video Memes",
        description: "Add your own captions and export a video in the browser.",
        source: "indianmemetemplates", originalUrl: post.originalUrl,
        mediaType: mediaChoice.type, publishedAt: published, trending: trendingIds.has(post.id),
        popularity: trendingIds.has(post.id) ? 100 : 0, originalOrder: completed,
      });
    } catch (error) {
      console.warn("Skipped " + post.originalUrl + ": " + (error instanceof Error ? error.message : "request failed"));
    }
    completed++;
    if (completed % 20 === 0) console.log("Checked " + completed + "/" + posts.size + " source pages; found " + results.length + " media templates.");
  }
  if (!results.length) throw new Error("No direct GIF or video assets were found. Catalog was not overwritten.");
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(results, null, 2) + "\n", "utf8");
  console.log("Saved " + results.length + " GIF and video templates to " + OUTPUT + ". The media files were not copied.");
}
main().catch((error) => { console.error("Video template sync failed:", error instanceof Error ? error.message : error); process.exitCode = 1; });
