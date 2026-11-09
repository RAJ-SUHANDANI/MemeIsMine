type CatalogEntry = { id: string; name: string; url: string };
const normalizedTitle = (name: string) =>
  name
    .toLowerCase()
    .replace(/\b(?:meme template|gif template|video template)\b/g, "")
    .replace(/[^a-z0-9]/g, "");

function mediaKey(url: string) {
  return url.replace(/#.*$/, "").replace(/-\d+x\d+(?=\.[a-z]+(?:\?|$))/i, "");
}

export function deduplicateTemplates<T extends CatalogEntry>(
  records: T[],
  aliases: Readonly<Record<string, string>>,
) {
  const items: (T & { likeId: string })[] = [];
  const byId = new Map<string, T & { likeId: string }>();
  const titleIds = new Map<string, string>();
  const mediaIds = new Map<string, string>();
  const known = new Set(records.map((record) => record.id));
  for (const item of records) {
    if (byId.has(item.id)) continue;
    const title = normalizedTitle(item.name);
    const media = mediaKey(item.url);
    const alias = aliases[item.id];
    const previous =
      (alias && known.has(alias) ? alias : undefined) ??
      mediaIds.get(media) ??
      titleIds.get(title);
    const entry = { ...item, likeId: previous ?? item.id };
    byId.set(item.id, entry);
    if (previous) continue;
    items.push(entry);
    mediaIds.set(media, item.id);
    titleIds.set(title, item.id);
  }
  return { items, byId };
}

export const imageAliases = {
  "142009471": "100777631", // Identical pigeon artwork with an alternate title.
  "91998305": "181913649",
  "224015000": "222403160",
  "memegen-drake": "181913649",
  "memegen-aag": "101470",
  "memegen-headaches": "119215120",
  "memegen-yallgot": "124055727",
  "memegen-reveal": "145139900",
  "memegen-woman-cat": "188390779",
  "memegen-cbb": "249257686",
  "memegen-oprah": "28251713",
  "memegen-captain": "29562797",
  "memegen-midwit": "533936279",
  "memegen-say": "72525473",
  "memegen-mordor": "61579",
  "memegen-ds": "87743020",
  "memegen-rollsafe": "89370399",
  "memegen-gb": "93895088",
} as const;
