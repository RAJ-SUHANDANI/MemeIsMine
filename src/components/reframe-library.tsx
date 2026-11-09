"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Clapperboard, ImagePlus, Search, Shuffle, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { SiteHeader } from "./site";
import { SiteFooter } from "./site-chrome";
import { ReframeGallery } from "./reframe-gallery";
import type { ReframeItem } from "./reframe-preview";
import { starterMemes } from "@/data/memes";

const categoryNames=["All","Classics","Reaction","Relatable","Animals","Absurd","Work"];
const sortOptions=[
 {key:"popular",label:"Most popular"},{key:"trending",label:"Trending"},{key:"new",label:"New arrivals"},{key:"name",label:"A to Z"},
];
const pageSize=24;
type ApiImage={id:string;name:string;url:string;category:string;source?:string;originalUrl?:string;likeId?:string};
type ApiVideo={id:string;name:string;url:string;posterUrl:string;category?:string;sourcePage?:string;mediaType:"gif"|"video";likeId?:string};

function imageItem(item:ApiImage):ReframeItem {
 return {id:item.id,name:item.name,image:item.url,kind:"image",category:item.category??"Still image",
  editorHref:"/create/"+encodeURIComponent(item.id)+(item.source==="indian"||item.source==="indianmemetemplates"?"?source=indian":""),
  likeId:item.likeId,sourceHref:item.originalUrl};
}
function videoItem(item:ApiVideo):ReframeItem {
 return {id:item.id,name:item.name,image:item.posterUrl??"",kind:"video",category:item.category??"Moving image",
  editorHref:"/video-editor/"+encodeURIComponent(item.id),likeId:item.likeId,sourceHref:item.sourcePage,
  mediaUrl:item.url,mediaType:item.mediaType};
}

export function ReframeLibrary({kind,mode="explore"}:{kind:"image"|"video";mode?:"explore"|"templates"}) {
 const reduce=useReducedMotion();
 const [query,setQuery]=useState("");
 const [search,setSearch]=useState("");
 const [sort,setSort]=useState("popular");
 const [category,setCategory]=useState("All");
 const [page,setPage]=useState(1);
 const [seed,setSeed]=useState(17);
 const [items,setItems]=useState<ReframeItem[]>([]);
 const [total,setTotal]=useState(0);
 const [pages,setPages]=useState(1);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [refresh,setRefresh]=useState(0);
 const path=kind==="video"?"/video-templates":mode==="templates"?"/templates":"/explore";
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  const initial=params.get("sort");
  if(initial && ["popular","trending","new","name"].includes(initial))setSort(initial);
  const q=params.get("q");if(q){setQuery(q);setSearch(q);}
  const c=params.get("category");if(c&&categoryNames.includes(c))setCategory(c);
 },[]);
 useEffect(()=>{const handle=window.setTimeout(()=>{setSearch(query.trim());setPage(1);},340);return()=>window.clearTimeout(handle);},[query]);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError("");
  const params=new URLSearchParams({page:String(page),limit:String(pageSize),sort});
  if(search)params.set("q",search);
  if(kind==="image"&&category!=="All")params.set("category",category);
  if(sort==="surprise")params.set("seed",String(seed));
  const endpoint=kind==="video"?"/api/video-templates":"/api/memes";
  fetch(endpoint+"?"+params.toString(),{signal:controller.signal})
   .then(async r=>{const data=await r.json();if(!r.ok||!data.success)throw Error(data.error??"The archive is unavailable.");
     if(controller.signal.aborted)return;
     const records=kind==="video"?(data.templates as ApiVideo[]):(data.memes as ApiImage[]);
     if(!Array.isArray(records))throw Error("The archive returned an unexpected response.");
     setItems(kind==="video"?records.map(videoItem):(records as ApiImage[]).map(imageItem));
     const count=Number(kind==="video"?data.totalItems:data.total);
     setTotal(Number.isFinite(count)?count:records.length);
     setPages(Math.max(1,kind==="video"?Number(data.totalPages)||1:Math.ceil((Number.isFinite(count)?count:records.length)/pageSize)));
   }).catch(reason=>{
     if(controller.signal.aborted)return;
     if(kind==="image"&&!search&&category==="All"){
       const fallback=starterMemes.map(imageItem);
       setItems(fallback);setTotal(fallback.length);setPages(1);
       setError("The live archive is unavailable. Showing familiar formats instead.");
     }else{setItems([]);setTotal(0);setPages(1);setError(reason instanceof Error?reason.message:"Could not load the archive.");}
   }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[kind,page,sort,category,search,seed,refresh]);
 const eyebrow=kind==="video"?"THE MOTION DEPARTMENT":mode==="templates"?"THE STILL IMAGE ARCHIVE":"THE INDEX OF EVERYTHING";
 const title=kind==="video"?"Moments in motion.":mode==="templates"?"Every image has a story.":"Find your next punchline.";
 const description=kind==="video"?"A living collection of reaction clips and GIFs. Find the perfect moment, then make it your own.":
  mode==="templates"?"Classic formats, obscure discoveries and the faces that say it all. Choose an arrangement and explore.":
  "A place for the internet's most expressive faces. Browse the archive like a gallery, not a spreadsheet.";
 function chooseSort(value:string){setSort(value);setPage(1);}
 function surprise(){if(kind==="video"){setSort("surprise");setSeed(n=>n+104729);setPage(1);}else{setSort("name");setPage(Math.max(1,Math.floor(Math.random()*pages)+1));}}
 function reset(){setQuery("");setSearch("");setCategory("All");setSort("popular");setPage(1);}
 const headingKey=kind+"-"+mode;
 return <main id="main-content" tabIndex={-1} className={"rf-site rf-library-page rf-library-"+kind}>
   <SiteHeader/>
   <section className="rf-library-hero">
     <div className="container rf-library-hero-inner">
       <motion.div key={headingKey} initial={reduce?false:{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.6,ease:[.22,1,.36,1]}}>
         <span className="rf-kicker"><span className="rf-kicker-star">✳</span> {eyebrow}</span>
         <h1>{title}</h1><p>{description}</p>
         <div className="rf-hero-cta-row">
           <Link href={kind==="video"?"/explore":"/video-templates"}>{kind==="video"?"Explore still images":"Browse moving memes"} <ArrowUpRight size={17}/></Link>
           {kind==="image"&&<Link href="/create/upload">Use your image <ImagePlus size={16}/></Link>}
         </div>
       </motion.div>
       <div className="rf-hero-index" aria-hidden="true"><strong>{kind==="video"?"02":"01"}</strong><span>THE MEME IS MINE<br/>ARCHIVE / 2026</span></div>
     </div>
   </section>
   <section className="container rf-library-workspace" aria-label="Browse templates">
     <div className="rf-library-controls">
       <div className="rf-search-field"><Search size={21}/><input type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder={kind==="video"?"Search a moment, scene or reaction":"Search Drake, Doge, reaction..."} aria-label="Search templates"/>
       {query&&<button type="button" aria-label="Clear search" onClick={()=>setQuery("")}><X size={17}/></button>}</div>
       <div className="rf-sort-select"><label htmlFor="rf-sort">SORT BY</label><select id="rf-sort" value={sort} onChange={e=>chooseSort(e.target.value)}>
         {sortOptions.map(option=><option key={option.key} value={option.key}>{option.label}</option>)}
         {sort==="surprise"&&<option value="surprise">Surprise</option>}</select></div>
       <button className="rf-surprise" type="button" onClick={surprise} disabled={loading}><Shuffle size={18}/> Surprise me</button>
     </div>
     {kind==="image"&&<div className="rf-category-strip" role="group" aria-label="Image categories">
       {categoryNames.map(name=><button type="button" key={name} aria-pressed={name===category} onClick={()=>{setCategory(name);setPage(1);}}>{name==="All"?"All formats":name}</button>)}
     </div>}
     <div className="rf-library-status" aria-live="polite"><span><span className="rf-status-dot"/>{loading?"SEARCHING THE ARCHIVE":total+" FORMATS IN THE COLLECTION"}</span><span>CHOOSE HOW TO SEE THEM <ArrowRight size={15}/></span></div>
     {error&&<div className="rf-library-error" role="status"><p>{error}</p><button type="button" onClick={()=>setRefresh(n=>n+1)}>Try again</button></div>}
     {loading?<div className="rf-gallery-loading" aria-busy="true"><div/><div/><div/><div/></div>:
      items.length?<ReframeGallery items={items} kind={kind} path={path} variant={kind==="video"?"objects":"showcase"}/>:
      <div className="rf-library-empty"><span>NOTHING IN FRAME</span><h2>No formats match that.</h2><p>Try a different search or return to the whole collection.</p><button type="button" onClick={reset}>Clear filters <ArrowUpRight size={18}/></button></div>}
     {!loading&&pages>1&&<div className="rf-pagination">
       <button type="button" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}><ArrowLeft size={18}/> Previous</button>
       <span>PAGE {String(page).padStart(2,"0")} / {String(pages).padStart(2,"0")}</span>
       <button type="button" disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>Next <ArrowRight size={18}/></button>
     </div>}
   </section>
   <section className="rf-library-endcap"><div className="container"><span className="rf-kicker">THERE'S ALWAYS ANOTHER WAY TO SAY IT</span><h2>Found the feeling?<br/><em>Make it yours.</em></h2><Link href="/create/upload">Start with your own image <ArrowUpRight size={19}/></Link></div></section>
   <SiteFooter/>
 </main>;
}
