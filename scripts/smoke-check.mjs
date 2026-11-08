import assert from "node:assert/strict";
const base = process.argv[2] ?? "http://localhost:3001";
const routes = [
  "/",
  "/explore",
  "/templates",
  "/video-templates",
  "/studio",
  "/about",
  "/how-it-works",
  "/faq",
  "/contact",
  "/privacy",
  "/add-review",
  "/create/upload",
  "/create/112126428",
  "/video-editor/arjun-kapoor-angry",
];
for (const route of routes) {
  const r = await fetch(base + route, { signal: AbortSignal.timeout(20000) });
  assert.equal(r.status, 200, route);
  assert.match(await r.text(), /Meme Is Mine/, route);
  console.log("PASS route " + route);
}
for (const route of [
  "/api/memes?limit=4",
  "/api/memes?q=Drake&limit=10",
  "/api/video-templates?limit=3",
  "/api/video-templates?slug=arjun-kapoor-angry",
]) {
  const r = await fetch(base + route, { signal: AbortSignal.timeout(20000) });
  assert.equal(r.status, 200, route);
  const data = await r.json();
  assert.equal(data.success, true, route);
  if (route.includes("q=Drake"))
    assert.ok(data.memes.every((m) => m.name.toLowerCase().includes("drake")));
  console.log("PASS API " + route);
}
for (const route of [
  "/api/image",
  "/api/image?url=http://127.0.0.1/",
  "/api/image?url=https://example.com/image.jpg",
  "/api/video-source",
  "/api/video-source?url=https://example.com/test.mp4",
]) {
  const r = await fetch(base + route, { signal: AbortSignal.timeout(10000) });
  assert.equal(r.status, 400, route);
  console.log("PASS rejects " + route);
}
for (const route of [
  "/templates/distracted-boyfriend.jpg",
  "/templates/drake.jpg",
  "/editor-preview.jpg",
]) {
  const r = await fetch(base + route);
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /image/);
  console.log("PASS asset " + route);
}
console.log("All route/API smoke checks passed.");
