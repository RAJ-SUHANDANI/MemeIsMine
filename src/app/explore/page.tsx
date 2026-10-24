"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { SiteHeader, MemeCard } from "@/components/site";
import { starterMemes, type MemeTemplate } from "@/data/memes";
const categories = ["All", "Classics", "Reaction", "Relatable", "Animals", "Absurd", "Work"];
export default function ExplorePage() {
  const [memes, setMemes] = useState<MemeTemplate[]>(starterMemes);
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("popular"); const [showCount, setShowCount] = useState(24);
  const [loading, setLoading] = useState(true); const [source, setSource] = useState("bundled");
  useEffect(() => {
    let alive = true;
    fetch("/api/memes?limit=100").then((res) => res.json()).then((data) => {
      if (alive && data.success && Array.isArray(data.memes) && data.memes.length) { setMemes(data.memes); setSource(data.source); }
    }).catch(() => undefined).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const visible = useMemo(() => {
    let result = memes.filter((meme) => meme.name.toLowerCase().includes(query.toLowerCase().trim()) && (category === "All" || (meme.category ?? "Relatable").toLowerCase() === category.toLowerCase()));
    if (sort === "name") result = [...result].sort((a,b) => a.name.localeCompare(b.name));
    if (sort === "newest") result = [...result].reverse();
    return result;
  }, [memes, query, category, sort]);
  return <main className="paper-noise"><SiteHeader/>
    <section className="page-hero"><div className="container"><span className="eyebrow">The format directory</span><h1>Find your <span>format.</span></h1><p>For the group chat, the group project, and whatever happened last night.</p></div></section>
    <section className="container">
      <div className="explore-controls">
        <label className="search-wrap"><Search size={17}/><input type="search" value={query} onChange={(event)=>{setQuery(event.target.value);setShowCount(24)}} placeholder="Search templates, reactions, situations…" aria-label="Search meme templates"/></label>
        <div className="filter-row" role="group" aria-label="Filter meme categories">{categories.map((item)=><button type="button" key={item} onClick={()=>{setCategory(item);setShowCount(24)}} className={category===item?"filter-pill active":"filter-pill"}>{item}</button>)}</div>
        <select className="sort-select" value={sort} onChange={(event)=>setSort(event.target.value)} aria-label="Sort templates"><option value="popular">Popular formats</option><option value="name">Name A–Z</option><option value="newest">Recently added</option></select>
      </div>
      <div className="explore-summary"><span>{loading?"Finding the formats…":`${visible.length} formats found`}</span><span>{source==="imgflip"?"Live template source · Imgflip":"Showing the local starter collection"}</span></div>
      {visible.length?<motion.div layout className="template-grid explore-grid">{visible.slice(0,showCount).map((meme,index)=><MemeCard key={meme.id} meme={meme} index={index}/>)}</motion.div>:<div className="empty-state"><SlidersHorizontal size={25}/><h2>No formats found.</h2><p>Try another search or clear the category filter.</p><button className="button button-dark button-small" onClick={()=>{setQuery("");setCategory("All")}}>Clear filters</button></div>}
      {visible.length>showCount&&<button className="button button-paper load-more" onClick={()=>setShowCount((count)=>count+24)}>Load more formats <ArrowUpRight size={15}/></button>}
    </section>
    <section className="container" style={{paddingBottom:75}}><div className="cta-panel"><div><span className="eyebrow">Got your own image?</span><h2>Bring your camera roll<br/>into the conversation.</h2></div><Link href="/create/upload" className="button button-dark">Upload your image <ArrowUpRight size={16}/></Link></div></section>
    <footer className="site-footer"><div className="container footer-inner"><div className="footer-copy">Meme Is Mine · Explore</div><div className="footer-links"><Link href="/">Home</Link><Link href="/studio">Your studio</Link></div><span className="footer-copy">Free to create. Ready to share.</span></div></footer>
  </main>;
}
