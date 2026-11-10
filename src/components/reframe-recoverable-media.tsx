"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reframeSourceForAttempt, reframeVideoSource, type PreviewSourceItem } from "@/lib/reframe-video-sources";
import type { ReframeItem } from "./reframe-preview";

/**
 * Gallery previews must be at least as resilient as the video editor:
 * first try the proxied clip, retry with a fresh archive referrer, then use
 * direct native playback if the archive denies a server-to-server request.
 * Only if those fail, ask the catalog for a refreshed source URL.
 */
export function ReframeRecoverableMedia({ item }: { item: ReframeItem }) {
  const video = useRef<HTMLVideoElement>(null);
  const [step, setStep] = useState(0);
  const [refreshed, setRefreshed] = useState<PreviewSourceItem | null>(null);
  // 0 = proxy, 1 = fresh archive-referrer proxy, 2 = direct source,
  // 3 = refresh catalog, 4 = refreshed proxy, 5 = refreshed direct,
  // 6 = exhausted. The editor link remains available regardless.
  const sourceItem = step >= 4 && refreshed ? refreshed : item;
  const src = step === 3 || step >= 6 ? "" :
    step === 4 ? reframeVideoSource(sourceItem, "archive") :
    step === 5 ? reframeVideoSource(sourceItem, "direct") :
    reframeSourceForAttempt(sourceItem, step);
  const retry = useCallback(() => {
    setRefreshed(null);
    setStep(0);
  }, []);
  const nextSource = useCallback(() => {
    setStep(current => {
      if (current === 2) return 3;
      if (current === 5) return 6;
      return Math.min(6, current + 1);
    });
  }, []);
  const resume = useCallback(() => {
    if (document.hidden) return;
    const node = video.current;
    if (!node) return;
    node.muted = true;
    void node.play().catch(() => {
      // A browser can defer autoplay; retry when data arrives or tab resumes.
    });
  }, []);

  useEffect(() => {
    const visibility = () => {
      if (document.hidden) video.current?.pause();
      else resume();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [resume]);

  useEffect(() => {
    if (step !== 3) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => { controller.abort(); setStep(6); }, 15000);
    const load = async () => {
      try {
        const response = await fetch(
          "/api/video-templates?slug=" + encodeURIComponent(item.id) + "&refresh=1",
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw Error("Template refresh unavailable");
        const data: unknown = await response.json();
        if (!data || typeof data !== "object" || !("template" in data)) throw Error("Missing template");
        const fresh = data.template as { url?: unknown; sourcePage?: unknown };
        if (typeof fresh?.url !== "string") throw Error("Missing media");
        const candidate: PreviewSourceItem = {
          mediaUrl: fresh.url,
          sourceHref: typeof fresh.sourcePage === "string" ? fresh.sourcePage : item.sourceHref,
        };
        if (!reframeVideoSource(candidate, "archive")) throw Error("Untrusted media");
        if (controller.signal.aborted) return;
        setRefreshed(candidate);
        setStep(4);
      } catch {
        if (!controller.signal.aborted) setStep(6);
      }
    };
    void load();
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [step, item.id, item.sourceHref]);

  if (!src) {
    return <div className="rf-media-fallback" role="status">
      {item.image && <img src={item.image} alt="" />}
      {step === 3 ? <p>Checking another playback source…</p> : <>
        <p>This preview couldn&apos;t start. The clip may still work in the editor.</p>
        <button type="button" className="rf-media-retry" onClick={retry}>Retry preview</button>
      </>}
    </div>;
  }
  return item.mediaType === "gif"
    ? <img key={src} src={src} className="rf-gif" alt={item.name} onError={nextSource} />
    : <video key={src} ref={video} src={src} poster={item.image || undefined}
        muted autoPlay loop playsInline preload="auto" aria-label={item.name}
        disablePictureInPicture
        onLoadedData={resume} onCanPlay={resume} onError={nextSource} />;
}
