import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Draft } from "../types";

const DRAFTS_KEY = "mim-mobile-drafts-v1";
const BOOKMARKS_KEY = "mim-mobile-bookmarks-v1";

async function readArray<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value as T[] : [];
  } catch { return []; }
}
export const getDrafts = () => readArray<Draft>(DRAFTS_KEY);
export const getBookmarks = () => readArray<string>(BOOKMARKS_KEY);
export async function saveDraft(draft: Draft) {
  const drafts = await getDrafts();
  const next = [draft, ...drafts.filter((item) => item.id !== draft.id)].slice(0, 100);
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
  return next;
}
export async function removeDraft(id: string) {
  const next = (await getDrafts()).filter((draft) => draft.id !== id);
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
  return next;
}
export async function toggleBookmark(id: string) {
  const bookmarks = await getBookmarks();
  const next = bookmarks.includes(id) ? bookmarks.filter((item) => item !== id) : [id, ...bookmarks];
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  return next;
}
