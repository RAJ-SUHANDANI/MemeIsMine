import { NextResponse } from "next/server";
import { starterMemes, categoryFor } from "@/data/memes";
export const revalidate = 3600;
type ImgflipMeme = { id: string; name: string; url: string; width: number; height: number; box_count: number };
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const category = (searchParams.get("category") ?? "All").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100) || 100, 1), 100);
  const sort = searchParams.get("sort") ?? "popular";
  let memes = starterMemes;
  let source = "bundled";
  try {
    const response = await fetch("https://api.imgflip.com/get_memes", { next: { revalidate: 3600 }, headers: { "User-Agent": "MemeIsMine/1.0 (template directory)" } });
    if (response.ok) {
      const payload = await response.json();
      const list: ImgflipMeme[] = payload?.success ? payload?.data?.memes ?? [] : [];
      if (list.length) { memes = list.map((meme) => ({ ...meme, category: categoryFor(meme.name), description: "A format ready for your next group-chat moment." })); source = "imgflip"; }
    }
  } catch { /* local fallback keeps Explore usable when upstream is unavailable */ }
  const filtered = memes.filter((meme) => (!query || meme.name.toLowerCase().includes(query)) && (category === "all" || meme.category.toLowerCase() === category));
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "newest") filtered.reverse();
  const result = filtered.slice(0, limit);
  return NextResponse.json({ success: true, source, count: result.length, total: filtered.length, memes: result }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
