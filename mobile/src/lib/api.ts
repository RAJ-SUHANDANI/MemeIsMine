import type { MemeTemplate, VideoTemplate } from "../types";

export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://memeismine.vercel.app").replace(/\/$/, "");

async function request<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  const data = await response.json();
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data as T;
}

export async function getMemes(options: { q?: string; sort?: string; category?: string; limit?: number; signal?: AbortSignal } = {}) {
  const params = new URLSearchParams({ limit: String(options.limit ?? 100), sort: options.sort ?? "popular" });
  if (options.q) params.set("q", options.q);
  if (options.category) params.set("category", options.category);
  const data = await request<{ success: boolean; source: string; total: number; memes: MemeTemplate[] }>(
    `${API_BASE}/api/memes?${params}`, options.signal
  );
  return data.memes;
}

export async function getVideos(options: { q?: string; sort?: string; page?: number; limit?: number; signal?: AbortSignal } = {}) {
  const params = new URLSearchParams({ page: String(options.page ?? 1), limit: String(options.limit ?? 30), sort: options.sort ?? "popular" });
  if (options.q) params.set("q", options.q);
  const data = await request<{ success: boolean; templates: VideoTemplate[]; totalItems: number; totalPages: number }>(
    `${API_BASE}/api/video-templates?${params}`, options.signal
  );
  return data;
}

export function imageUri(url: string) {
  return `${API_BASE}/api/image?url=${encodeURIComponent(url)}`;
}
export function videoUri(url: string, sourcePage?: string) {
  const params = new URLSearchParams({ url });
  if (sourcePage) params.set("referrer", sourcePage);
  return `${API_BASE}/api/video-source?${params}`;
}
