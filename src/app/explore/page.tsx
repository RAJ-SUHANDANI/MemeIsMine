"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpRight, ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { SiteHeader, MemeCard } from "@/components/site";
import { starterMemes, type MemeTemplate } from "@/data/memes";
const categories = ["All", "Classics", "Reaction", "Relatable", "Animals", "Absurd", "Work"];
type LibraryMode = "mine" | "indian";
export default function ExplorePage() {
  const [memes, setMemes] = useState<MemeTemplate[]>(starterMemes);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("popular");
  const [showCount, setShowCount] = useState(24);
  const [loading, setLoading] = useState(true);
  const [library, setLibrary] = useState<LibraryMode>("mine");
  const [archivePage, setArchivePage] = useState(1);
  const [totalPages, setTotalPages] = useState(170);
  const [upstreamPageCount, setUpstreamPageCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedCategory = categories.find((item) => item.toLowerCase() === (params.get("category") ?? "").toLowerCase());
    if (requestedCategory) setCategory(requestedCategory);
    const requestedQuery = params.get("q");
    if (requestedQuery) setQuery(requestedQuery);
    if (params.get("source") === "mine") setLibrary("mine");
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 450);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    setLoading(true);
    setErrorMessage("");
    const url = library === "indian"
      ? "/api/indian-memes?page=" + archivePage + "&limit=24&sort=" + encodeURIComponent(sort) + (debouncedQuery ? "&q=" + encodeURIComponent(debouncedQuery) : "")
      : "/api/memes?limit=100" + (debouncedQuery ? "&q=" + encodeURIComponent(debouncedQuery) : "");
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error ?? "Could not load templates.");
        if (!alive) return;
        if (Array.isArray(data.memes)) setMemes(data.memes);
        setTotalPages(Number(data.totalPages) || 1);
        setUpstreamPageCount(Number(data.pageCount ?? data.count) || 0);
      })
      .catch((error: unknown) => {
        if (!alive || (error instanceof DOMException && error.name === "AbortError")) return;
        setErrorMessage(error instanceof Error ? error.message : "Could not load templates.");
        if (library === "mine") setMemes(starterMemes);
        else setMemes([]);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; controller.abort(); };
  }, [library, archivePage, debouncedQuery, sort]);
  const visible = useMemo(() => {
    let result = memes.filter((meme) => {
      const matchesQuery = library === "indian" || meme.name.toLowerCase().includes(query.toLowerCase().trim());
      const matchesCategory = library === "indian" || category === "All" || (meme.category ?? "Relatable").toLowerCase() === category.toLowerCase();
      return matchesQuery && matchesCategory;
    });
    if (sort === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "recent" || sort === "newest") result = [...result].sort((a, b) => {
      const dates = (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
      if (dates !== 0) return dates;
      const aId = Number(a.id), bId = Number(b.id);
      if (Number.isFinite(aId) && Number.isFinite(bId)) return bId - aId;
      return b.id.localeCompare(a.id, undefined, { numeric: true });
    });
    if (sort === "trending") result = [...result].sort((a, b) => Number(Boolean(b.trending)) - Number(Boolean(a.trending)) || (b.popularity ?? 0) - (a.popularity ?? 0));
    if (sort === "popular") result = [...result].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    return result;
  }, [memes, query, category, sort, library]);
  function switchLibrary(next: LibraryMode) {
    setLibrary(next); setArchivePage(1); setQuery(""); setDebouncedQuery(""); setCategory("All"); setSort("popular"); setShowCount(24); setErrorMessage("");
  }
  function changeQuery(value: string) {
    setQuery(value); setArchivePage(1); setShowCount(24);
  }
  return <main className="paper-noise"><SiteHeader/>
    <section className="page-hero"><div className="container"><span className="eyebrow">The format directory</span><h1>Find your <span>format.</span></h1><p>For the group chat, the group project, and whatever happened last night.</p></div></section>
    <section className="container">
      <div className="explore-controls">
        <label className="search-wrap"><Search size={17}/><input type="search" value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Search templates, reactions, situations…" aria-label="Search meme templates"/></label>
        {library === "mine" && <div className="filter-row" role="group" aria-label="Filter meme categories">{categories.map((item) => <button type="button" key={item} onClick={() => { setCategory(item); setShowCount(24); }} className={category === item ? "filter-pill active" : "filter-pill"}>{item}</button>)}</div>}
        <select className="sort-select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort templates"><option value="popular">Popular</option><option value="trending">Trending</option><option value="recent">Recent</option><option value="name">Name A to Z</option></select>
      </div>
      <div className="explore-summary">
        <span>{loading ? "Finding the formats…" : library === "indian" ? (upstreamPageCount || visible.length) + " templates on page " + archivePage + " of " + totalPages : visible.length + " formats found"}</span>
        <span>Template collection</span>
      </div>
      {errorMessage && <div className="archive-message"><p>{errorMessage}</p>{library === "indian" && <p>The template collection may be temporarily unavailable. Try again shortly.</p>}</div>}
      {!loading && !errorMessage && visible.length === 0 && <div className="empty-state"><SlidersHorizontal size={25}/><h2>No formats found.</h2><p>Try another search or clear the category filter.</p><button className="button button-dark button-small" onClick={() => { setQuery(""); setCategory("All"); setArchivePage(1); }}>Clear filters</button></div>}
      {visible.length > 0 && <motion.div layout className="template-grid explore-grid">{visible.slice(0, showCount).map((meme, index) => <MemeCard key={meme.id} meme={meme} index={index}/>)}</motion.div>}
      {library === "indian" && <div className="archive-pagination"><button className="button button-paper button-small" disabled={loading || archivePage <= 1} onClick={() => setArchivePage((page) => Math.max(1, page - 1))}><ArrowLeft size={14}/> Previous</button><span>Page <strong>{archivePage}</strong> of {totalPages}</span><button className="button button-dark button-small" disabled={loading || archivePage >= totalPages} onClick={() => setArchivePage((page) => Math.min(totalPages, page + 1))}>Next page <ArrowRight size={14}/></button></div>}
      {library === "mine" && visible.length > showCount && <button className="button button-paper load-more" onClick={() => setShowCount((count) => count + 24)}>Load more formats <ArrowUpRight size={15}/></button>}
    </section>
    <section className="container" style={{ paddingBottom: 75, paddingTop: 50 }}><div className="cta-panel"><div><span className="eyebrow">Got your own image?</span><h2>Bring your camera roll<br/>into the conversation.</h2></div><Link href="/create/upload" className="button button-dark">Upload your image <ArrowUpRight size={16}/></Link></div></section>
    <footer className="site-footer"><div className="container footer-inner"><div className="footer-copy">Meme Is Mine · Explore</div><div className="footer-links"><Link href="/">Home</Link><Link href="/studio">Your studio</Link></div><span className="footer-copy">Free to create. Ready to share.</span></div></footer>
  </main>;
}
