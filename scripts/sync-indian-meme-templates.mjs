import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SITE = "https://indianmemetemplates.com";
const ARCHIVE = SITE + "/meme-templates/";
const USER_AGENT = "MemeIsMineTemplateIndex/1.0 (+https://github.com/RAJ-SUHANDANI/MemeIsMine)";
const OUTPUT = resolve("src/data/indian-meme-templates.json");
const DELAY_MS = 1000;
const MAX_PAGES = 500;

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
  const match = tag.match(new RegExp("\\b" + name + "\\s*=\\s*([\\"'])(.*?)\\1", "i"));
  return match?.[2] ? decodeEntities(match[2].trim()) : null;
}
function siteUrl(raw) {
  if (!raw) return null;
  try {
    const value = new URL(raw, SITE);
    if (value.protocol !== "https:" || !["indianmemetemplates.com", "www.indianmemetemplates.com"].includes(value.hostname)) return null;
    return value.toString();
  } catch { return null; }
}
function imageUrl(block) {
  const tags = block.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const raw = attr(tag, "data-src") ?? attr(tag, "data-lazy-src") ?? attr(tag, "data-original") ?? attr(tag, "src");
    const safe = siteUrl(raw);
    if (safe && /\/wp-content\/uploads\//i.test(new URL(safe).pathname) && !/dummyimage|pixel\.(?:gif|png)|blank\.(?:gif|png)/i.test(safe)) return safe;
    const srcset = attr(tag, "data-srcset") ?? attr(tag, "srcset");
    if (srcset) {
      const candidate = srcset.split(",").map((item) => item.trim().split(/\s+/)[0]).find((item) => /\/wp-content\/uploads\//i.test(item));
      const fromSet = siteUrl(candidate ?? null);
      if (fromSet) return fromSet;
    }
  }
  return null;
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
  const firstHtml = await fetchPage(ARCHIVE, "/meme-templates/");
  const totalPages = discoverPageCount(firstHtml) ?? 170;
  if (totalPages > MAX_PAGES) throw new Error("The archive advertises more than " + MAX_PAGES + " pages; stopping for manual review.");
  if (!parseCards(firstHtml).length) throw new Error("Could not parse template cards from page 1. No catalog file was overwritten.");
  const all = new Map();
  const append = (cards) => cards.forEach((card) => all.set(card.id, card));
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
  const records = [...all.values()];
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(records, null, 2) + "\n", "utf8");
  console.log("Saved " + records.length + " template records to " + OUTPUT + ". Image files were not downloaded or copied.");
}
main().catch((error) => {
  console.error("Template catalog sync failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
