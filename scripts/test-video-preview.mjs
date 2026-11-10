import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Exercise the exact URL builder used by the gallery cards and expanded
// previews without making 300 external requests in CI.
const source = readFileSync("src/lib/reframe-video-sources.ts", "utf8");
const out = ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
} }).outputText;
const mod = { exports: {} };
new Function("module", "exports", "URL", "URLSearchParams", out)(
  mod, mod.exports, URL, URLSearchParams,
);
const { reframeVideoSource, reframeSourceForAttempt } = mod.exports;
const sample = {
  mediaUrl: "https://indianmemetemplates.com/wp-content/uploads/Example-clip.mp4",
  sourceHref: "https://indianmemetemplates.com/example-clip/",
};
const primary = reframeSourceForAttempt(sample, 0);
const archive = reframeSourceForAttempt(sample, 1);
const direct = reframeSourceForAttempt(sample, 2);
const p = new URL(primary, "https://memeismine.vercel.app");
const a = new URL(archive, "https://memeismine.vercel.app");
assert.equal(p.pathname, "/api/video-source");
assert.equal(p.searchParams.get("url"), sample.mediaUrl);
assert.equal(p.searchParams.get("referrer"), sample.sourceHref);
assert.equal(p.searchParams.has("fresh"), false);
assert.equal(a.searchParams.get("url"), sample.mediaUrl);
assert.equal(a.searchParams.get("referrer"), "https://indianmemetemplates.com/");
assert.equal(a.searchParams.get("fresh"), "1");
assert.equal(direct, sample.mediaUrl);

for (const invalid of [
  "http://indianmemetemplates.com/wp-content/uploads/test.mp4",
  "https://evil.example/wp-content/uploads/test.mp4",
  "https://indianmemetemplates.com.evil.example/wp-content/uploads/test.mp4",
  "https://user:pass@indianmemetemplates.com/wp-content/uploads/test.mp4",
  "https://indianmemetemplates.com:7443/wp-content/uploads/test.mp4",
  "https://indianmemetemplates.com/private/test.mp4",
  "data:video/mp4;base64,AAAA",
]) {
  assert.equal(reframeVideoSource({ mediaUrl: invalid }, "direct"), "", "Unsafe fallback: " + invalid);
}
const gif = { mediaUrl: "https://api.memegen.link/images/bongo.gif?style=animated" };
assert.ok(reframeSourceForAttempt(gif, 0).startsWith("/api/video-source?"));
assert.equal(reframeSourceForAttempt(gif, 2), gif.mediaUrl);
assert.equal(reframeSourceForAttempt({mediaUrl: "https://api.memegen.link/images/bongo.gif?style=raw"}, 2), "");

const archiveItems = JSON.parse(readFileSync("src/data/indian-video-templates.json", "utf8"));
assert.ok(archiveItems.length > 100, "Expected a substantial public video catalogue");
for (const item of archiveItems) {
  assert.ok(reframeSourceForAttempt({mediaUrl:item.url,sourceHref:item.originalUrl},0),
    "Missing primary source for "+item.id);
  assert.ok(reframeSourceForAttempt({mediaUrl:item.url,sourceHref:item.originalUrl},1),
    "Missing fresh archive fallback for "+item.id);
  assert.ok(reframeSourceForAttempt({mediaUrl:item.url,sourceHref:item.originalUrl},2),
    "Missing direct last-resort fallback for "+item.id);
}
console.log("PASS recoverable media source sequence, referrer retry, strict hosts and "+archiveItems.length+" video templates");
