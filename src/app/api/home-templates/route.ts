import { NextResponse } from "next/server";
import { imageCatalog } from "@/lib/image-catalog";
import { videoCatalog, publicVideo } from "@/lib/video-catalog";

function choose<T extends { id: string }>(
  pool: T[],
  count: number,
  previous: Set<string>,
  kind: string,
) {
  const fresh = pool.filter((item) => !previous.has(kind + ":" + item.id));
  const available = fresh.length >= count ? fresh : [...pool];
  for (let index = 0; index < count && index < available.length; index++) {
    const other =
      index + Math.floor(Math.random() * (available.length - index));
    [available[index], available[other]] = [available[other], available[index]];
  }
  return available.slice(0, count);
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("previous") ?? "";
  const previous = new Set(raw.slice(0, 1800).split(","));
  const images = choose(imageCatalog, 6, previous, "image");
  const withPosters = videoCatalog.filter(
    (item) =>
      item.posterUrl && !/\.(gif|mp4|webm)(?:[?#]|$)/i.test(item.posterUrl),
  );
  const videos = choose(withPosters, 4, previous, "video").map(publicVideo);
  return NextResponse.json(
    { images, videos },
    { headers: { "Cache-Control": "no-store" } },
  );
}
