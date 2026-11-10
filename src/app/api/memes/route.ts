import { NextResponse } from "next/server";
import { imageCatalog, imagesById } from "@/lib/image-catalog";
import { isNewTemplate, newestDate } from "@/lib/catalog-freshness";

const headers = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const meme = imagesById.get(id);
    return NextResponse.json(
      { success: Boolean(meme), meme },
      { status: meme ? 200 : 404, headers },
    );
  }
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  const category = (searchParams.get("category") ?? "all").trim().toLowerCase();
  const limit = Math.min(
    Math.max(Math.trunc(Number(searchParams.get("limit"))) || 100, 1),
    500,
  );
  const page = Math.max(Math.trunc(Number(searchParams.get("page"))) || 1, 1);
  const sort = searchParams.get("sort") ?? "popular";
  const filtered = imageCatalog.filter(
    (item) =>
      (!query || item.name.toLowerCase().includes(query)) &&
      (category === "all" || item.category.toLowerCase() === category) &&
      (sort !== "new" || isNewTemplate(item)),
  );
  const rank = (a: (typeof filtered)[number], b: (typeof filtered)[number]) =>
    (b.popularity ?? 0) - (a.popularity ?? 0);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "trending")
    filtered.sort(
      (a, b) =>
        Number(Boolean(b.trending)) - Number(Boolean(a.trending)) || rank(a, b),
    );
  else if (["new", "newest", "recent"].includes(sort))
    filtered.sort((a, b) => newestDate(b) - newestDate(a) || rank(a, b));
  else if (sort === "surprise") {
    let state = (Number(searchParams.get("seed") ?? 17) || 17) >>> 0;
    if (state === 0) state = 0x6d2b79f5;
    const random = () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    for (let index = filtered.length - 1; index > 0; index--) {
      const target = Math.floor(random() * (index + 1));
      [filtered[index], filtered[target]] = [filtered[target], filtered[index]];
    }
  }
  else filtered.sort(rank);
  const memes = filtered.slice((page - 1) * limit, page * limit);
  return NextResponse.json(
    {
      success: true,
      source: "imgflip-memegen",
      count: memes.length,
      total: filtered.length,
      memes,
    },
    { headers },
  );
}
