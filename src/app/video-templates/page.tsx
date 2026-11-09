"use client";

import Link from "next/link";
import { SiteFooter, LibraryNav } from "@/components/site-chrome";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Clapperboard,
  Download,
  Film,
  Search,
  Video,
} from "lucide-react";
import { SiteHeader } from "@/components/site";
import {
  VideoTemplatePoster,
  type PreviewVideoTemplate,
} from "@/components/video-template-poster";

type VideoTemplate = PreviewVideoTemplate & {
  category: string;
  trending: boolean;
};
const filters = [
  { key: "popular", label: "Popular" },
  { key: "trending", label: "Trending" },
  { key: "new", label: "New memes" },
  { key: "name", label: "Name A to Z" },
  { key: "surprise", label: "Surprise me" },
];
const BOOKMARKS_KEY = "mim-bookmarks";

export default function VideoTemplatesPage() {
  const reduce = useReducedMotion();
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]");
      setSavedIds(
        Array.isArray(ids)
          ? ids.filter((id): id is string => typeof id === "string")
          : [],
      );
    } catch {
      setSavedIds([]);
    }
  }, []);
  function toggleBookmark(id: string) {
    const key = "video:" + id;
    setSavedIds((current) => {
      const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key];
      try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      } catch {
        /* Browser storage may be unavailable. */
      }
      window.dispatchEvent(new Event("mim-bookmarks-updated"));
      return next;
    });
  }
  const [filter, setFilter] = useState("popular");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [surpriseSeed, setSurpriseSeed] = useState(() =>
    Math.floor(Math.random() * 2147483647),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("sort") === "new")
      setFilter("new");
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setTemplates([]);
    const params = new URLSearchParams({
      page: String(page),
      limit: "24",
      sort: filter,
    });
    if (filter === "surprise") params.set("seed", String(surpriseSeed));
    if (debouncedQuery) params.set("q", debouncedQuery);
    fetch("/api/video-templates?" + params.toString(), {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(data.error ?? "Could not load video templates.");
        if (!alive) return;
        setTemplates(Array.isArray(data.templates) ? data.templates : []);
        setTotalPages(Math.max(1, Number(data.totalPages) || 1));
      })
      .catch((reason: unknown) => {
        if (
          !alive ||
          (reason instanceof DOMException && reason.name === "AbortError")
        )
          return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load video templates.",
        );
        setTemplates([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [page, filter, debouncedQuery, surpriseSeed]);
  function chooseFilter(key: string) {
    setFilter(key);
    setPage(1);
    if (key === "surprise")
      setSurpriseSeed((seed) => (seed + 104729) % 2147483647);
  }
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="paper-noise video-templates-page"
    >
      <SiteHeader />
      <section className="page-hero video-hero">
        <div className="container video-hero-grid">
          <div>
            <span className="eyebrow">Moving memes, ready to remix</span>
            <h1>
              Video templates.
              <br />
              <span>More reaction.</span>
            </h1>
            <p>
              Pick a GIF or video clip, position your captions, add overlays,
              and export your own version.
            </p>
            <div className="video-hero-points">
              <span>
                <Film size={14} /> GIF and video formats
              </span>
              <span>
                <MoveIcon /> Editable text layers
              </span>
              <span>
                <Download size={14} /> Browser export
              </span>
            </div>
          </div>
          <motion.div
            className="video-hero-art"
            initial={reduce ? false : { opacity: 0, y: 20, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={reduce ? undefined : { rotate: 2, y: -5 }}
          >
            <div className="video-art-top">
              <span>MEME IS MINE / MOTION DEPT.</span>
              <Clapperboard size={19} />
            </div>
            <div className="video-art-window">
              <div className="video-art-stamp">
                NOT
                <br />A STILL.
              </div>
              <div className="video-art-lines">
                SAY IT
                <br />
                <em>WITH</em>
                <br />
                MOTION.
              </div>
            </div>
            <div className="video-art-bottom">
              <span>CAPTIONS. LAYERS. ACTION.</span>
              <span>↗</span>
            </div>
          </motion.div>
        </div>
      </section>
      <div className="container library-shell">
        <LibraryNav
          kind="video"
          newOnly={filter === "new"}
          onNewChange={(active) => chooseFilter(active ? "new" : "popular")}
        />
        <section className="video-directory">
          <div className="video-directory-heading">
            <div>
              <span className="eyebrow">The moving collection</span>
              <h2 className="section-title">
                Find the <span className="serif-italic">moment.</span>
              </h2>
            </div>
            <span className="video-count">
              <Video size={15} />{" "}
              {loading
                ? "Checking the archive"
                : templates.length + " templates on this page"}
            </span>
          </div>
          <div className="video-filter-bar">
            <label className="search-wrap">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search video memes…"
                aria-label="Search video templates"
              />
            </label>
            <div
              className="filter-row"
              role="group"
              aria-label="Filter video templates"
            >
              {filters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={filter === item.key}
                  className={
                    filter === item.key ? "filter-pill active" : "filter-pill"
                  }
                  onClick={() => chooseFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {loading && (
            <div className="template-loading">
              <span className="tiny-dot" /> Updating the motion collection…
            </div>
          )}
          {error && (
            <div className="archive-message">
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && templates.length === 0 && (
            <div className="video-empty-state">
              <div className="video-empty-icon">
                <Clapperboard size={28} />
              </div>
              <h2>
                {filter === "new"
                  ? "No new clips match this search."
                  : "No clips match this search."}
              </h2>
              <p>
                Video clips are kept in their original format. New templates
                will appear here as the video catalog refreshes.
              </p>
              <div className="video-empty-actions">
                <Link className="button button-paper" href="/templates">
                  Browse image templates <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          )}
          {templates.length > 0 && (
            <div className="video-template-grid">
              {templates.map((template, index) => (
                <motion.article
                  key={template.id}
                  className="video-template-card"
                  initial={
                    reduce
                      ? false
                      : { opacity: 0, y: 18, rotate: index % 2 ? 1 : -1 }
                  }
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={{ once: true, amount: 0.08 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(index % 6, 5) * 0.035,
                  }}
                  whileHover={reduce ? undefined : { y: -3 }}
                >
                  <div className="video-template-preview">
                    <VideoTemplatePoster
                      template={template}
                      eager={index < 4}
                    />
                    <span className="video-kind-pill">
                      {template.mediaType === "gif" ? "GIF" : "VIDEO"}
                    </span>
                  </div>
                  <div className="video-template-meta">
                    <div>
                      <Link
                        href={
                          "/video-editor/" + encodeURIComponent(template.id)
                        }
                        className="video-template-name"
                      >
                        {template.name}
                      </Link>
                      <span>
                        {template.trending ? "Trending" : template.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={
                        savedIds.includes("video:" + template.id)
                          ? "save-button is-saved"
                          : "save-button"
                      }
                      onClick={() => toggleBookmark(template.id)}
                      aria-label={
                        savedIds.includes("video:" + template.id)
                          ? "Remove video template bookmark"
                          : "Bookmark video template"
                      }
                      aria-pressed={savedIds.includes("video:" + template.id)}
                      title={
                        savedIds.includes("video:" + template.id)
                          ? "Remove bookmark"
                          : "Save video template"
                      }
                    >
                      <Bookmark
                        size={17}
                        fill={
                          savedIds.includes("video:" + template.id)
                            ? "currentColor"
                            : "none"
                        }
                        strokeWidth={1.8}
                      />
                    </button>
                  </div>
                  <Link
                    className="video-library-edit"
                    href={"/video-editor/" + encodeURIComponent(template.id)}
                  >
                    Edit this template <ArrowUpRight size={16} />
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="archive-pagination">
              <button
                className="button button-paper button-small"
                disabled={loading || page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ArrowLeft size={14} /> Previous
              </button>
              <span>
                Page <strong>{page}</strong> of {totalPages}
              </span>
              <button
                className="button button-dark button-small"
                disabled={loading || page >= totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
              >
                Next page <ArrowRight size={14} />
              </button>
            </div>
          )}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
function MoveIcon() {
  return <span className="video-mini-move">↗</span>;
}
