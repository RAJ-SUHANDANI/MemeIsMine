"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ArrowRight, MessageCircle, BriefcaseBusiness, Cat, Brain, Heart, Flame, ImagePlus, Clock3, Shuffle, TrendingUp, Sparkles } from "lucide-react";
import { SiteHeader, MemeCard } from "@/components/site";
import { starterMemes, type MemeTemplate } from "@/data/memes";
type FilterKey = "popular" | "trending" | "recent" | "surprise";
const templateFilters: {key:FilterKey;label:string;icon:typeof Flame}[] = [
 {key:"popular",label:"Popular",icon:Flame},
 {key:"trending",label:"Trending",icon:TrendingUp},
 {key:"recent",label:"Recent",icon:Clock3},
 {key:"surprise",label:"Surprise me",icon:Shuffle},
];
const SEEN_KEY = "mim-template-seen";
function shuffleTemplates<T>(items:T[]):T[]{return [...items].sort(()=>Math.random()-.5);}
function readSeenTemplates():string[]{
 try { const value=JSON.parse(localStorage.getItem(SEEN_KEY)??"[]"); return Array.isArray(value)?value.filter((id):id is string=>typeof id==="string"):[]; }
 catch { return []; }
}
function pickTemplates(items:MemeTemplate[],mode:FilterKey,excluded:Set<string>,count=12):MemeTemplate[]{
 if(!items.length)return [];
 let ranked=[...items];
 if(mode==="popular"){
  ranked.sort((a,b)=>(b.popularity??0)-(a.popularity??0));
 }else if(mode==="trending"){
  ranked.sort((a,b)=>Number(Boolean(b.trending))-Number(Boolean(a.trending))||(b.popularity??0)-(a.popularity??0));
 }else if(mode==="recent"){
  ranked.sort((a,b)=>(b.publishedAt??"").localeCompare(a.publishedAt??""));
 }else{
  ranked=shuffleTemplates(ranked);
 }
 const fresh=ranked.filter((item)=>!excluded.has(item.id));
 const seen=ranked.filter((item)=>excluded.has(item.id));
 return [...fresh,...seen].slice(0,Math.min(count,items.length));
}
const groups=[
 {name:"Classics",tag:"THE TIMELESS ONES",copy:"Formats that have lived through a thousand group chats and somehow still work.",icon:Flame,count:"EVERGREEN",href:"/explore?category=Classics",className:"template-feature red"},
 {name:"Reaction images",tag:"SAY IT WITHOUT SAYING IT",copy:"The exact facial expression for when words are not doing the job.",icon:MessageCircle,count:"INSTANT CONTEXT",href:"/explore?category=Reaction",className:"template-feature ink"},
 {name:"Relatable",tag:"SUSPICIOUSLY SPECIFIC",copy:"For missed deadlines, bad decisions, tiny wins, and being a person online.",icon:Heart,count:"VERY YOU",href:"/explore?category=Relatable",className:"template-feature paper"},
 {name:"Animals",tag:"CREATURES WITH RANGE",copy:"Cats, dogs, and other expressive icons of the internet.",icon:Cat,count:"PURE EXPRESSION",href:"/explore?category=Animals",className:"template-feature green"},
 {name:"Absurd",tag:"LOGIC HAS LEFT THE CHAT",copy:"For thoughts that took a strange turn and refuse to come back.",icon:Brain,count:"UNHINGED",href:"/explore?category=Absurd",className:"template-feature lilac"},
 {name:"Work & study",tag:"PROFESSIONALLY DISTRACTED",copy:"Meetings, deadlines, studying, and pretending the tab is work.",icon:BriefcaseBusiness,count:"OFFICE FUEL",href:"/explore?category=Work",className:"template-feature ink"},
];
export default function TemplatesPage(){
 const reduce=useReducedMotion();
 const [allTemplates,setAllTemplates]=useState<MemeTemplate[]>(starterMemes);
 const [visibleTemplates,setVisibleTemplates]=useState<MemeTemplate[]>([]);
 const [filter,setFilter]=useState<FilterKey>("surprise");
 const [loadingTemplates,setLoadingTemplates]=useState(true);
 const [catalogError,setCatalogError]=useState("");
 const [seenIds,setSeenIds]=useState<string[]>([]);
 const [indianPage,setIndianPage]=useState(1);
 const [indianTotalPages,setIndianTotalPages]=useState(1);
 const [loadingMore,setLoadingMore]=useState(false);
 useEffect(()=>{
  let alive=true;
  Promise.allSettled([
   fetch("/api/memes?limit=100").then((response)=>response.json()),
   fetch("/api/indian-memes?page=1&limit=100").then((response)=>response.json()),
  ]).then((results)=>{
   if(!alive)return;
   const pulled=results.flatMap((result)=>result.status==="fulfilled"&&result.value?.success&&Array.isArray(result.value.memes)?result.value.memes as MemeTemplate[]:[]);
   const indianResult=results[1];
   if(indianResult.status==="fulfilled"&&indianResult.value?.success){
    setIndianPage(1);
    setIndianTotalPages(Math.max(1,Number(indianResult.value.totalPages)||1));
   }
   const unique=Array.from(new Map([...pulled,...starterMemes].map((item)=>[item.id,item])).values());
   const seen=readSeenTemplates();
   setAllTemplates(unique); setSeenIds(seen);
   setVisibleTemplates(pickTemplates(unique,"surprise",new Set(seen),12));
   if(!pulled.length)setCatalogError("Showing the starter collection while the larger template catalogs are unavailable.");
  }).catch(()=>{if(alive){setCatalogError("Showing the starter collection while the larger template catalogs are unavailable.");setVisibleTemplates(pickTemplates(starterMemes,"surprise",new Set(readSeenTemplates()),12));}})
   .finally(()=>{if(alive)setLoadingTemplates(false);});
  return()=>{alive=false;};
 },[]);
 const markSeen=useCallback((id:string)=>{
  setSeenIds((previous)=>{
   if(previous.includes(id))return previous;
   const next=[...previous,id].slice(-2000);
   try{localStorage.setItem(SEEN_KEY,JSON.stringify(next));}catch{/* Local storage may be disabled. */}
   return next;
  });
 },[]);
 function selectFilter(next:FilterKey){setFilter(next);setVisibleTemplates(pickTemplates(allTemplates,next,new Set(readSeenTemplates()),12));}
 async function loadMore(){
  setLoadingMore(true);
  const excluded=new Set([...readSeenTemplates(),...visibleTemplates.map((item)=>item.id)]);
  let pool=[...allTemplates];
  let nextPage=indianPage;
  let more=pickTemplates(pool,filter,excluded,12);
  try{
   while(more.length<12&&nextPage<indianTotalPages){
    nextPage+=1;
    const response=await fetch("/api/indian-memes?page="+nextPage+"&limit=100&sort="+encodeURIComponent(filter==="surprise"?"popular":filter));
    const data=await response.json();
    if(!response.ok||!data.success||!Array.isArray(data.memes))break;
    const byId=new Map([...pool,...(data.memes as MemeTemplate[])].map((item)=>[item.id,item]));
    pool=Array.from(byId.values());
    more=pickTemplates(pool,filter,excluded,12);
   }
  }catch{/* Use the templates already loaded when the source archive is unavailable. */}
  setIndianPage(nextPage);
  setAllTemplates(pool);
  if(more.length){
   setVisibleTemplates((previous)=>[...previous,...more]);
  }else{
   const cycle=pickTemplates(pool,filter,new Set(visibleTemplates.map((item)=>item.id)),12);
   if(cycle.length)setVisibleTemplates((previous)=>[...previous,...cycle]);
  }
  setLoadingMore(false);
 }
 return <main className="paper-noise"><SiteHeader/>
  <section className="page-hero"><div className="container"><span className="eyebrow">A format for every flavour of chaos</span><h1>The meme <span>index.</span></h1><p>Browse by mood, situation, or the exact energy you’re trying to communicate.</p></div></section>
  <section className="section templates-discovery"><div className="container">
   <div className="section-head"><div><span className="eyebrow">Fresh picks, every visit</span><h2 className="section-title">New faces.<br/><span className="serif-italic">Same internet.</span></h2></div><p className="section-note">This selection reshuffles every visit. Templates are marked as seen as you scroll, so the next batch favours ones you have not opened yet.</p></div>
   <div className="template-sort-bar" role="group" aria-label="Sort template suggestions">{templateFilters.map((item)=>{const Icon=item.icon;return <button key={item.key} className={filter===item.key?"template-sort-button active":"template-sort-button"} onClick={()=>selectFilter(item.key)}><Icon size={15}/>{item.label}</button>;})}<span className="template-seen-count"><Sparkles size={13}/>{seenIds.length} seen</span></div>
   {catalogError&&<p className="control-help">{catalogError}</p>}
   {loadingTemplates&&<div className="template-loading"><span className="tiny-dot"/> Finding a fresh set of templates…</div>}
   {!loadingTemplates&&<div className="template-grid template-discovery-grid">{visibleTemplates.map((meme,index)=><MemeCard key={meme.id} meme={meme} index={index} onSeen={markSeen}/>)}</div>}
   {!loadingTemplates&&<div className="section-footer"><button className="button button-paper" disabled={loadingMore} onClick={loadMore}>{loadingMore?"Finding more templates…":"Show more templates"} <ArrowRight size={15}/></button></div>}
  </div></section>
  <section className="section"><div className="container"><div className="section-head"><div><span className="eyebrow">Pick your lane</span><h2 className="section-title">WHAT’S THE<br/><span className="serif-italic">SITUATION?</span></h2></div><p className="section-note">Choose a collection to open the library with a useful starting point.</p></div>
   <div className="template-category-grid">{groups.map((group,i)=><motion.article key={group.name} className={group.className} initial={reduce?false:{opacity:0,y:18,rotate:i%2?1:-1}} whileInView={{opacity:1,y:0,rotate:0}} whileHover={reduce?undefined:{y:-7,rotate:i%2?1.5:-1.5}} viewport={{once:true,amount:.1}} transition={{duration:.4,delay:i*.04}}><Link href={group.href}><div className="template-feature-head"><span>{group.tag}</span><group.icon size={23}/></div><h3>{group.name}<span>.</span></h3><p>{group.copy}</p><div className="template-feature-foot"><small>{group.count}</small><span className="feature-go"><ArrowUpRight size={18}/></span></div></Link></motion.article>)}</div>
  </div></section>
  <section className="section section-dark"><div className="container"><div className="section-head"><div><span className="eyebrow">Moving memes</span><h2 className="section-title">A LITTLE MORE<br/><span className="serif-italic">MOTION.</span></h2></div><p className="section-note" style={{color:"#c4bcb0"}}>Browse animated reactions, position your captions, add overlays, and render a new WebM in the browser.</p></div><Link href="/video-templates" className="button button-red">Explore video templates <ArrowUpRight size={16}/></Link></div></section>
  <section className="section section-dark"><div className="container"><div className="section-head"><div><span className="eyebrow">No template? No problem.</span><h2 className="section-title">BRING YOUR<br/><span className="serif-italic">OWN MATERIAL.</span></h2></div><p className="section-note" style={{color:"#c4bcb0"}}>Start from a photo or image on your device and put the joke exactly where you want it.</p></div><Link href="/create/upload" className="button button-red">Upload an image <ImagePlus size={16}/></Link></div></section>
  <footer className="site-footer"><div className="container footer-inner"><div className="footer-copy">Meme Is Mine · Template index</div><div className="footer-links"><Link href="/explore">Explore all</Link><Link href="/video-templates">Video templates</Link><Link href="/how-it-works">How it works</Link><Link href="/faq">FAQ</Link></div><span className="footer-copy">Created by Raj Suhandani</span></div></footer>
 </main>;
}
