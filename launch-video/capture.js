/**
 * Real website footage only. Captured in Chromium from the public production URL.
 * No reconstructed interface, simulated screenshots, or stock imagery.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const BASE = "https://memeismine.vercel.app";
const OUT = path.join(__dirname, "output");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
  const context = await browser.newContext({
    viewport: { width: 1536, height: 864 },
    deviceScaleFactor: 1,
    recordVideo: { dir: OUT, size: { width: 1536, height: 864 } }
  });
  const page = await context.newPage();
  const started = Date.now();
  const marks = {};
  const mark = name => {
    marks[name] = (Date.now() - started) / 1000;
    console.log(name + " " + marks[name].toFixed(2) + "s");
  };
  const go = async url => {
    await page.goto(BASE + url, { waitUntil: "domcontentloaded", timeout: 45000 });
  };
  try {
    mark("start");
    await go("/");
    mark("home_loaded");
    await sleep(11500); // allows the real branded website introduction to finish
    mark("home_hero");
    await page.screenshot({ path: path.join(OUT, "home.jpg"), type: "jpeg", quality: 88 });
    await sleep(1400);

    const first = page.locator("input").first();
    const second = page.locator("input").nth(1);
    if ((await page.locator("input").count()) < 2) throw new Error("The live caption inputs are unavailable");
    mark("caption_edit");
    await first.click();
    await first.fill("");
    await first.pressSequentially("ME: ONE LAST MEME", { delay: 58 });
    await sleep(350);
    await second.click();
    await second.fill("");
    await second.pressSequentially("ALSO ME: 3 AM AGAIN", { delay: 54 });
    await sleep(800);
    await page.screenshot({ path: path.join(OUT, "caption.jpg"), type: "jpeg", quality: 88 });

    mark("scroll_images");
    await page.evaluate(() => window.scrollTo({ top: 990, behavior: "smooth" }));
    await sleep(1700);
    await page.evaluate(() => window.scrollTo({ top: 1570, behavior: "smooth" }));
    await sleep(1650);
    await page.screenshot({ path: path.join(OUT, "gallery.jpg"), type: "jpeg", quality: 88 });

    mark("explore_nav");
    await go("/explore");
    await sleep(2200);
    mark("explore_view");
    await page.screenshot({ path: path.join(OUT, "explore.jpg"), type: "jpeg", quality: 88 });
    await page.evaluate(() => window.scrollTo({ top: 360, behavior: "smooth" }));
    await sleep(1850);
    await page.evaluate(() => window.scrollTo({ top: 730, behavior: "smooth" }));
    await sleep(1300);

    mark("videos_nav");
    await go("/video-templates");
    await sleep(2200);
    mark("videos_view");
    await page.screenshot({ path: path.join(OUT, "videos.jpg"), type: "jpeg", quality: 88 });
    await page.evaluate(() => window.scrollTo({ top: 390, behavior: "smooth" }));
    await sleep(1500);
    await page.evaluate(() => window.scrollTo({ top: 650, behavior: "smooth" }));
    await sleep(1350);

    mark("outro_nav");
    await go("/");
    await sleep(1800);
    mark("outro_view");
    await page.screenshot({ path: path.join(OUT, "outro.jpg"), type: "jpeg", quality: 88 });
    await sleep(2000);
    mark("end");

    const recorded = await page.video().path();
    await page.close();
    await context.close();
    fs.copyFileSync(recorded, path.join(OUT, "raw.webm"));
    fs.writeFileSync(path.join(OUT, "marks.json"), JSON.stringify(marks, null, 2));
    console.log("Captured actual website recording:", fs.statSync(path.join(OUT, "raw.webm")).size, "bytes");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
