import "server-only";
import snapshot from "@/data/open-templates.json";
import { starterMemes, categoryFor, type MemeTemplate } from "@/data/memes";
import { deduplicateTemplates, imageAliases } from "./deduplicate-templates";

const localImages: Record<string, string> = {
  "181913649": "drake.jpg",
  "87743020": "two-buttons.jpg",
  "112126428": "distracted-boyfriend.jpg",
  "188390779": "woman-cat.jpg",
  "129242436": "change-my-mind.jpg",
};
const trendingNames =
  /drake|woman yelling|distracted boyfriend|two buttons|doge|mocking spongebob|change my mind|expanding brain|success kid|hide the pain harold|gru.?s plan|trade offer|uno draw 25|disaster girl|epic handshake|ancient aliens|always has been|this is fine|stonks|crying cat/i;
const starters = new Map(starterMemes.map((item) => [item.id, item]));

type SnapshotItem = Omit<MemeTemplate, "category" | "description">;
const images = (snapshot.images as SnapshotItem[])
  .slice()
  .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
  .map((item) => ({
    ...item,
    url: localImages[item.id] ? "/templates/" + localImages[item.id] : item.url,
    category: starters.get(item.id)?.category ?? categoryFor(item.name),
    description:
      starters.get(item.id)?.description ??
      "A format ready for your next meme.",
    trending: item.source === "imgflip" && trendingNames.test(item.name),
  }));

export const { items: imageCatalog, byId: imagesById } =
  deduplicateTemplates<MemeTemplate>(
    [...images, ...starterMemes],
    imageAliases,
  );
