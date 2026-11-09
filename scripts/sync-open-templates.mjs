import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const output = new URL("../src/data/open-templates.json", import.meta.url);
const today = new Date().toISOString().slice(0, 10);
const old = JSON.parse(await readFile(output, "utf8"));
const oldImages = new Map(old.images.map((item) => [item.id, item]));
const oldVideos = new Map(old.videos.map((item) => [item.id, item]));
const imageHosts = new Set(["i.imgflip.com"]);
const agent = {
  "User-Agent":
    "MemeIsMineCatalog/1.0 (+https://github.com/RAJ-SUHANDANI/MemeIsMine)",
};

async function load(url) {
  const response = await fetch(url, {
    headers: agent,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("HTTP " + response.status + " for " + url);
  return response.json();
}

async function mediaInfo(url) {
  const response = await fetch(url, {
    headers: agent,
    redirect: "error",
    signal: AbortSignal.timeout(12000),
  });
  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("image/")
  )
    throw new Error("Media unavailable");
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length > 12_000_000) throw new Error("Image too large");
  return sharp(data).metadata();
}

const [imgflip, memegen, animated] = await Promise.all([
  load("https://api.imgflip.com/get_memes"),
  load("https://api.memegen.link/templates/"),
  load("https://api.memegen.link/templates/?animated=true"),
]);
if (
  !imgflip.success ||
  imgflip.data.memes.length < 80 ||
  !Array.isArray(memegen) ||
  memegen.length < 50 ||
  !Array.isArray(animated) ||
  !animated.length
)
  throw new Error("A provider returned an incomplete catalog.");
const currentImgflip = imgflip.data.memes.filter(
  (item) =>
    /^\d+$/.test(item.id) &&
    imageHosts.has(new URL(item.url).hostname) &&
    item.width > 0 &&
    item.height > 0,
);
const images = new Map(oldImages);
const videos = new Map(oldVideos);
const animatedIds = new Set(animated.map((item) => item.id));

currentImgflip.forEach((item, index) => {
  const previous = oldImages.get(item.id);
  images.set(item.id, {
    id: item.id,
    name: item.name,
    url: item.url,
    width: item.width,
    height: item.height,
    box_count: item.box_count,
    source: "imgflip",
    popularity: 1000 - index,
    addedAt: previous ? previous.addedAt : oldImages.size ? today : null,
  });
});

const work = memegen.filter((item) => /^[a-z0-9-]{1,70}$/.test(item.id));
let cursor = 0;
async function worker() {
  while (cursor < work.length) {
    const item = work[cursor++];
    const id = "memegen-" + item.id;
    const blank = "https://api.memegen.link/images/" + item.id + ".jpg";
    const originalUrl = "https://memegen.link/templates/" + item.id + "/";
    if (!images.has(id)) {
      try {
        const size = await mediaInfo(blank);
        if (size.width && size.height)
          images.set(id, {
            id,
            name: item.name,
            url: blank,
            width: size.width,
            height: size.height,
            box_count: item.lines,
            source: "memegen",
            originalUrl,
            popularity: 0,
            addedAt: today,
          });
      } catch (error) {
        console.warn("Skipping image", id, error.message);
      }
    }
    if (!animatedIds.has(item.id) || videos.has(id)) continue;
    try {
      const url =
        "https://api.memegen.link/images/" + item.id + ".gif?style=animated";
      const size = await mediaInfo(url);
      if ((size.pages ?? 0) < 2) continue;
      videos.set(id, {
        id,
        name: item.name,
        url,
        posterUrl: blank,
        width: size.width,
        height: size.pageHeight ?? size.height,
        box_count: item.lines,
        category: "Animated GIF",
        description: "Add your captions to this animated format.",
        source: "memegen",
        originalUrl,
        mediaType: "gif",
        publishedAt: null,
        addedAt: today,
        trending: false,
        popularity: 25,
      });
    } catch (error) {
      console.warn("Skipping animation", id, error.message);
    }
  }
}

await Promise.all(Array.from({ length: 4 }, worker));
if (
  ![...images.values()].some((item) => item.source === "memegen") ||
  !videos.size
) {
  throw new Error(
    "No usable Memegen image or animation metadata was returned.",
  );
}
const sorted = (map) =>
  [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
await writeFile(
  output,
  JSON.stringify({ images: sorted(images), videos: sorted(videos) }, null, 2) +
    "\n",
);
console.log(
  "Catalog updated:",
  images.size,
  "images;",
  videos.size,
  "animated GIFs.",
);
