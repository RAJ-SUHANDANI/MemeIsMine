"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Clapperboard, Download, Film, Search, Sparkles, Video, Volume2, VolumeX } from "lucide-react";
import { SiteHeader } from "@/components/site";

type VideoTemplate = {
  id: string; name: string; url: string; posterUrl: string; category: string;
  mediaType: "gif" | "video"; publishedAt: string | null;
  trending: boolean; popularity: number;
};
const filters = [
  { key: "popular", label: "Popular" },
  { key: "trending", label: "Trending" },
  { key: "recent", label: "Recent" },
  { key: "name", label: "Name A to Z" },
];
function sourceUrl(template: VideoTemplate) {
  return "/api/video-source?url=" + encodeURIComponent(template.url);
}

function VideoPreview({ template }: { template: VideoTemplate }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    video.volume = 1;
    const attempt = video.play();
    if (attempt) {
      attempt.catch(() => {
        // Browsers commonly block audible autoplay. Keep the preview moving silently
        // until the viewer explicitly turns sound on.
        const current = videoRef.current;
        if (!current) return;
        current.muted = true;
        setMuted(true);
        void current.play().then(() => setReady(true)).catch(() => undefined);
      });
    }
  }, [template.url, muted]);

  function toggleMute(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !muted;
    video.muted = nextMuted;
    if (!nextMuted) video.volume = 1;
    setMuted(nextMuted);
    if (video.paused) void video.play().catch(() => {
      video.muted = true;
      setMuted(true);
    });
  }

  return <div className="video-preview-player">
    {(!ready || failed) && <div className="video-preview-placeholder">
      {template.posterUrl
        ? <img src={template.posterUrl} alt="" loading="lazy"/>
        : <div className="video-preview-placeholder-art"><Clapperboard size={30}/><span>VIDEO PREVIEW</span></div>}
    </div>}
    <video
      ref={videoRef}
      className={ready && !failed ? "video-preview-video is-ready" : "video-preview-video"}
      src={sourceUrl(template)}
      poster={template.posterUrl || undefined}
      muted={muted}
      autoPlay
      loop
      playsInline
      preload="auto"
      onLoadedData={() => setReady(true)}
      onCanPlay={() => setReady(true)}
      onError={() => setFailed(true)}
      aria-label={template.name}
    />
    <button type="button" className="video-audio-toggle" onClick={toggleMute} aria-label={muted ? "Unmute video" : "Mute video"} title={muted ? "Unmute video" : "Mute video"}>
      {muted ? <VolumeX size={15}/> : <Volume2 size={15}/>}
      <span>{muted ? "Unmute" : "Mute"}</span>
    </button>
  </div>;
}

export default function VideoTemplatesPage() {
  const reduce = useReducedMotion();
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [filter, setFilter] = useState("popular");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: "24", sort: filter });
    if (debouncedQuery) params.set("q", debouncedQuery);
    fetch("/api/video-templates?" + params.toString(), { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error ?? "Could not load video templates.");
        if (!alive) return;
        setTemplates(Array.isArray(data.templates) ? data.templates : []);
        setTotalPages(Math.max(1, Number(data.totalPages) || 1));
      })
      .catch((reason: unknown) => {
        if (!alive || (reason instanceof DOMException && reason.name === "AbortError")) return;
        setError(reason instanceof Error ? reason.message : "Could not load video templates.");
        setTemplates([]);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; controller.abort(); };
  }, [page, filter, debouncedQuery]);
  function chooseFilter(key: string) { setFilter(key); setPage(1); }
  return <main className="paper-noise video-templates-page">
    <SiteHeader/>
    <section className="page-hero video-hero"><div className="container video-hero-grid">
      <div><span className="eyebrow">Moving memes, ready to remix</span><h1>Video templates.<br/><span>More reaction.</span></h1><p>Pick a GIF or video clip, position your captions, add overlays, and export your own version.</p>
        <div className="video-hero-points"><span><Film size={14}/> GIF and video formats</span><span><MoveIcon/> Editable text layers</span><span><Download size={14}/> Browser export</span></div>
      </div>
      <motion.div className="video-hero-art" initial={reduce ? false : { opacity: 0, y: 20, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: .5 }} whileHover={reduce ? undefined : { rotate: 2, y: -5 }}>
        <div className="video-art-top"><span>MEME IS MINE / MOTION DEPT.</span><Clapperboard size={19}/></div>
        <div className="video-art-window"><div className="video-art-stamp">NOT<br/>A STILL.</div><div className="video-art-lines">SAY IT<br/><em>WITH</em><br/>MOTION.</div><span className="video-art-play">▶</span></div>
        <div className="video-art-bottom"><span>CAPTIONS. LAYERS. ACTION.</span><span>↗</span></div>
      </motion.div>
    </div></section>
    <section className="container video-directory">
      <div className="video-directory-heading"><div><span className="eyebrow">The moving collection</span><h2 className="section-title">Find the <span className="serif-italic">moment.</span></h2></div><span className="video-count"><Video size={15}/> {loading ? "Checking the archive" : templates.length + " templates on this page"}</span></div>
      <div className="video-filter-bar">
        <label className="search-wrap"><Search size={16}/><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search video memes…" aria-label="Search video templates"/></label>
        <div className="filter-row" role="group" aria-label="Filter video templates">{filters.map((item) => <button key={item.key} className={filter === item.key ? "filter-pill active" : "filter-pill"} onClick={() => chooseFilter(item.key)}>{item.label}</button>)}</div>
      </div>
      {error && <div className="archive-message"><p>{error}</p></div>}
      {!loading && !error && templates.length === 0 && <div className="video-empty-state"><div className="video-empty-icon"><Clapperboard size={28}/></div><h2>The motion catalog is syncing.</h2><p>Video clips are kept in their original format. New templates will appear here as the video catalog refreshes.</p><div className="video-empty-actions"><Link className="button button-paper" href="/templates">Browse image templates <ArrowRight size={15}/></Link></div></div>}
      {templates.length > 0 && <div className="video-template-grid">{templates.map((template, index) => <motion.article key={template.id} className="video-template-card" initial={reduce ? false : { opacity: 0, y: 18, rotate: index % 2 ? 1 : -1 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: .35, delay: Math.min(index % 6, 5) * .035 }} whileHover={reduce ? undefined : { y: -6, rotate: index % 2 ? 1 : -1 }}>
        <div className="video-template-preview">
          {template.mediaType === "gif" ? <Link className="video-template-media-link" href={"/video-editor/" + encodeURIComponent(template.id)} aria-label={"Edit " + template.name}><img src={sourceUrl(template)} alt={template.name} loading={index < 4 ? "eager" : "lazy"}/></Link> : <VideoPreview template={template}/>}
          <span className="video-kind-pill">{template.mediaType === "gif" ? "GIF" : "VIDEO"}</span><Link className={template.mediaType === "video" ? "video-edit-cue video-edit-cue-video" : "video-edit-cue"} href={"/video-editor/" + encodeURIComponent(template.id)}><Sparkles size={13}/> Edit this template <ArrowUpRight size={14}/></Link>
        </div>
        <div className="video-template-meta"><div><Link href={"/video-editor/" + encodeURIComponent(template.id)} className="video-template-name">{template.name}</Link><span>{template.trending ? "Trending" : template.category}</span></div></div>
      </motion.article>)}</div>}
      {totalPages > 1 && <div className="archive-pagination"><button className="button button-paper button-small" disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ArrowLeft size={14}/> Previous</button><span>Page <strong>{page}</strong> of {totalPages}</span><button className="button button-dark button-small" disabled={loading || page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next page <ArrowRight size={14}/></button></div>}
    </section>
    <footer className="site-footer"><div className="container footer-inner"><div className="footer-copy">Meme Is Mine · Video templates</div><div className="footer-links"><Link href="/explore">Image templates</Link><Link href="/how-it-works">How it works</Link><Link href="/about">About</Link></div><span className="footer-copy">Make a moment of it.</span></div></footer>
  </main>;
}
function MoveIcon() { return <span className="video-mini-move">↗</span>; }
