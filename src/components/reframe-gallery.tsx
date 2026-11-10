/* Original Motion-driven gallery system. Premium Motion+ examples are references, not copied source. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Bookmark } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ReframeMotionRail } from "./reframe-motion-rail";
import { ReframeMotionThumbnail } from "./reframe-motion-thumbnail";
import { ReframePreview, type ReframeItem } from "./reframe-preview";

function storageIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem("mim-bookmarks") ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch { return []; }
}

function GalleryCard({ item, index, onOpen, onSave, saved, shared = true }: {
  item: ReframeItem; index: number; onOpen: (item: ReframeItem) => void;
  onSave: (item: ReframeItem) => void; saved: boolean; shared?: boolean;
}) {
  return <motion.article className="rf-gallery-object" layout={false}>
    <div className="rf-gallery-object-inner">
      <button type="button" className="rf-gallery-art-trigger"
        aria-label={"Preview " + item.name} aria-haspopup="dialog" onClick={() => onOpen(item)}>
        <motion.div className="rf-gallery-art"
          layoutId={shared ? "rf-art-" + item.kind + "-" + item.id : undefined}
          transition={{ type: "spring", stiffness: 330, damping: 35 }}>
          {item.kind === "video"
            ? <ReframeMotionThumbnail item={item} loading={shared && index < 3 ? "eager" : "lazy"}/>
            : item.image
              ? <img src={item.image} alt="" loading={shared && index < 3 ? "eager" : "lazy"} decoding="async" />
              : <span className="rf-poster-placeholder">MIM / STILL</span>}
        </motion.div>
        <span className="rf-gallery-overprint"><span>{item.kind === "video" ? "MOVING IMAGE" : "STILL FRAME"}</span><ArrowUpRight size={17}/></span>
      </button>
      <div className="rf-gallery-object-meta">
        <button type="button" className="rf-card-name" onClick={() => onOpen(item)}>{item.name}</button>
        <button type="button" className="rf-card-bookmark" onClick={() => onSave(item)}
          aria-label={saved ? "Remove saved template: " + item.name : "Save template: " + item.name}
          aria-pressed={saved}>
          <Bookmark size={18} fill={saved ? "currentColor" : "none"}/>
        </button>
      </div>
      <div className="rf-gallery-object-foot"><span>{item.category}</span><span>{String(index + 1).padStart(3, "0")}</span></div>
    </div>
  </motion.article>;
}

export function ReframeGallery({ items, kind, variant = "showcase", path, home = false }: {
  items: ReframeItem[];
  kind: "image" | "video";
  variant?: "showcase" | "objects";
  path: string;
  home?: boolean;
}) {
  const [preview, setPreview] = useState<ReframeItem | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [requested, setRequested] = useState<string | null>(null);

  useEffect(() => {
    setBookmarks(storageIds());
    setRequested(new URL(window.location.href).searchParams.get("preview"));
    function changed() { setBookmarks(storageIds()); }
    window.addEventListener("storage", changed);
    window.addEventListener("mim-bookmarks-updated", changed);
    return () => {
      window.removeEventListener("storage", changed);
      window.removeEventListener("mim-bookmarks-updated", changed);
    };
  }, [kind]);

  useEffect(() => {
    if (!requested) return;
    const found = items.find(item => item.id === requested);
    if (found) { setPreview(found); setRequested(null); return; }
    const controller = new AbortController();
    const source = kind === "image"
      ? "/api/memes?id=" + encodeURIComponent(requested)
      : "/api/video-templates?slug=" + encodeURIComponent(requested);
    fetch(source, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!data?.success || controller.signal.aborted) return;
        const t = data.meme ?? data.template;
        if (!t) return;
        setPreview(kind === "image" ? {
          id: t.id, name: t.name, image: t.url, kind: "image", category: t.category ?? "Image",
          likeId: t.likeId,
          editorHref: "/create/" + encodeURIComponent(t.id) +
            (t.source === "indian" || t.source === "indianmemetemplates" ? "?source=indian" : ""),
          sourceHref: t.originalUrl,
        } : {
          id: t.id, name: t.name, image: t.posterUrl ?? "", kind: "video",
          category: t.category ?? "Video", likeId: t.likeId,
          editorHref: "/video-editor/" + encodeURIComponent(t.id), mediaUrl: t.url,
          mediaType: t.mediaType, sourceHref: t.sourcePage,
        });
        setRequested(null);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [items, kind, requested]);

  function save(item: ReframeItem) {
    const key = item.kind === "video" ? "video:" + item.id : item.id;
    const next = bookmarks.includes(key) ? bookmarks.filter(id => id !== key) : [...bookmarks, key];
    try {
      if (item.kind === "image") {
        const raw: unknown = JSON.parse(localStorage.getItem("mim-bookmark-templates") ?? "[]");
        const metadata = Array.isArray(raw)
          ? raw.filter(value => value && typeof value === "object" && value.id !== item.id)
          : [];
        if (!bookmarks.includes(key)) metadata.push({
          id: item.id, name: item.name, url: item.image, width: 1200, height: 1200,
          category: item.category, source: item.editorHref.includes("source=indian") ? "indian" : undefined,
        });
        localStorage.setItem("mim-bookmark-templates", JSON.stringify(metadata));
      }
      localStorage.setItem("mim-bookmarks", JSON.stringify(next));
      setBookmarks(next);
      setNotice("");
      window.dispatchEvent(new Event("mim-bookmarks-updated"));
    } catch { setNotice("Could not save. Check available browser storage and try again."); }
  }

  const open = useCallback((item: ReframeItem) => {
    setPreview(item);
    const url = new URL(window.location.href);
    url.searchParams.set("preview", item.id);
    window.history.replaceState(window.history.state, "", url.pathname + url.search);
  }, []);

  const close = useCallback(() => {
    setPreview(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("preview");
    window.history.replaceState(window.history.state, "", url.pathname + url.search);
  }, []);

  return <section className={"rf-gallery rf-gallery-" + variant + (home ? " rf-gallery-home" : "")}
      aria-label={kind === "video" ? "Video templates in a continuous Flow gallery" : "Image templates in a continuous Flow gallery"}
      data-layout="coverflow">
    <div className="rf-gallery-toolbar">
      <span className="rf-kicker">✳ FLOW GALLERY</span>
      <span className="rf-gallery-toolbar-note">SCROLL SIDEWAYS · DRAG OR SWIPE · AUTO-MOVING</span>
    </div>
    <ReframeMotionRail count={items.length} mode="coverflow" variant={variant}
       label={kind === "video" ? "Video templates" : "Image templates"} paused={Boolean(preview)}
       renderCard={(index, copy) => <GalleryCard item={items[index]} index={index}
         onOpen={open} onSave={save} shared={copy === 1}
         saved={bookmarks.includes(items[index].kind === "video" ? "video:" + items[index].id : items[index].id)} />}/>
    {notice && <p role="alert" className="rf-gallery-notice">{notice}</p>}
    <AnimatePresence>
      {preview && <ReframePreview key={preview.kind + preview.id} item={preview}
        onClose={close}
        saved={bookmarks.includes(preview.kind === "video" ? "video:" + preview.id : preview.id)}
        onSave={() => save(preview)} galleryPath={path}/>}
    </AnimatePresence>
  </section>;
}
