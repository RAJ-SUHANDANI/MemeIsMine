import "server-only";
import { imagesById } from "./image-catalog";
import { videosById } from "./video-catalog";

export function canonicalReactionKey(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.match(/^(image|video):([a-z0-9-]{1,120})$/);
  if (!match) return null;
  const catalog = match[1] === "image" ? imagesById : videosById;
  const item = catalog.get(match[2]);
  return item ? match[1] + ":" + item.likeId : null;
}
