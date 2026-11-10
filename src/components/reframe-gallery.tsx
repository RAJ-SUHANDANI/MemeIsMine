/* Original Motion-driven gallery system. Premium Motion+ examples are references, not copied source. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Bookmark, Grid2X2, Layers3, LayoutList, PanelsTopLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ReframeMotionRail, type RailMode } from "./reframe-motion-rail";
import { ReframePreview, type ReframeItem } from "./reframe-preview";

export type GalleryLayout = "grid" | "coverflow" | "stack" | "list";
const layouts: { key: GalleryLayout; label: string; Icon: typeof Grid2X2 }[] = [
  { key: "coverflow", label: "Flow", Icon: PanelsTopLeft },
  { key: "stack", label: "Stack", Icon: Layers3 },
  { key: "grid", label: "Grid", Icon: Grid2X2 },
  { key: "list", label: "List", Icon: LayoutList },
];

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
          {item.image
            ? <img src={item.image} alt="" loading={shared && index < 3 ? "eager" : "lazy"} decoding="async" />
            : <span className="rf-poster-placeholder">MIM / {item.kind === "video" ? "MOTION" : "STILL"}</span>}
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
  const [layout, setLayout] = useState<GalleryLayout>(kind === "video" ? "stack" : "coverflow");
  const [preview, setPreview] = useState<ReframeItem | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [requested, setRequested] = useState<string | null>(null);

  useEffect(() => {
    if (!home) {
      try {
        const stored = localStorage.getItem("mim-gallery-mode-" + kind);
        if (stored === "grid" || stored === "coverflow" || stored === "stack" || stored === "list") setLayout(stored);
      } catch { /* Browsing is still available without storage. */ }
    }
    setBookmarks(storageIds());
    setRequested(new URL(window.location.href).searchParams.get("preview"));
    function changed() { setBookmarks(storageIds()); }
    window.addEventListener("storage", changed);
    window.addEventListener("mim-bookmarks-updated", changed);
    return () => {
      window.removeEventListener("storage", changed);
      window.removeEventListener("mim-bookmarks-updated", changed);
    };
  }, [kind, home]);

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

  function changeLayout(next: GalleryLayout) {
    setLayout(next);
    if (!home) {
      try { localStorage.setItem("mim-gallery-mode-" + kind, next); } catch { /* Optional preference. */ }
    }
  }

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

  const spatial = layout === "coverflow" || layout === "stack";
  const availableLayouts = home ? layouts.filter(({ key }) => key === "coverflow" || key === "stack") : layouts;

  return <section className={"rf-gallery rf-gallery-" + variant + (home ? " rf-gallery-home" : "")}
      aria-label={kind === "video" ? "Moving meme gallery" : "Image meme gallery"} data-layout={layout}>
    <div className="rf-gallery-toolbar">
      <div className="rf-arrangements" role="group" aria-label="Choose gallery arrangement">
        {availableLayouts.map(({ key, label, Icon }) =>
          <button key={key} type="button" aria-pressed={layout === key} onClick={() => changeLayout(key)}>
            <Icon size={17} aria-hidden="true" /><span>{label}</span>
          </button>
        )}
      </div>
      <span className="rf-gallery-toolbar-note">
        {spatial ? "A MOVING COLLECTION. YOUR PACE OR OURS." : "BROWSE THE ARCHIVE AT YOUR PACE."}
      </span>
    </div>
    {spatial ? <ReframeMotionRail count={items.length} mode={layout as RailMode} variant={variant}
        label={kind === "video" ? "Moving meme formats" : "Image meme formats"} paused={Boolean(preview)}
        renderCard={(index, copy) => <GalleryCard item={items[index]} index={index}
          onOpen={open} onSave={save} shared={copy === 1}
          saved={bookmarks.includes(items[index].kind === "video" ? "video:" + items[index].id : items[index].id)} />}
      /> :
      <div className="rf-gallery-stage" data-layout={layout}>
        {items.map((item, index) => <GalleryCard key={item.kind + "-" + item.id} item={item}
          index={index} onOpen={open} onSave={save}
          saved={bookmarks.includes(item.kind === "video" ? "video:" + item.id : item.id)} />)}
      </div>
    }
    {notice && <p role="alert" className="rf-gallery-notice">{notice}</p>}
    <AnimatePresence>
      {preview && <ReframePreview key={preview.kind + preview.id} item={preview}
        onClose={close}
        saved={bookmarks.includes(preview.kind === "video" ? "video:" + preview.id : preview.id)}
        onSave={() => save(preview)} galleryPath={path}/>}
    </AnimatePresence>
  </section>;
}
