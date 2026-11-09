import "server-only";
import legacyImages from "@/data/indian-meme-templates.json";
import { imagesById } from "./image-catalog";
import { videosById } from "./video-catalog";
import type { editorTarget } from "./return-path";

const legacyIds = new Set(legacyImages.map((item) => item.id));

export function hasEditorTemplate(
  target: NonNullable<ReturnType<typeof editorTarget>>,
) {
  if (target.upload) return true;
  if (target.kind === "video") return videosById.has(target.id);
  return (target.indian ? legacyIds : imagesById).has(target.id);
}
