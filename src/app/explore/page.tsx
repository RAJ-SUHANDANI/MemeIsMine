"use client";

import Link from "next/link";
import { SiteFooter, LibraryNav } from "@/components/site-chrome";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ImagePlus, Search, Shuffle, X } from "lucide-react";
import { MemeCard, SiteHeader } from "@/components/site";
import { starterMemes, type MemeTemplate } from "@/data/memes";
import { isNewTemplate, newestDate } from "@/lib/catalog-freshness";

const categories = [
  "All",
  "Classics",
  "Reaction",
  "Relatable",
  "Animals",
  "Absurd",
  "Work",
] as const;
const sorts = [
  { value: "popular", label: "Popular" },
  { value: "trending", label: "Trending picks" },
  { value: "new", label: "New memes" },
  { value: "name", label: "Name A to Z" },
];
const pageSize = 24;

export default function ExplorePage() {
  const [memes, setMemes] = useState<MemeTemplate[]>(starterMemes);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [sort, setSort] = useState("popular");
  const [showCount, setShowCount] = useState(pageSize);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [shuffledIds, setShuffledIds] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedCategory = categories.find(
      (item) => item.toLowerCase() === params.get("category")?.toLowerCase(),
    );
    if (requestedCategory) setCategory(requestedCategory);
    if (params.get("sort") === "new") setSort("new");
    setQuery(params.get("q") ?? "");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCatalog() {
      const collected: MemeTemplate[] = [];
      let page = 1;
      while (!controller.signal.aborted) {
        const response = await fetch("/api/memes?limit=500&page=" + page, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.memes))
          throw new Error("Template catalog unavailable");
        collected.push(...data.memes);
        if (collected.length >= data.total || !data.memes.length) break;
        page++;
      }
      if (!controller.signal.aborted) {
        setMemes(collected);
        setUsingFallback(false);
      }
    }
    loadCatalog()
      .catch(() => {
        if (!controller.signal.aborted) setUsingFallback(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    const result = memes.filter(
      (meme) =>
        (category === "All" || meme.category === category) &&
        (sort !== "new" || isNewTemplate(meme)) &&
        meme.name.toLowerCase().includes(search),
    );

    if (sort === "shuffle") {
      const ranks = new Map(shuffledIds.map((id, index) => [id, index]));
      return result.sort(
        (a, b) => (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity),
      );
    }
    if (sort === "name")
      return result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "new")
      return result.sort((a, b) => newestDate(b) - newestDate(a));
    if (sort === "trending") {
      return result.sort(
        (a, b) =>
          Number(Boolean(b.trending)) - Number(Boolean(a.trending)) ||
          (b.popularity ?? 0) - (a.popularity ?? 0),
      );
    }
    return result.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }, [memes, query, category, sort, shuffledIds]);

  function shuffle() {
    const ids = memes.map((meme) => meme.id);
    for (let index = ids.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [ids[index], ids[other]] = [ids[other], ids[index]];
    }
    setShuffledIds(ids);
    setSort("shuffle");
    setShowCount(pageSize);
  }

  function clearFilters() {
    setQuery("");
    setCategory("All");
    setSort("popular");
    setShowCount(pageSize);
  }

  return (
    <main id="main-content" tabIndex={-1} className="image-library">
      <SiteHeader />
      <section className="container image-library-intro">
        <div>
          <h1>
            The meme <em>index.</em>
          </h1>
          <p>
            Find the face that says it for you. Open a preview, then make it
            yours.
          </p>
        </div>
        <Link href="/create/upload" className="button button-paper">
          <ImagePlus size={18} /> Use your own image
        </Link>
      </section>

      <div className="container library-shell">
        <LibraryNav
          kind="image"
          newOnly={sort === "new"}
          onNewChange={(active) => {
            setSort(active ? "new" : "popular");
            setShowCount(pageSize);
          }}
        />
        <section
          className="image-library-directory"
          aria-label="Image template directory"
        >
          <div className="image-library-toolbar">
            <div className="image-library-controls">
              <div className="library-search">
                <Search size={20} aria-hidden="true" />
                <input
                  id="image-template-search"
                  type="search"
                  value={query}
                  placeholder="Try Drake, Doge, or Two Buttons"
                  aria-label="Search meme templates"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setShowCount(pageSize);
                  }}
                />
                {query && (
                  <button
                    type="button"
                    className="template-icon-button"
                    aria-label="Clear search"
                    onClick={() => {
                      setQuery("");
                      setShowCount(pageSize);
                      document.getElementById("image-template-search")?.focus();
                    }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <label className="library-sort">
                <span>Sort</span>
                <select
                  value={sort}
                  aria-label="Sort templates"
                  onChange={(event) => {
                    setSort(event.target.value);
                    setShowCount(pageSize);
                  }}
                >
                  {sorts.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                  {sort === "shuffle" && (
                    <option value="shuffle">Shuffled</option>
                  )}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>
              <button
                className="button button-dark library-shuffle"
                type="button"
                onClick={shuffle}
                disabled={loading}
              >
                <Shuffle size={17} /> Shuffle
              </button>
            </div>
            <div
              className="library-categories"
              role="group"
              aria-label="Filter meme categories"
            >
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  aria-pressed={category === item}
                  onClick={() => {
                    setCategory(item);
                    setShowCount(pageSize);
                  }}
                >
                  {item === "All"
                    ? "All formats"
                    : item === "Reaction"
                      ? "Reactions"
                      : item}
                </button>
              ))}
            </div>
          </div>
          <div className="image-library-summary" role="status">
            <span>
              {loading
                ? "Loading the catalog…"
                : `${visible.length} ${visible.length === 1 ? "format" : "formats"}`}
            </span>
            {usingFallback && <span>Showing the starter collection</span>}
          </div>

          {!loading && visible.length === 0 && (
            <div className="empty-state">
              <h2>No formats found.</h2>
              <p>Try a shorter search or choose a different category.</p>
              <button className="button button-dark" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
          <div className="image-library-grid pinboard">
            {visible.slice(0, showCount).map((meme, index) => (
              <MemeCard key={meme.id} meme={meme} index={index} />
            ))}
          </div>
          {visible.length > showCount && (
            <div className="library-more">
              <button
                className="button button-paper"
                onClick={() => setShowCount(showCount + pageSize)}
              >
                Load more formats <ChevronDown size={17} />
              </button>
            </div>
          )}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
