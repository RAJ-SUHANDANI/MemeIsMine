"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { reframeSourceForAttempt } from "@/lib/reframe-video-sources";
import type { ReframeItem } from "./reframe-preview";

/**
 * Only visible cards request video bytes. Offscreen rail clones render just
 * their posters. If a source times out, try a clean archive referrer and then
 * direct playback (the same last-resort source used by the video editor).
 */
export function ReframeMotionThumbnail({ item, loading = "lazy" }: {
  item: ReframeItem;
  loading?: "eager" | "lazy";
}) {
  const holder = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intersecting = useRef(false);
  const previouslyVisible = useRef(false);
  const lastFailureAt = useRef(0);
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAttempt(0);
    setReady(false);
    lastFailureAt.current = 0;
  }, [item.id, item.mediaUrl]);

  useEffect(() => {
    const element = holder.current;
    if (!element) return;
    const root = element.closest<HTMLElement>(".rf-rail-viewport");
    const observer = new IntersectionObserver(([entry]) => {
      intersecting.current = entry.isIntersecting;
      setVisible(entry.isIntersecting && !document.hidden);
    }, { root, threshold: 0.12, rootMargin: "100px" });
    const onVisibility = () => setVisible(intersecting.current && !document.hidden);
    observer.observe(element);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (visible && !previouslyVisible.current && attempt >= 3 &&
        Date.now() - lastFailureAt.current > 30000) {
      setAttempt(0); // Retry a transient failure on a later visit to the card.
    }
    previouslyVisible.current = visible;
  }, [visible, attempt]);

  const resume = useCallback(() => {
    const video = videoRef.current;
    if (!video || !visible || reduce || document.hidden) return;
    video.muted = true;
    void video.play().catch(() => {
      // Muted inline playback is requested again when data/canplay arrives.
    });
  }, [visible, reduce]);

  useEffect(() => {
    if (!visible || reduce || document.hidden) videoRef.current?.pause();
    else resume();
  }, [visible, reduce, attempt, resume]);

  const source = reframeSourceForAttempt(item, attempt);
  const animate = visible && !reduce && attempt < 3 && Boolean(source);

  const recover = () => {
    if (!visible) return; // Unmounting a scrolled-away video is not a failure.
    lastFailureAt.current = Date.now();
    setReady(false);
    setAttempt(current => Math.min(3, current + 1));
  };

  return <div ref={holder} className="rf-motion-thumbnail">
    {item.image
      ? <img src={item.image} alt="" loading={loading} decoding="async" className="rf-motion-thumbnail-poster" />
      : <span className="rf-poster-placeholder" aria-hidden="true">MIM / MOTION</span>}
    {animate && (item.mediaType === "gif"
      ? <img key={source} src={source} alt="" className="rf-motion-thumbnail-live"
          onError={recover} />
      : <video key={source} ref={videoRef} src={source} muted autoPlay loop playsInline
          preload="auto" aria-hidden="true" disablePictureInPicture
          className={"rf-motion-thumbnail-live" + (ready ? " is-ready" : "")}
          onLoadedData={() => { setReady(true); resume(); }}
          onCanPlay={resume}
          onPlaying={() => setReady(true)}
          onError={recover} />)}
  </div>;
}
