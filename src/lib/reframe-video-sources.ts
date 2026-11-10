/**
 * A failed same-origin media proxy request is not proof that the clip is gone:
 * the source archive can intermittently time out, reject a referrer, or send
 * a byte range the browser cannot use. Mirror the editor's recovery order.
 *
 * Keep this pure so preview and thumbnail playback share the exact sequence.
 */
export type PreviewSourceItem = {
  mediaUrl?: string;
  sourceHref?: string;
};

type SourceMode = "normal" | "archive" | "direct";

const ROOT_REFERRER = "https://indianmemetemplates.com/";

export function reframeVideoSource(item: PreviewSourceItem, mode: SourceMode): string {
  if (!item.mediaUrl) return "";
  let url: URL;
  try { url = new URL(item.mediaUrl); } catch { return ""; }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return "";
  const archive = url.hostname === "indianmemetemplates.com" ||
    url.hostname === "www.indianmemetemplates.com";
  const animatedMemegen = url.hostname === "api.memegen.link" &&
    /^\/images\/[a-z0-9-]+\.gif$/.test(url.pathname) &&
    url.search === "?style=animated";
  if (!(archive && /^\/wp-content\/uploads\//i.test(url.pathname)) && !animatedMemegen) return "";
  if (mode === "direct") return url.toString();
  const params = new URLSearchParams({ url: url.toString() });
  const referrer = mode === "archive" ? ROOT_REFERRER : item.sourceHref;
  if (referrer && archive) params.set("referrer", referrer);
  if (mode === "archive") params.set("fresh", "1");
  return "/api/video-source?" + params.toString();
}

export function reframeSourceForAttempt(item: PreviewSourceItem, attempt: number): string {
  return reframeVideoSource(item, attempt === 0 ? "normal" : attempt === 1 ? "archive" : "direct");
}
