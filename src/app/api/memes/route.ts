import { NextResponse } from "next/server";
import { starterMemes, categoryFor } from "@/data/memes";
export const revalidate = 3600;
type ImgflipMeme = { id: string; name: string; url: string; width: number; height: number; box_count: number };
const TRENDING_FORMATS = /drake|woman yelling|distracted boyfriend|two buttons|doge|mocking spongebob|change my mind|expanding brain|success kid|hide the pain harold|gru.?s plan|trade offer|uno draw 25|disaster girl|epic handshake|ancient aliens|always has been|this is fine|stonks|crying cat/i;
function enrichMeme(meme: ImgflipMeme & Partial<(typeof starterMemes)[number]>, index: number, total: number) {
  return {
    ...meme,
    category: meme.category ?? categoryFor(meme.name),
    description: meme.description ?? "A format ready for your next group-chat moment.",
    // Imgflip's public endpoint doesn't expose usage metrics or publication dates.
    // Preserve its own ordering as the popularity rank and use a consistent
    // curated trend signal so these filters remain meaningful and reproducible.
    popularity: meme.popularity ?? total - index,
    trending: meme.trending ?? TRENDING_FORMATS.test(meme.name),
  };
}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const category = (searchParams.get("category") ?? "All").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100) || 100, 1), 100);
  const sort = searchParams.get("sort") ?? "popular";
  let memes = starterMemes.map((meme, index) => enrichMeme(meme, index, starterMemes.length));
  let source = "bundled-imgflip";
  try {
    const response = await fetch("https://api.imgflip.com/get_memes", { next: { revalidate: 3600 }, headers: { "User-Agent": "MemeIsMine/1.0 (template directory)" } });
    if (response.ok) {
      const payload = await response.json();
      const list: ImgflipMeme[] = payload?.success ? payload?.data?.memes ?? [] : [];
      if (list.length) {
        memes = list.map((meme, index) => enrichMeme(meme, index, list.length));
        source = "imgflip";
      }
    }
  } catch { /* local Imgflip-only fallback keeps Explore usable when upstream is unavailable */ }
  const filtered = memes.filter((meme) => (!query || meme.name.toLowerCase().includes(query)) && (category === "all" || meme.category.toLowerCase() === category));
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "trending") filtered.sort((a, b) => Number(Boolean(b.trending)) - Number(Boolean(a.trending)) || (b.popularity ?? 0) - (a.popularity ?? 0));
  else if (sort === "newest" || sort === "recent") filtered.sort((a, b) => Number(b.id) - Number(a.id) || (b.id ?? "").localeCompare(a.id ?? "", undefined, { numeric: true }));
  else filtered.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  const result = filtered.slice(0, limit);
  return NextResponse.json({ success: true, source, count: result.length, total: filtered.length, memes: result }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
