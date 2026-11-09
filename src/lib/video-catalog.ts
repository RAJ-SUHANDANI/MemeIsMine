import "server-only";
import archive from "@/data/indian-video-templates.json";
import snapshot from "@/data/open-templates.json";
import { deduplicateTemplates } from "./deduplicate-templates";

export type VideoTemplate = {
  id: string;
  name: string;
  url: string;
  posterUrl: string;
  width: number;
  height: number;
  box_count: number;
  category: string;
  description: string;
  source: "indianmemetemplates" | "memegen";
  originalUrl: string;
  mediaType: "gif" | "video";
  publishedAt: string | null;
  addedAt?: string | null;
  trending: boolean;
  popularity: number;
  likeId?: string;
  originalOrder?: number;
};

const candidates = ([...archive, ...snapshot.videos] as VideoTemplate[]).filter(
  (item) => {
    const path = new URL(item.url).pathname;
    return item.mediaType === "gif"
      ? /\.gif$/i.test(path)
      : /\.(mp4|webm|mov|m4v|ogv)$/i.test(path);
  },
);
const ranked = candidates.map((item, index) => ({
  ...item,
  popularity: item.popularity > 0 ? item.popularity : candidates.length - index,
}));

export const { items: videoCatalog, byId: videosById } =
  deduplicateTemplates<VideoTemplate>(ranked, {
    "erling-haaland-why-not": "ronaldo-wink",
  });

export function publicVideo(item: VideoTemplate) {
  const { source: _source, originalUrl, ...publicItem } = item;
  void _source;
  return { ...publicItem, sourcePage: originalUrl };
}
