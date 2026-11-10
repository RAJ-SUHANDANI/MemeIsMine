import assert from "node:assert/strict";
const base = process.argv[2] ?? "http://localhost:3001";
const routes = [
  "/",
  "/explore",
  "/video-templates",
  "/about",
  "/how-it-works",
  "/faq",
  "/contact",
  "/privacy",
  "/add-review",
  "/signup",
  "/login",
];
for (const route of routes) {
  const r = await fetch(base + route, { signal: AbortSignal.timeout(20000) });
  assert.equal(r.status, 200, route);
  assert.match(await r.text(), /Meme Is Mine/, route);
  console.log("PASS route " + route);
}
// First paint contains complete motion rails, not a tiny placeholder set.
const homeMarkup = await (await fetch(base + "/", { signal: AbortSignal.timeout(20000) })).text();
const centerSegments = (homeMarkup.match(/data-rail-copy="1"/g) ?? []).length;
const totalRailCards = (homeMarkup.match(/class="rf-rail-card"/g) ?? []).length;
assert.equal(centerSegments, 2, "homepage must contain one still and one moving carousel");
assert.ok(totalRailCards >= 120, "homepage must render at least 20 templates per rail across loop copies");
console.log("PASS two continuously populated homepage galleries");

// Search/answer discovery and Flow-only content must be visible in SSR HTML.
const homepageResponse=await fetch(base+"/");
assert.equal(homepageResponse.headers.get("x-frame-options"),"DENY");
assert.match(homepageResponse.headers.get("content-security-policy")??"",/frame-ancestors 'none'/);
assert.match(homeMarkup,/"@type":"WebApplication"/);
assert.match(homeMarkup,/rel="canonical"/);
for(const route of ["/explore","/video-templates"]){
 const response=await fetch(base+route);
 const html=await response.text();
 assert.ok(html.includes('data-rail-copy="1"'),"SSR Flow gallery missing: "+route);
 assert.ok(html.includes('data-layout="coverflow"'),"Flow layout missing: "+route);
 assert.ok(!html.includes('data-layout="stack"'),"Stack must not appear: "+route);
 assert.ok((html.match(/class="rf-rail-card"/g)??[]).length>=60,"At least 20 SSR formats required: "+route);
}
const faqHTML=await (await fetch(base+"/faq")).text();
assert.ok(faqHTML.includes('"@type":"FAQPage"'),"Missing truthful FAQ structured data");
assert.ok(faqHTML.includes("Where are my saved meme drafts stored?"),"FAQ answer text must be crawlable");
const siteMap=await (await fetch(base+"/sitemap.xml")).text();
assert.ok(siteMap.includes("/explore")&&siteMap.includes("/video-templates"));
assert.ok(!siteMap.includes("/signup")&&!siteMap.includes("/studio"));
const robots=await (await fetch(base+"/robots.txt")).text();
assert.ok(robots.includes("Disallow: /account"),"Private account pages should not be crawled");
console.log("PASS secure headers, real SSR Flow galleries, canonical metadata and crawlable answers");

const duplicate = await fetch(base + "/templates", { redirect: "manual" });
assert.ok([307, 308].includes(duplicate.status), "old image archive should redirect");
assert.equal(new URL(duplicate.headers.get("location"),base).pathname,"/explore");
console.log("PASS legacy image archive redirects to single image templates page");
for (const route of ["/account", "/studio", "/create/upload", "/create/112126428", "/video-editor/arjun-kapoor-angry"]) {
  const response = await fetch(base + route, { redirect: "manual" });
  assert.equal(response.status, 307, route);
  const destination = new URL(response.headers.get("location"), base);
  assert.equal(destination.pathname, "/login");
  assert.equal(destination.searchParams.get("next"), route);
  console.log("PASS signed-out editor guard " + route);
}
// Exercise real server-side session guards with a temporary CI-only SQLite user.
// This fixture never runs against a deployed customer database.
if(process.env.CI && process.env.MIM_DATABASE_PATH?.startsWith("/tmp/mim-ci-")){
  const {DatabaseSync}=await import("node:sqlite");
  const {createHash,randomBytes,randomUUID}=await import("node:crypto");
  const health=await fetch(base+"/api/health");
  assert.equal(health.status,200,"CI account database should be healthy");
  const db=new DatabaseSync(process.env.MIM_DATABASE_PATH);
  const token=randomBytes(32).toString("base64url");
  const tokenHash=createHash("sha256").update(token).digest("hex");
  const id=randomUUID();
  const now=Date.now();
  db.prepare("INSERT INTO users(id,email,password_hash,verified,created_at) VALUES(?,?,?,?,?)")
    .run(id,"ci-verified@example.test","scrypt:v1:"+"0".repeat(48)+":"+"0".repeat(128),1,now);
  db.prepare("INSERT INTO session_tokens(token_hash,user_id,scope,expires_at,created_at) VALUES(?,?,?,?,?)")
    .run(tokenHash,id,"user",now+600_000,now);
  db.close();
  const authenticated={headers:{Cookie:"mim_session="+token},redirect:"manual"};
  for(const route of ["/account","/studio","/create/upload","/create/112126428","/video-editor/arjun-kapoor-angry"]){
    const response=await fetch(base+route,{...authenticated,signal:AbortSignal.timeout(20000)});
    assert.equal(response.status,200,"verified session must open "+route);
    console.log("PASS signed-in route "+route);
  }
  const signed=await fetch(base+"/api/account",{...authenticated});
  assert.equal((await signed.json()).signedIn,true);
  const likes=await fetch(base+"/api/account/likes",{...authenticated});
  assert.equal(likes.status,200);
  assert.deepEqual((await likes.json()).items,[]);
  console.log("PASS real authenticated session, Studio, both editors and private likes");
}
for (const route of [
  "/api/memes?limit=4",
  "/api/memes?q=Drake&limit=10",
  "/api/video-templates?limit=3",
  "/api/memes?limit=24",
  "/api/video-templates?limit=24",
  "/api/memes?sort=new&limit=3",
  "/api/video-templates?sort=new&limit=3",
  "/api/memes?id=memegen-bongo",
  "/api/video-templates?slug=memegen-bongo",
  "/api/video-templates?slug=arjun-kapoor-angry",
]) {
  const r = await fetch(base + route, { signal: AbortSignal.timeout(20000) });
  assert.equal(r.status, 200, route);
  const data = await r.json();
  assert.equal(data.success, true, route);
  if (route.endsWith("limit=24")) {
    const entries = data.templates ?? data.memes ?? [];
    assert.ok(entries.length >= 20, "gallery archive must supply at least 20 formats");
    assert.equal(new Set(entries.map(item => item.id)).size, entries.length, "gallery formats must be unique");
  }
  if (route.includes("q=Drake"))
    assert.ok(data.memes.every((m) => m.name.toLowerCase().includes("drake")));
  console.log("PASS API " + route);
}
const likesResponse = await fetch(base + "/api/account/likes");
assert.equal(likesResponse.status, 401);
console.log("PASS account likes require sign in");
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
const imageAlias = await (await fetch(base + "/api/memes?id=memegen-ds")).json();
assert.equal(imageAlias.meme.likeId, "87743020");
const videoAlias = await (await fetch(base + "/api/video-templates?slug=erling-haaland-why-not")).json();
assert.equal(videoAlias.template.likeId, "ronaldo-wink");
const first = await (await fetch(base + "/api/home-templates")).json();
const keys = data => [...data.images.map(x => "image:" + x.id), ...data.videos.map(x => "video:" + x.id)];
const previous = keys(first);
const next = await (await fetch(base + "/api/home-templates?previous=" + encodeURIComponent(previous.join(",")))).json();
assert.equal(previous.length, 10);
assert.equal(keys(next).length, 10);
assert.ok(keys(next).every(key => !previous.includes(key)));
console.log("PASS canonical aliases and fresh home galleries");
console.log("All route/API smoke checks passed.");
